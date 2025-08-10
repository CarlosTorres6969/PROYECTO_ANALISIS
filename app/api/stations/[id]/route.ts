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
        SELECT id_estacion, nombre_estacion, ciudad, direccion
        FROM ESTACIONES
        WHERE id_estacion = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error fetching station:", error)
    return NextResponse.json({ error: "Failed to fetch station" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    const { nombre_estacion, ciudad, direccion } = await request.json()
    if (!nombre_estacion || !ciudad) {
      return NextResponse.json({ error: "Nombre de estación y ciudad son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar(255), nombre_estacion)
      .input("ciudad", sql.VarChar(255), ciudad)
      .input("direccion", sql.VarChar(255), direccion)
      .query(`
        UPDATE ESTACIONES
        SET nombre_estacion = @nombre, ciudad = @ciudad, direccion = @direccion
        OUTPUT INSERTED.*
        WHERE id_estacion = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error: any) {
    console.error("Error updating station:", error)
    if (error.number === 2627) {
      return NextResponse.json({ error: "Ya existe una estación con este nombre." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update station" }, { status: 500 })
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
        DELETE FROM ESTACIONES
        OUTPUT DELETED.id_estacion
        WHERE id_estacion = @id;
      `)
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Station deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting station:", error)
    if (error.number === 547) {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: "No se puede eliminar la estación porque tiene rutas asociadas." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Failed to delete station" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
