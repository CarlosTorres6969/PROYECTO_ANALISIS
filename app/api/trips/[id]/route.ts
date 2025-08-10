import { NextResponse } from "next/server";
import { getConnection, sql, closeConnection } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let pool;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .input("id_viaje", sql.Int, id)
      .query(`
        SELECT
          V.id_viaje,
          V.id_ruta,
          V.id_autobus,
          A.modelo AS modelo_autobus,
          A.tipo_asiento,
          V.fecha_salida,
          V.hora_salida
        FROM VIAJES V
        JOIN RUTAS R ON V.id_ruta = R.id_ruta
        JOIN AUTOBUSES A ON V.id_autobus = A.id_autobus
        WHERE V.id_viaje = @id_viaje;
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error(`Error fetching trip with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error fetching trip", error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (pool) await closeConnection(pool);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let pool;
  try {
    const { id_ruta, id_autobus, fecha_salida, hora_salida } = await request.json();
    const updates: string[] = [];
    const inputs: { name: string; type: sql.ISqlType | (() => sql.ISqlType); value: any }[] = [];

    if (id_ruta !== undefined) {
      updates.push("id_ruta = @id_ruta");
      inputs.push({ name: "id_ruta", type: sql.Int, value: id_ruta });
    }
    if (id_autobus !== undefined) {
      updates.push("id_autobus = @id_autobus");
      inputs.push({ name: "id_autobus", type: sql.Int, value: id_autobus });
    }
    if (fecha_salida !== undefined) {
      updates.push("fecha_salida = @fecha_salida");
      inputs.push({ name: "fecha_salida", type: sql.Date, value: fecha_salida });
    }
    if (hora_salida !== undefined) {
      updates.push("hora_salida = @hora_salida");
      inputs.push({ name: "hora_salida", type: sql.VarChar(5), value: hora_salida });
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    pool = await getConnection();
    const requestBuilder = pool.request();
    inputs.forEach((input) => requestBuilder.input(input.name, input.type, input.value));
    requestBuilder.input("id_viaje", sql.Int, id);

    const query = `UPDATE VIAJES SET ${updates.join(", ")} WHERE id_viaje = @id_viaje;`;
    const result = await requestBuilder.query(query);

    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ message: "Trip not found or no changes made" }, { status: 404 });
    }
    return NextResponse.json({ message: "Trip updated successfully" });
  } catch (error) {
    console.error(`Error updating trip with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error updating trip", error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (pool) await closeConnection(pool);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let pool;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .input("id_viaje", sql.Int, id)
      .query("DELETE FROM VIAJES WHERE id_viaje = @id_viaje");

    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error(`Error deleting trip with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error deleting trip", error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (pool) await closeConnection(pool);
  }
}