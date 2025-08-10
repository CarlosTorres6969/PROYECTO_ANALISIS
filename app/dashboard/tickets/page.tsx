'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { FiPlus, FiTrash2, FiClock, FiMapPin, FiUser, FiCalendar, FiX, FiBookmark } from 'react-icons/fi'
import { FaBus } from 'react-icons/fa'

interface Ticket {
  id_boleto: number
  id_viaje: number
  id_usuario: number
  precio_total: number
  fecha_compra: string
  estado_boleto: string
  nombre_usuario: string
  apellido_usuario: string
  nombre_ruta_origen: string
  nombre_ruta_destino: string
  fecha_viaje: string
  hora_viaje: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    id_viaje: '',
    id_usuario: '',
    precio_total: '',
    estado_boleto: 'Confirmado'
  })

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tickets')
      if (!response.ok) throw new Error('Error al obtener boletos')
      const data = await response.json()
      setTickets(data)
    } catch (err) {
      toast.error('Error al cargar boletos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Create new ticket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_viaje: parseInt(formData.id_viaje),
          id_usuario: parseInt(formData.id_usuario),
          precio_total: parseFloat(formData.precio_total),
          estado_boleto: formData.estado_boleto
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear boleto')
      }

      const newTicket = await response.json()
      setTickets([newTicket, ...tickets])
      setIsCreating(false)
      setFormData({
        id_viaje: '',
        id_usuario: '',
        precio_total: '',
        estado_boleto: 'Confirmado'
      })
      toast.success('Boleto creado exitosamente!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear boleto')
    }
  }

  // Delete ticket
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este boleto?')) return
    
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar boleto')
      }

      setTickets(tickets.filter(ticket => ticket.id_boleto !== id))
      toast.success('Boleto eliminado exitosamente!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar boleto')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado': return 'bg-green-200 text-green-900'
      case 'Pendiente': return 'bg-yellow-200 text-yellow-900'
      case 'Cancelado': return 'bg-red-200 text-red-900'
      case 'Usado': return 'bg-blue-200 text-blue-900'
      default: return 'bg-gray-200 text-gray-900'
    }
  }

  if (loading && tickets.length === 0) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Boletos</h1>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isCreating
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isCreating ? (
              <>
                <FiX size={16} />
                Cancelar
              </>
            ) : (
              <>
                <FiPlus size={16} />
                Nuevo Boleto
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Ticket Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FiBookmark className="text-indigo-600" />
              Crear Nuevo Boleto
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Viaje</label>
                  <input
                    type="number"
                    name="id_viaje"
                    value={formData.id_viaje}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Usuario</label>
                  <input
                    type="number"
                    name="id_usuario"
                    value={formData.id_usuario}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Total (HNL)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_total"
                    value={formData.precio_total}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="estado_boleto"
                    value={formData.estado_boleto}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Confirmado">Confirmado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Crear Boleto
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {tickets.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <div key={ticket.id_boleto} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Ticket Info */}
                    <div className="sm:col-span-3 flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <FiBookmark className="text-indigo-600" size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Boleto #{ticket.id_boleto}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(ticket.fecha_compra)}
                        </p>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-gray-500" size={16} />
                        <span className="text-sm text-gray-700">
                          {ticket.nombre_ruta_origen} → {ticket.nombre_ruta_destino}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-500" size={16} />
                        <span className="text-sm text-gray-700">
                          {formatDate(ticket.fecha_viaje)} {ticket.hora_viaje}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <FiUser className="text-gray-500" size={16} />
                      <span className="text-sm text-gray-700">
                        {ticket.nombre_usuario} {ticket.apellido_usuario}
                      </span>
                    </div>

                    {/* Price and Status */}
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        HNL {ticket.precio_total.toFixed(2)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.estado_boleto)}`}>
                        {ticket.estado_boleto}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleDelete(ticket.id_boleto)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        title="Eliminar boleto"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiBookmark size={48} className="mx-auto text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hay boletos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isCreating ? 
                  "Completa el formulario para crear tu primer boleto" : 
                  "Haz clic en 'Nuevo Boleto' para comenzar"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}