import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

export async function GET() {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
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
      JOIN USUARIOS U ON B.id_usuario = U.id_usuario;
    `)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function POST(request: Request) {
  let pool
  try {
    const { id_boleto, monto, fecha_pago, metodo_pago, estado_pago } = await request.json()
    if (!id_boleto || !monto || !fecha_pago || !metodo_pago || !estado_pago) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id_boleto", sql.Int, id_boleto)
      .input("monto", sql.Decimal(10, 2), monto)
      .input("fecha_pago", sql.Date, fecha_pago)
      .input("metodo_pago", sql.VarChar(100), metodo_pago)
      .input("estado_pago", sql.VarChar(50), estado_pago)
      .query(`
        INSERT INTO PAGOS (id_boleto, monto, fecha_pago, metodo_pago, estado_pago)
        OUTPUT INSERTED.*
        VALUES (@id_boleto, @monto, @fecha_pago, @metodo_pago, @estado_pago);
      `)
    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
