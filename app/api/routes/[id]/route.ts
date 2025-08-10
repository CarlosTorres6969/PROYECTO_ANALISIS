import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          R.id_ruta,
          R.id_origen_estacion,
          R.id_destino_estacion,
          E_Origen.nombre_estacion AS nombre_origen,
          E_Destino.nombre_estacion AS nombre_destino,
          R.distancia_km,
          R.duracion_estimada_min
        FROM RUTAS R
        JOIN ESTACIONES E_Origen ON R.id_origen_estacion = E_Origen.id_estacion
        JOIN ESTACIONES E_Destino ON R.id_destino_estacion = E_Destino.id_estacion
        WHERE R.id_ruta = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error fetching route:", error)
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    const { id_origen_estacion, id_destino_estacion, distancia_km, duracion_estimada_min } = await request.json()
    if (!id_origen_estacion || !id_destino_estacion || !distancia_km || !duracion_estimada_min) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 })
    }
    if (id_origen_estacion === id_destino_estacion) {
      return NextResponse.json({ error: "La estación de origen y destino no pueden ser la misma." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("id_origen_estacion", sql.Int, id_origen_estacion)
      .input("id_destino_estacion", sql.Int, id_destino_estacion)
      .input("distancia_km", sql.Decimal(10, 2), distancia_km)
      .input("duracion_estimada_min", sql.Int, duracion_estimada_min)
      .query(`
        UPDATE RUTAS
        SET id_origen_estacion = @id_origen_estacion, 
            id_destino_estacion = @id_destino_estacion, 
            distancia_km = @distancia_km, 
            duracion_estimada_min = @duracion_estimada_min
        OUTPUT INSERTED.*
        WHERE id_ruta = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error: any) {
    console.error("Error updating route:", error)
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM RUTAS
        OUTPUT DELETED.id_ruta
        WHERE id_ruta = @id;
      `)
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Route deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting route:", error)
    if (error.number === 547) {
      return NextResponse.json(
        { error: "No se puede eliminar la ruta porque tiene viajes asociados." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Failed to delete route" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
