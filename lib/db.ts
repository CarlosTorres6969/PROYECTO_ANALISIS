import sql from 'mssql';
import type { config as mssqlConfig } from 'mssql';

// Helper function to parse the connection string into an mssql config object
function parseConnectionString(connStr: string): mssqlConfig {
  console.log('Parsing connection string:', connStr);
  const parts = connStr.split(';').filter((p) => p.trim() !== '');
  console.log('Parts after splitting by semicolon:', parts);

  const config: mssqlConfig = {
    server: '',
    user: '',
    password: '',
    database: '',
    options: {
      encrypt: true, // Required for Azure SQL
      trustServerCertificate: false, // Set to true for local dev/self-signed certs
    },
  };

  for (const part of parts) {
    const [key, value] = part.split('=').map((s) => s.trim());
    const lowerKey = key.toLowerCase();
    console.log(`Processing part: ${part}, Key: ${key}, Value: ${value}`);

    if (lowerKey === 'server') {
      let serverValue = value;
      if (serverValue.startsWith('tcp:')) {
        serverValue = serverValue.substring(4); // Remove "tcp:"
      }
      const serverParts = serverValue.split(',');
      config.server = serverParts[0]; // Server name/IP
      if (serverParts.length > 1) {
        config.port = Number.parseInt(serverParts[1], 10); // Extract port
      }
      console.log('Server parsed:', config.server, 'Port:', config.port);
    } else if (lowerKey === 'user id') {
      config.user = value;
    } else if (lowerKey === 'password') {
      config.password = value;
    } else if (lowerKey === 'database') {
      config.database = value;
    } else if (lowerKey === 'encrypt') {
      config.options!.encrypt = value.toLowerCase() === 'true';
    } else if (lowerKey === 'trustservercertificate') {
      config.options!.trustServerCertificate = value.toLowerCase() === 'true';
    } else if (lowerKey === 'connection timeout') {
      config.options!.connectTimeout = Number(value) * 1000; // Convert seconds to milliseconds
    }
  }

  console.log('Final config.server before validation:', config.server);
  if (!config.server) {
    throw new Error('La propiedad "Server" es requerida en la cadena de conexión DB_CONNECTION_STRING.');
  }
  if (!config.database) {
    console.warn(
      'Nombre de la base de datos no encontrado en la cadena de conexión. Usando "master" como predeterminado.',
    );
    config.database = 'master';
  }

  return config;
}

const rawConnectionString =
  process.env.DB_CONNECTION_STRING ||
  'Server=tcp:dwunah.database.windows.net,1433;Database=buses_boletos;User Id=JCK@dwunah;Password=Oracle.1244;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;';

let pool: sql.ConnectionPool | null = null;

// Obtener conexión a la base de datos
export async function getConnection() {
  if (pool && pool.connected) {
    console.log('Reutilizando pool de conexiones existente');
    return pool;
  }
  try {
    const config = parseConnectionString(rawConnectionString);
    console.log('Configuración para conectar:', {
      server: config.server,
      database: config.database,
      user: config.user,
      port: config.port,
      options: config.options,
    });
    pool = await sql.connect(config);
    console.log('Conexión exitosa a la base de datos:', config.database);
    return pool;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error al conectar a SQL Server:', errorMessage);
    throw new Error(`No se pudo conectar a la base de datos: ${errorMessage}`);
  }
}

// Cerrar conexión
export async function closeConnection(poolToClose: sql.ConnectionPool) {
  try {
    if (poolToClose && poolToClose.connected) {
      await poolToClose.close();
      console.log('Conexión cerrada exitosamente');
      pool = null; // Reset the global pool
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error al cerrar la conexión:', errorMessage);
    throw new Error(`No se pudo cerrar la conexión: ${errorMessage}`);
  }
}

// Ejemplo de endpoint para Next.js (ruta: /api/viajes)
export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_viaje, id_ruta, id_autobus, modelo_autobus, tipo_asiento, fecha_salida, hora_salida
      FROM VIAJES
      INNER JOIN RUTAS ON VIAJES.id_ruta = RUTAS.id_ruta
      INNER JOIN AUTOBUSES ON VIAJES.id_autobus = AUTOBUSES.id_autobus
    `);
    console.log('Datos obtenidos:', result.recordset);
    return new Response(JSON.stringify(result.recordset), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Agregar CORS si el frontend está en otro dominio
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error en el endpoint GET /api/viajes:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export { sql };