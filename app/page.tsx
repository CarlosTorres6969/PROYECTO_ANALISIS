"use client"
import { redirect } from "next/navigation"

interface Station {
  id_estacion: number
  nombre_estacion: string
  ciudad: string
}

interface Trip {
  id_viaje: number
  fecha_salida: string
  hora_salida: string
  precio_base: string
  origen_nombre: string
  destino_nombre: string
  autobus_matricula: string
  asientos_disponibles: number
}

export default function HomePage() {
  redirect("/dashboard")
  return null
}
