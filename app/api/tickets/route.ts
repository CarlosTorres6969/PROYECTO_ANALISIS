import { NextResponse } from "next/server"
import { getConnection, sql, closeConnection } from "@/lib/db"

interface Ticket {
  id_boleto: number
  id_viaje: number
  id_usuario: number
  precio_total: number
  fecha_compra: string
  estado_boleto: string
  nombre_usuario: string
  apellido_usuario: string
  nombre_ruta_origen: string
  nombre_ruta_destino: string
}

export async function GET() {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
       SELECT
        B.id_boleto,
        B.id_viaje,
        B.id_usuario,
        B.precio_total,
        B.fecha_compra,
        B.estado_boleto,
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
      JOIN ESTACIONES RD ON RT.id_destino_estacion = RD.id_estacion;
    `)

    const formattedTickets = result.recordset.map((ticket: Ticket) => ({
      ...ticket,
      nombre_ruta: `${ticket.nombre_ruta_origen} - ${ticket.nombre_ruta_destino}`,
    }))

    return NextResponse.json(formattedTickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function POST(request: Request) {
  let pool
  try {
    const { id_viaje, id_usuario,precio_total, estado_boleto } = await request.json()

    if (!id_viaje || !id_usuario || !precio_total || !estado_boleto) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos." },
        { status: 400 }
      )
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id_viaje", sql.Int, id_viaje)
      .input("id_usuario", sql.Int, id_usuario)
      .input("precio_total", sql.Decimal(10, 2), precio_total)
      .input("estado_boleto", sql.VarChar(50), estado_boleto)
      .query(`
        INSERT INTO BOLETOS (id_viaje, id_usuario, precio_total, estado_boleto)
        OUTPUT INSERTED.*
        VALUES (@id_viaje, @id_usuario,  @precio_total, @estado_boleto);
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating ticket:", error)
    if (error.number === 2627) {
      return NextResponse.json(
        { error: "Este asiento ya está reservado para este viaje." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
