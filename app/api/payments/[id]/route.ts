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
          P.id_pago,
          P.id_boleto,
          P.monto,
          P.fecha_pago,
          P.metodo_pago,
          P.estado_pago,
          U.nombre AS nombre_usuario,
          U.apellido AS apellido_usuario,
          B.id_viaje
        FROM PAGOS P
        JOIN BOLETOS B ON P.id_boleto = B.id_boleto
        JOIN USUARIOS U ON B.id_usuario = U.id_usuario
        WHERE P.id_pago = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    const { id_boleto, monto, fecha_pago, metodo_pago, estado_pago } = await request.json()
    if (!id_boleto || !monto || !fecha_pago || !metodo_pago || !estado_pago) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("id_boleto", sql.Int, id_boleto)
      .input("monto", sql.Decimal(10, 2), monto)
      .input("fecha_pago", sql.Date, fecha_pago)
      .input("metodo_pago", sql.VarChar(100), metodo_pago)
      .input("estado_pago", sql.VarChar(50), estado_pago)
      .query(`
        UPDATE PAGOS
        SET id_boleto = @id_boleto, monto = @monto, fecha_pago = @fecha_pago, metodo_pago = @metodo_pago, estado_pago = @estado_pago
        OUTPUT INSERTED.*
        WHERE id_pago = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
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
        DELETE FROM PAGOS
        OUTPUT DELETED.id_pago
        WHERE id_pago = @id;
      `)
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
