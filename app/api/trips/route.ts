import { getConnection, sql, closeConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
  SELECT V.id_viaje, V.id_ruta, V.id_autobus, V.fecha_salida, V.hora_salida, 
       V.fecha_llegada_estimada, V.hora_llegada_estimada, V.precio_base,
       R.duracion_estimada_min, R.distancia_km,
       OS.nombre_estacion AS origen_nombre, OS.ciudad AS origen_ciudad,
       DS.nombre_estacion AS destino_nombre, DS.ciudad AS destino_ciudad,
       A.modelo AS autobus_modelo, A.matricula AS autobus_matricula
FROM VIAJES V
JOIN RUTAS R ON V.id_ruta = R.id_ruta
JOIN ESTACIONES OS ON R.id_origen_estacion = OS.id_estacion
JOIN ESTACIONES DS ON R.id_destino_estacion = DS.id_estacion
JOIN AUTOBUSES A ON V.id_autobus = A.id_autobus;
`)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ message: "Error fetching trips", error }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export async function POST(request: Request) {
  let pool
  try {
    const { id_ruta, id_autobus, fecha_salida, hora_salida, fecha_llegada, hora_llegada, precio_base } =
      await request.json()
    if (!id_ruta || !id_autobus || !fecha_salida || !hora_salida || !fecha_llegada || !hora_llegada || !precio_base ) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    pool = await getConnection()
    const result = await pool
      .request()
      .input("id_ruta", sql.Int, id_ruta)
      .input("id_autobus", sql.Int, id_autobus)
      .input("fecha_salida", sql.Date, fecha_salida)
      .input("hora_salida", sql.Time, hora_salida)
      .input("fecha_llegada", sql.Date, fecha_llegada)
      .input("hora_llegada", sql.Time, hora_llegada)
      .input("precio_base", sql.Decimal(10, 2), precio_base)
      .query(`
        INSERT INTO VIAJES (id_ruta, id_autobus, fecha_salida, hora_salida, fecha_llegada_estimada, hora_llegada_estimada, precio_base, )
        VALUES (@id_ruta, @id_autobus, @fecha_salida, @hora_salida, @fecha_llegada, @hora_llegada, @precio_base, );
        SELECT SCOPE_IDENTITY() AS id_viaje;
      `)

    const newTripId = result.recordset[0].id_viaje
    return NextResponse.json(
      { id_viaje: newTripId, id_ruta, id_autobus, fecha_salida, hora_salida, fecha_llegada, hora_llegada, precio_base },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json({ message: "Error creating trip", error }, { status: 500 })
  } finally {
    if (pool) await closeConnection(pool)
  }
}
