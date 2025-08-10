"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { PlusCircle } from "lucide-react"

interface Station {
  id_estacion: number
  nombre_estacion: string
  ciudad: string
  direccion: string | null
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [newStation, setNewStation] = useState({ nombre_estacion: "", ciudad: "", direccion: "" })
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [isNewStationDialogOpen, setIsNewStationDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    try {
      const res = await fetch("/api/stations")
      if (!res.ok) throw new Error("Failed to fetch stations")
      const data = await res.json()
      setStations(data)
    } catch (error) {
      console.error("Error fetching stations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estaciones.",
        variant: "destructive",
      })
    }
  }

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStation),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create station")
      }
      toast({
        title: "Éxito",
        description: "Estación creada correctamente.",
      })
      setNewStation({ nombre_estacion: "", ciudad: "", direccion: "" })
      setIsNewStationDialogOpen(false)
      fetchStations()
    } catch (error: any) {
      console.error("Error creating station:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la estación.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStation) return
    try {
      const res = await fetch(`/api/stations/${editingStation.id_estacion}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStation),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update station")
      }
      toast({
        title: "Éxito",
        description: "Estación actualizada correctamente.",
      })
      setEditingStation(null)
      setIsEditDialogOpen(false)
      fetchStations()
    } catch (error: any) {
      console.error("Error updating station:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la estación.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStation = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta estación?")) return
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete station")
      }
      toast({
        title: "Éxito",
        description: "Estación eliminada correctamente.",
      })
      fetchStations()
    } catch (error: any) {
      console.error("Error deleting station:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la estación.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Estaciones</CardTitle>
        <Dialog open={isNewStationDialogOpen} onOpenChange={setIsNewStationDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Estación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Estación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStation} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre_estacion" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nombre_estacion"
                  value={newStation.nombre_estacion}
                  onChange={(e) => setNewStation({ ...newStation, nombre_estacion: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ciudad" className="text-right">
                  Ciudad
                </Label>
                <Input
                  id="ciudad"
                  value={newStation.ciudad}
                  onChange={(e) => setNewStation({ ...newStation, ciudad: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="direccion" className="text-right">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={newStation.direccion}
                  onChange={(e) => setNewStation({ ...newStation, direccion: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Guardar Estación</Button>
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
              <TableHead>Nombre</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((station) => (
              <TableRow key={station.id_estacion}>
                <TableCell>{station.id_estacion}</TableCell>
                <TableCell>{station.nombre_estacion}</TableCell>
                <TableCell>{station.ciudad}</TableCell>
                <TableCell>{station.direccion || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2 bg-transparent"
                    onClick={() => {
                      setEditingStation(station)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteStation(station.id_estacion)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editingStation && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Estación</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateStation} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nombre_estacion" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="edit-nombre_estacion"
                    value={editingStation.nombre_estacion}
                    onChange={(e) => setEditingStation({ ...editingStation, nombre_estacion: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-ciudad" className="text-right">
                    Ciudad
                  </Label>
                  <Input
                    id="edit-ciudad"
                    value={editingStation.ciudad}
                    onChange={(e) => setEditingStation({ ...editingStation, ciudad: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-direccion" className="text-right">
                    Dirección
                  </Label>
                  <Input
                    id="edit-direccion"
                    value={editingStation.direccion || ""}
                    onChange={(e) => setEditingStation({ ...editingStation, direccion: e.target.value })}
                    className="col-span-3"
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
