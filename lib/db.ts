import sql from "mssql"
import type { config as mssqlConfig } from "mssql"

// Helper function to parse the connection string into an mssql config object
function parseConnectionString(connStr: string): mssqlConfig {
  console.log("Parsing connection string:", connStr) // Log input string
  const parts = connStr.split(";").filter((p) => p.trim() !== "")
  console.log("Parts after splitting by semicolon:", parts) // Log parts

  const config: mssqlConfig = {
    server: "",
    user: "",
    password: "",
    database: "",
    options: {
      encrypt: true, // Default to true for Azure SQL Database
      trustServerCertificate: false, // Default to false for production, true for local dev / self-signed certs
    },
  }

  for (const part of parts) {
    const [key, value] = part.split("=").map((s) => s.trim())
    const lowerKey = key.toLowerCase()
    console.log(`Processing part: ${part}, Key: ${key}, Value: ${value}`) // Log each part's key/value

    if (lowerKey === "server") {
      let serverValue = value
      if (serverValue.startsWith("tcp:")) {
        serverValue = serverValue.substring(4) // Remove "tcp:"
      }
      const serverParts = serverValue.split(",")
      config.server = serverParts[0] // Just the server name/IP
      if (serverParts.length > 1) {
        config.port = Number.parseInt(serverParts[1], 10) // Extract port
      }
      console.log("Server parsed:", config.server, "Port:", config.port) // Log parsed server/port
    } else if (lowerKey === "user id") {
      config.user = value
    } else if (lowerKey === "password") {
      config.password = value
    } else if (lowerKey === "database") {
      config.database = value
    } else if (lowerKey === "encrypt") {
      config.options!.encrypt = value.toLowerCase() === "true"
    } else if (lowerKey === "trustservercertificate") {
      config.options!.trustServerCertificate = value.toLowerCase() === "true"
    } else if (lowerKey === "connection timeout") {
      config.options!.requestTimeout = Number(value) * 1000 // Convert seconds to milliseconds
    }
    // Add other options as needed
  }

  console.log("Final config.server before validation:", config.server) // Log final server value
  // Validate that server is set
  if (!config.server) {
    throw new Error("La propiedad 'Server' es requerida en la cadena de conexión DB_CONNECTION_STRING.")
  }
  // Provide a default database if not specified, or throw an error
  if (!config.database) {
    console.warn(
      "Nombre de la base de datos no encontrado en la cadena de conexión. Usando 'master' como predeterminado. Por favor, especifica 'Database=your_db_name' en DB_CONNECTION_STRING.",
    )
    config.database = "master" // Fallback
  }

  return config
}


const rawConnectionString =
  process.env.DB_CONNECTION_STRING ||
  "Server=tcp:dwunah.database.windows.net,1433;Database=buses_boletos;User Id=JCK;Password=Oracle.1244;Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"

let pool: sql.ConnectionPool | null = null

// Obtener conexión a la base de datos
export async function getConnection() {
  // Reutilizar el pool si ya está conectado
  if (pool && pool.connected) {
    return pool
  }
  try {
    const config = parseConnectionString(rawConnectionString)
    pool = await sql.connect(config)
    return pool
  } catch (err) {
    console.error("Error al conectar a SQL Server:", err)
    throw err
  }
}

// Cerrar conexión
export async function closeConnection(poolToClose: sql.ConnectionPool) {
  try {
    if (poolToClose && poolToClose.connected) {
      await poolToClose.close()
      pool = null // Reset the global pool after closing
    }
  } catch (err) {
    console.error("Error al cerrar la conexión:", err)
  }
}

export { sql }
