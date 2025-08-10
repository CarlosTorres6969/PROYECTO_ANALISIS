import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Bus, Route, Ticket, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/currency" // <- IMPORTACIÓN CORRECTA
import { getConnection, closeConnection } from "@/lib/db"

interface DashboardStats {
  totalUsers: number
  totalBuses: number
  totalRoutes: number
  totalTrips: number
  totalTickets: number
  totalRevenue: number
  totalStations: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  let pool
  try {
    pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM USUARIOS) AS TotalUsers,
        (SELECT COUNT(*) FROM AUTOBUSES) AS TotalBuses,
        (SELECT COUNT(*) FROM RUTAS) AS TotalRoutes,
        (SELECT COUNT(*) FROM VIAJES) AS TotalTrips,
        (SELECT COUNT(*) FROM BOLETOS) AS TotalTickets,
        (SELECT ISNULL(SUM(monto), 0) FROM PAGOS) AS TotalRevenue,
        (SELECT COUNT(*) FROM ESTACIONES) AS TotalStations;
    `)

    const stats = result.recordset[0]
    return {
      totalUsers: stats.TotalUsers,
      totalBuses: stats.TotalBuses,
      totalRoutes: stats.TotalRoutes,
      totalTrips: stats.TotalTrips,
      totalTickets: stats.TotalTickets,
      totalRevenue: stats.TotalRevenue,
      totalStations: stats.TotalStations,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalUsers: 0,
      totalBuses: 0,
      totalRoutes: 0,
      totalTrips: 0,
      totalTickets: 0,
      totalRevenue: 0,
      totalStations: 0,
    }
  } finally {
    if (pool) await closeConnection(pool)
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Totales ( L )</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Basado en pagos completados</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Total de usuarios en el sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Autobuses Registrados</CardTitle>
          <Bus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBuses}</div>
          <p className="text-xs text-muted-foreground">Vehículos disponibles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rutas Activas</CardTitle>
          <Route className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRoutes}</div>
          <p className="text-xs text-muted-foreground">Rutas de viaje configuradas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Viajes Programados</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTrips}</div>
          <p className="text-xs text-muted-foreground">Viajes disponibles o completados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Boletos Vendidos</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTickets}</div>
          <p className="text-xs text-muted-foreground">Total de boletos emitidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estaciones Registradas</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStations}</div>
          <p className="text-xs text-muted-foreground">Puntos de partida y llegada</p>
        </CardContent>
      </Card>
    </div>
  )
}
