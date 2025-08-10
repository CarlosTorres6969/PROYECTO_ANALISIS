"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Station {
  id_estacion: number
  nombre_estacion: string
}

interface Route {
  id_ruta: number
  id_origen_estacion: number
  id_destino_estacion: number
  nombre_origen: string
  nombre_destino: string
  distancia_km: number
  duracion_estimada_min: number
}

interface NewRoute {
  id_origen_estacion: number
  id_destino_estacion: number
  distancia_km: number
  duracion_estimada_min: number
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [newRoute, setNewRoute] = useState<NewRoute>({ id_origen_estacion: 0, id_destino_estacion: 0, distancia_km: 0, duracion_estimada_min: 0 })
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [isNewRouteDialogOpen, setIsNewRouteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchRoutes()
    fetchStations()
  }, [])

  const fetchRoutes = async () => {
    try {
      const res = await fetch("/api/routes")
      if (!res.ok) throw new Error("Failed to fetch routes")
      const data = await res.json()
      setRoutes(data)
    } catch (error) {
      console.error("Error fetching routes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutas.",
        variant: "destructive",
      })
    }
  }

  const fetchStations = async () => {
    try {
      const res = await fetch("/api/stations")
      if (!res.ok) throw new Error("Failed to fetch stations")
      const data = await res.json()
      setStations(data.map((s: any) => ({ id_estacion: s.id_estacion, nombre_estacion: s.nombre_estacion })))
    } catch (error) {
      console.error("Error fetching stations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estaciones para las rutas.",
        variant: "destructive",
      })
    }
  }

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoute),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create route")
      }
      toast({
        title: "Éxito",
        description: "Ruta creada correctamente.",
      })
      setNewRoute({ id_origen_estacion: 0, id_destino_estacion: 0, distancia_km: 0, duracion_estimada_min: 0 })
      setIsNewRouteDialogOpen(false)
      fetchRoutes()
    } catch (error: any) {
      console.error("Error creating route:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la ruta.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRoute) return
    try {
      const res = await fetch(`/api/routes/${editingRoute.id_ruta}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRoute),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update route")
      }
      toast({
        title: "Éxito",
        description: "Ruta actualizada correctamente.",
      })
      setEditingRoute(null)
      setIsEditDialogOpen(false)
      fetchRoutes()
    } catch (error: any) {
      console.error("Error updating route:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la ruta.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta ruta?")) return
    try {
      const res = await fetch(`/api/routes/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete route")
      }
      toast({
        title: "Éxito",
        description: "Ruta eliminada correctamente.",
      })
      fetchRoutes()
    } catch (error: any) {
      console.error("Error deleting route:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la ruta.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Rutas</CardTitle>
        <Dialog open={isNewRouteDialogOpen} onOpenChange={setIsNewRouteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Ruta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoute} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_origen_estacion" className="text-right">
                  Origen
                </Label>
                <Select
                  onValueChange={(value) => setNewRoute({ ...newRoute, id_origen_estacion: Number(value) })}
                  value={newRoute.id_origen_estacion ? newRoute.id_origen_estacion.toString() : ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona estación de origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id_estacion} value={station.id_estacion.toString()}>
                        {station.nombre_estacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_destino_estacion" className="text-right">
                  Destino
                </Label>
                <Select
                  onValueChange={(value) => setNewRoute({ ...newRoute, id_destino_estacion: Number(value) })}
                  value={newRoute.id_destino_estacion ? newRoute.id_destino_estacion.toString() : ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona estación de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id_estacion} value={station.id_estacion.toString()}>
                        {station.nombre_estacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="distancia_km" className="text-right">
                  Distancia (km)
                </Label>
                <Input
                  id="distancia_km"
                  type="number"
                  value={newRoute.distancia_km}
                  onChange={(e) => setNewRoute({ ...newRoute, distancia_km: Number(e.target.value) })}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duracion_estimada_min" className="text-right">
                  Duración (min)
                </Label>
                <Input
                  id="duracion_estimada_min"
                  type="number"
                  value={newRoute.duracion_estimada_min}
                  onChange={(e) => setNewRoute({ ...newRoute, duracion_estimada_min: Number(e.target.value) })}
                  className="col-span-3"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="submit">Guardar Ruta</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Distancia (km)</TableHead>
              <TableHead>Duración (min)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id_ruta}>
                <TableCell>{route.id_ruta}</TableCell>
                <TableCell>{route.nombre_origen}</TableCell>
                <TableCell>{route.nombre_destino}</TableCell>
                <TableCell>{route.distancia_km}</TableCell>
                <TableCell>{route.duracion_estimada_min}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2 bg-transparent"
                    onClick={() => {
                      setEditingRoute(route)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRoute(route.id_ruta)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editingRoute && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Ruta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateRoute} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-id_origen_estacion" className="text-right">
                    Origen
                  </Label>
                  <Select
                    onValueChange={(value) => setEditingRoute((prev) => (prev ? { ...prev, id_origen_estacion: Number(value) } : prev))}
                    value={editingRoute.id_origen_estacion ? editingRoute.id_origen_estacion.toString() : ""}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona estación de origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id_estacion} value={station.id_estacion.toString()}>
                          {station.nombre_estacion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-id_destino_estacion" className="text-right">
                    Destino
                  </Label>
                  <Select
                    onValueChange={(value) => setEditingRoute((prev) => (prev ? { ...prev, id_destino_estacion: Number(value) } : prev))}
                    value={editingRoute.id_destino_estacion ? editingRoute.id_destino_estacion.toString() : ""}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona estación de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id_estacion} value={station.id_estacion.toString()}>
                          {station.nombre_estacion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-distancia_km" className="text-right">
                    Distancia (km)
                  </Label>
                  <Input
                    id="edit-distancia_km"
                    type="number"
                    value={editingRoute.distancia_km}
                    onChange={(e) => setEditingRoute((prev) => (prev ? { ...prev, distancia_km: Number(e.target.value) } : prev))}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-duracion_estimada_min" className="text-right">
                    Duración (min)
                  </Label>
                  <Input
                    id="edit-duracion_estimada_min"
                    type="number"
                    value={editingRoute.duracion_estimada_min}
                    onChange={(e) => setEditingRoute((prev) => (prev ? { ...prev, duracion_estimada_min: Number(e.target.value) } : prev))}
                    className="col-span-3"
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
