import { NextResponse, NextRequest } from "next/server";
import { getConnection, sql, closeConnection } from "@/lib/db";

// Obtener todos los autobuses
export async function GET() {
  let pool;
  try {
    pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_autobus, modelo, capacidad_asientos, matricula, tipo_asiento
      FROM AUTOBUSES;
    `);
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching buses:", error);
    return NextResponse.json({ error: "Failed to fetch buses" }, { status: 500 });
  } finally {
    if (pool) await closeConnection(pool);
  }
}

// Crear nuevo autobús
export async function POST(request: NextRequest) {
  let pool;
  try {
    const { modelo, capacidad_asientos, matricula, tipo_asiento } = await request.json();

    if (!modelo || !capacidad_asientos || !matricula || !tipo_asiento) {
      return NextResponse.json(
        { error: "Modelo, capacidad_asientos, matricula y tipo_asiento son requeridos." },
        { status: 400 }
      );
    }

    pool = await getConnection();
    const result = await pool
      .request()
      .input("modelo", sql.VarChar(255), modelo)
      .input("capacidad_asientos", sql.Int, capacidad_asientos)
      .input("matricula", sql.VarChar(50), matricula)
      .input("tipo_asiento", sql.VarChar(100), tipo_asiento)
      .query(`
        INSERT INTO AUTOBUSES (modelo, capacidad_asientos, matricula, tipo_asiento)
        OUTPUT INSERTED.*
        VALUES (@modelo, @capacidad_asientos, @matricula, @tipo_asiento);
      `);

    const newBus = result.recordset[0];
    return NextResponse.json(newBus, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bus:", error);
    // Check for unique constraint violation (error number for SQL Server)
    if (error.number === 2627) {
      return NextResponse.json(
        { error: "Ya existe un autobús con esta matricula." },
        { status: 409 } // 409 Conflict is more appropriate
      );
    }
    return NextResponse.json({ error: "Failed to create bus" }, { status: 500 });
  } finally {
    if (pool) await closeConnection(pool);
  }
}
