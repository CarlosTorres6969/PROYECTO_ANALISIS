import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

export async function GET() {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
      SELECT id_estacion, nombre_estacion, ciudad, direccion
      FROM ESTACIONES;
    `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching stations:", error)
    return NextResponse.json({ error: "Failed to fetch stations" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function POST(request: Request) {
  let pool
  try {
    const { nombre_estacion, ciudad, direccion } = await request.json()
    if (!nombre_estacion || !ciudad) {
      return NextResponse.json({ error: "Nombre de estación y ciudad son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("nombre", sql.VarChar(255), nombre_estacion)
      .input("ciudad", sql.VarChar(255), ciudad)
      .input("direccion", sql.VarChar(255), direccion)
      .query(`
        INSERT INTO ESTACIONES (nombre_estacion, ciudad, direccion)
        OUTPUT INSERTED.*
        VALUES (@nombre, @ciudad, @direccion);
      `)
    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating station:", error)
    if (error.number === 2627) {
      return NextResponse.json({ error: "Ya existe una estación con este nombre." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create station" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
