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
          B.id_boleto,
          B.id_viaje,
          B.id_usuario,
          B.precio_total,
          B.fecha_compra,
          B.estado_boleto_boleto,
          U.nombre AS nombre_usuario,
          U.apellido AS apellido_usuario,
          R.nombre_estacion AS nombre_ruta_origen,
          RD.nombre_estacion AS nombre_ruta_destino,
          V.fecha_salida AS fecha_viaje,
          V.hora_salida AS hora_viaje
        FROM BOLETOS B
        JOIN USUARIOS U ON B.id_usuario = U.id_usuario
        JOIN VIAJES V ON B.id_viaje = V.id_viaje
        JOIN RUTAS RT ON V.id_ruta = RT.id_ruta
        JOIN ESTACIONES R ON RT.id_origen_estacion = R.id_estacion
        JOIN ESTACIONES RD ON RT.id_destino_estacion = RD.id_estacion
        WHERE B.id_boleto = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = result.recordset[0]
    const formattedTicket = {
      ...ticket,
      nombre_ruta: `${ticket.nombre_ruta_origen} - ${ticket.nombre_ruta_destino}`,
    }

    return NextResponse.json(formattedTicket)
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  let pool
  try {
    const { id_viaje, id_usuario,  precio_total, estado_boleto } = await request.json()
    if (!id_viaje || !id_usuario || !precio_total || !estado_boleto) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("id_viaje", sql.Int, id_viaje)
      .input("id_usuario", sql.Int, id_usuario)
      .input("precio_total", sql.Decimal(10, 2), precio_total)
      .input("estado_boleto", sql.VarChar(50), estado_boleto)
      .query(`
        UPDATE BOLETOS
        SET id_viaje = @id_viaje, id_usuario = @id_usuario,precio_total = @precio_total, estado_boleto = @estado_boleto
        OUTPUT INSERTED.*
        WHERE id_boleto = @id;
      `)
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }
    return NextResponse.json(result.recordset[0])
  } catch (error: any) {
    console.error("Error updating ticket:", error)
    if (error.number === 2627) {
      return NextResponse.json({ error: "Este asiento ya está reservado para este viaje." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
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
        DELETE FROM BOLETOS
        OUTPUT DELETED.id_boleto
        WHERE id_boleto = @id;
      `)
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Ticket deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting ticket:", error)
    if (error.number === 547) {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: "No se puede eliminar el boleto porque tiene pagos asociados." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
