import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

export async function GET() {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
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
      JOIN ESTACIONES E_Destino ON R.id_destino_estacion = E_Destino.id_estacion;
    `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching routes:", error)
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function POST(request: Request) {
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
      .input("id_origen_estacion", sql.Int, id_origen_estacion)
      .input("id_destino_estacion", sql.Int, id_destino_estacion)
      .input("distancia_km", sql.Decimal(10, 2), distancia_km)
      .input("duracion_estimada_min", sql.Int, duracion_estimada_min)
      .query(`
        INSERT INTO RUTAS (id_origen_estacion, id_destino_estacion, distancia_km, duracion_estimada_min)
        OUTPUT INSERTED.*
        VALUES (@id_origen_estacion, @id_destino_estacion, @distancia_km, @duracion_estimada_min);
      `)
    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating route:", error)
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
