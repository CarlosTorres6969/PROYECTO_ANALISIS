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
        SELECT id_usuario, nombre, apellido, email, telefono
        FROM USUARIOS
        WHERE id_usuario = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    const { nombre, apellido, email, telefono } = await request.json()
    if (!nombre || !apellido || !email) {
      return NextResponse.json({ error: "Nombre, apellido y email son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar(255), nombre)
      .input("apellido", sql.VarChar(255), apellido)
      .input("email", sql.VarChar(255), email)
      .input("telefono", sql.VarChar(50), telefono)
      .query(`
        UPDATE USUARIOS
        SET nombre = @nombre, apellido = @apellido, email = @email, telefono = @telefono
        OUTPUT INSERTED.*
        WHERE id_usuario = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error: any) {
    console.error("Error updating user:", error)
    if (error.number === 2627) {
      return NextResponse.json({ error: "Ya existe un usuario con este email." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
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
        DELETE FROM USUARIOS
        OUTPUT DELETED.id_usuario
        WHERE id_usuario = @id;
      `)
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    if (error.number === 547) {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: "No se puede eliminar el usuario porque tiene boletos o pagos asociados." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
