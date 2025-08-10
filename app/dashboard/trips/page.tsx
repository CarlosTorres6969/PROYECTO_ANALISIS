// app/trips/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { FiPlus, FiTrash2, FiClock, FiMapPin, FiDollarSign, FiCalendar, FiX } from 'react-icons/fi'
import { FaBus } from 'react-icons/fa'

interface Trip {
  id_viaje: number
  id_ruta: number
  id_autobus: number
  fecha_salida: string
  hora_salida: string
  fecha_llegada_estimada: string
  hora_llegada_estimada: string
  precio_base: number
  duracion_estimada_min: number
  distancia_km: number
  origen_nombre: string
  origen_ciudad: string
  destino_nombre: string
  destino_ciudad: string
  autobus_modelo: string
  autobus_matricula: string
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    id_ruta: '',
    id_autobus: '',
    fecha_salida: '',
    hora_salida: '',
    fecha_llegada_estimada: '',
    hora_llegada_estimada: '',
    precio_base: ''
  })

  // Fetch trips
  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trips')
      if (!response.ok) throw new Error('Error al obtener viajes')
      const data = await response.json()
      setTrips(data)
    } catch (err) {
      toast.error('Error al cargar viajes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Create new trip
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_ruta: parseInt(formData.id_ruta),
          id_autobus: parseInt(formData.id_autobus),
          fecha_salida: formData.fecha_salida,
          hora_salida: formData.hora_salida,
          fecha_llegada: formData.fecha_llegada_estimada,
          hora_llegada: formData.hora_llegada_estimada,
          precio_base: parseFloat(formData.precio_base)
        })
      })

      if (!response.ok) throw new Error('Error al crear viaje')

      const newTrip = await response.json()
      setTrips([newTrip, ...trips])
      setIsCreating(false)
      setFormData({
        id_ruta: '',
        id_autobus: '',
        fecha_salida: '',
        hora_salida: '',
        fecha_llegada_estimada: '',
        hora_llegada_estimada: '',
        precio_base: ''
      })
      toast.success('Viaje creado exitosamente!')
    } catch (err) {
      toast.error('Error al crear viaje')
    }
  }

  // Delete trip
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este viaje?')) return
    
    try {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar viaje')

      setTrips(trips.filter(trip => trip.id_viaje !== id))
      toast.success('Viaje eliminado exitosamente!')
    } catch (err) {
      toast.error('Error al eliminar viaje')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  // Calculate duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  if (loading && trips.length === 0) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Viajes</h1>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-sm transition-all ${isCreating 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'} font-medium`}
          >
            {isCreating ? (
              <>
                <FiX size={18} />
                Cancelar
              </>
            ) : (
              <>
                <FiPlus size={18} />
                Nuevo Viaje
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Trip Form */}
        {isCreating && (
          <div className="bg-white rounded-2xl shadow-md p-8 mb-10 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FiPlus className="text-indigo-600" />
              Crear Nuevo Viaje
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">ID Ruta</label>
                  <input
                    type="number"
                    name="id_ruta"
                    value={formData.id_ruta}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">ID Autobús</label>
                  <input
                    type="number"
                    name="id_autobus"
                    value={formData.id_autobus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Fecha Salida</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fecha_salida"
                      value={formData.fecha_salida}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <FiCalendar className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Hora Salida</label>
                  <div className="relative">
                    <input
                      type="time"
                      name="hora_salida"
                      value={formData.hora_salida}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <FiClock className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Fecha Llegada Estimada</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fecha_llegada_estimada"
                      value={formData.fecha_llegada_estimada}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <FiCalendar className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Hora Llegada Estimada</label>
                  <div className="relative">
                    <input
                      type="time"
                      name="hora_llegada_estimada"
                      value={formData.hora_llegada_estimada}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <FiClock className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Precio Base ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="precio_base"
                      value={formData.precio_base}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <FiDollarSign className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  Guardar Viaje
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trips List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {trips.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {trips.map((trip) => (
                <div key={trip.id_viaje} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Route Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-3 rounded-full">
                          <FiMapPin className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {trip.origen_ciudad} → {trip.destino_ciudad}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {trip.origen_nombre} - {trip.destino_nombre}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">Salida</p>
                        <p className="font-medium">{formatDate(trip.fecha_salida)}</p>
                        <p className="text-sm text-gray-500">{trip.hora_salida}</p>
                      </div>
                      <div className="text-center">
                        <FiClock className="mx-auto text-gray-400" />
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDuration(trip.duracion_estimada_min)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">Llegada</p>
                        <p className="font-medium">{formatDate(trip.fecha_llegada_estimada)}</p>
                        <p className="text-sm text-gray-500">{trip.hora_llegada_estimada}</p>
                      </div>
                    </div>

                    {/* Bus and Price */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <FaBus className="text-gray-400" />
                        <span className="text-sm">{trip.autobus_modelo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-gray-400" />
                        <span className="font-medium">${trip.precio_base.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleDelete(trip.id_viaje)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar viaje"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 text-gray-200">
                <FaBus size={96} className="opacity-30" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No hay viajes programados</h3>
              <p className="mt-2 text-gray-500">
                {isCreating ? 
                  "Completa el formulario para crear tu primer viaje" : 
                  "Haz clic en 'Nuevo Viaje' para comenzar"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}