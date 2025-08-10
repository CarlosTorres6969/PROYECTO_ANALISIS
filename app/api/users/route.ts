import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

export async function GET() {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
      SELECT id_usuario, nombre, apellido, email, telefono
      FROM USUARIOS;
    `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function POST(request: Request) {
  let pool
  try {
    const { nombre, apellido, email, telefono } = await request.json()
    if (!nombre || !apellido || !email) {
      return NextResponse.json({ error: "Nombre, apellido y email son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("nombre", sql.VarChar(255), nombre)
      .input("apellido", sql.VarChar(255), apellido)
      .input("email", sql.VarChar(255), email)
      .input("telefono", sql.VarChar(50), telefono)
      .query(`
        INSERT INTO USUARIOS (nombre, apellido, email, telefono)
        OUTPUT INSERTED.*
        VALUES (@nombre, @apellido, @email, @telefono);
      `)
    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    if (error.number === 2627) {
      return NextResponse.json({ error: "Ya existe un usuario con este email." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
