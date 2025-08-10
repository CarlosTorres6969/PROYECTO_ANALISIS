import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params // This 'id' is the seat_id
  let pool
  try {
    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id_asiento, autobus_id, numero_asiento, disponible
        FROM ASIENTOS
        WHERE id_asiento = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error fetching seat:", error)
    return NextResponse.json({ error: "Failed to fetch seat" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    const { disponible } = await request.json()
    if (typeof disponible !== "boolean") {
      return NextResponse.json({ error: "El estado 'disponible' es requerido y debe ser booleano." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("disponible", sql.Bit, disponible)
      .query(`
        UPDATE ASIENTOS
        SET disponible = @disponible
        OUTPUT INSERTED.*
        WHERE id_asiento = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error updating seat:", error)
    return NextResponse.json({ error: "Failed to update seat" }, { status: 500 })
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
        DELETE FROM ASIENTOS
        OUTPUT DELETED.id_asiento
        WHERE id_asiento = @id;
      `)
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Seat deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting seat:", error)
    if (error.number === 547) {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: "No se puede eliminar el asiento porque está asociado a un boleto." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Failed to delete seat" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
