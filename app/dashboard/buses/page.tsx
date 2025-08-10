"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Edit, Trash2 } from "lucide-react"

interface Bus {
  id_autobus: number
  modelo: string
  capacidad_asientos: number
  matricula: string
  tipo_asiento: string
}

const seatTypes = ["normal", "premium", "vip"]

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [formBus, setFormBus] = useState({
    modelo: "",
    capacidad_asientos: 1,
    matricula: "",
    tipo_asiento: "normal",
  })

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    try {
      const res = await fetch("/api/buses")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar buses")
      setBuses(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los autobuses.",
        variant: "destructive",
      })
    }
  }

  const openEditBusForm = (bus: Bus) => {
    setEditingBus(bus)
    setFormBus({
      modelo: bus.modelo,
      capacidad_asientos: bus.capacidad_asientos,
      matricula: bus.matricula,
      tipo_asiento: bus.tipo_asiento,
    })
  }

  const clearForm = () => {
    setEditingBus(null)
    setFormBus({ modelo: "", capacidad_asientos: 1, matricula: "", tipo_asiento: "normal" })
  }

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault()
    const { modelo, capacidad_asientos, matricula, tipo_asiento } = formBus

    if (!modelo || capacidad_asientos <= 0 || !matricula) {
      toast({
        title: "Error",
        description: "Modelo, capacidad y matrícula son requeridos y deben ser válidos.",
        variant: "destructive",
      })
      return
    }

    try {
      let res: Response

      if (editingBus) {
        // Solo enviamos tipo_asiento para actualizar
        res = await fetch(`/api/buses/${editingBus.id_autobus}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo_asiento }),
        })
      } else {
        // En POST enviamos todos los datos
        res = await fetch("/api/buses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formBus),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error guardando autobús")

      toast({
        title: "Éxito",
        description: editingBus
          ? "Autobús actualizado correctamente."
          : "Autobús creado correctamente.",
      })

      clearForm()
      fetchBuses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el autobús.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBus = async (id_autobus: number) => {
    if (!confirm("¿Estás seguro que deseas eliminar este autobús?")) return
    try {
      const res = await fetch(`/api/buses/${id_autobus}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al eliminar autobús")
      toast({
        title: "Éxito",
        description: "Autobús eliminado correctamente.",
      })
      fetchBuses()
      if (editingBus?.id_autobus === id_autobus) clearForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar autobús.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Autobuses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario siempre visible */}
        <form onSubmit={handleSaveBus} className="grid gap-4 max-w-md mx-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelo" className="text-right">Modelo</Label>
            <Input
              id="modelo"
              value={formBus.modelo}
              onChange={(e) => setFormBus({ ...formBus, modelo: e.target.value })}
              className="col-span-3"
              required
              disabled={!!editingBus} // opcional: evitar editar modelo si quieres
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capacidad_asientos" className="text-right">Capacidad</Label>
            <Input
              id="capacidad_asientos"
              type="number"
              min={1}
              value={formBus.capacidad_asientos}
              onChange={(e) =>
                setFormBus({ ...formBus, capacidad_asientos: Number(e.target.value) })
              }
              className="col-span-3"
              required
              disabled={!!editingBus} // opcional
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="matricula" className="text-right">Matrícula</Label>
            <Input
              id="matricula"
              value={formBus.matricula}
              onChange={(e) => setFormBus({ ...formBus, matricula: e.target.value })}
              className="col-span-3"
              required
              disabled={!!editingBus} // opcional
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipo_asiento" className="text-right">Tipo de Asiento</Label>
            <select
              id="tipo_asiento"
              className="col-span-3 border rounded px-2 py-1"
              value={formBus.tipo_asiento}
              onChange={(e) => setFormBus({ ...formBus, tipo_asiento: e.target.value })}
            >
              {seatTypes.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between">
            {editingBus && (
              <Button variant="outline" onClick={clearForm}>
                Cancelar edición
              </Button>
            )}
            <Button type="submit">{editingBus ? "Guardar Cambios" : "Añadir Autobús"}</Button>
          </div>
        </form>

        {/* Tabla con la lista de autobuses */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Tipo de Asiento</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buses.map((bus) => (
              <TableRow key={bus.id_autobus}>
                <TableCell>{bus.id_autobus}</TableCell>
                <TableCell>{bus.modelo}</TableCell>
                <TableCell>{bus.capacidad_asientos}</TableCell>
                <TableCell>{bus.matricula}</TableCell>
                <TableCell>{bus.tipo_asiento}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditBusForm(bus)}
                    aria-label="Editar autobús"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBus(bus.id_autobus)}
                    aria-label="Eliminar autobús"
                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
