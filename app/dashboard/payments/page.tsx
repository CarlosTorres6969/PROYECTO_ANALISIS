'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { FiPlus, FiTrash2, FiClock, FiCreditCard, FiCalendar, FiX, FiUser } from 'react-icons/fi'

interface Payment {
  id_pago: number
  id_boleto: number
  monto: number
  fecha_pago: string
  metodo_pago: string
  estado_pago: string
  nombre_usuario: string
  apellido_usuario: string
  id_viaje: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    id_boleto: '',
    monto: '',
    fecha_pago: '',
    metodo_pago: 'Tarjeta',
    estado_pago: 'Completado'
  })

  // Fetch payments
  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments')
      if (!response.ok) throw new Error('Error al obtener pagos')
      const data = await response.json()
      setPayments(data)
    } catch (err) {
      toast.error('Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Create new payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_boleto: parseInt(formData.id_boleto),
          monto: parseFloat(formData.monto),
          fecha_pago: formData.fecha_pago,
          metodo_pago: formData.metodo_pago,
          estado_pago: formData.estado_pago
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear pago')
      }

      const newPayment = await response.json()
      setPayments([newPayment, ...payments])
      setIsCreating(false)
      setFormData({
        id_boleto: '',
        monto: '',
        fecha_pago: '',
        metodo_pago: 'Tarjeta',
        estado_pago: 'Completado'
      })
      toast.success('Pago registrado exitosamente!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar pago')
    }
  }

  // Delete payment
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return
    
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar pago')
      }

      setPayments(payments.filter(payment => payment.id_pago !== id))
      toast.success('Pago eliminado exitosamente!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar pago')
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
      case 'Completado': return 'bg-green-200 text-green-900'
      case 'Pendiente': return 'bg-yellow-200 text-yellow-900'
      case 'Rechazado': return 'bg-red-200 text-red-900'
      case 'Reembolsado': return 'bg-blue-200 text-blue-900'
      default: return 'bg-gray-200 text-gray-900'
    }
  }

  if (loading && payments.length === 0) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
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
                Nuevo Pago
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Payment Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FiCreditCard className="text-indigo-600" />
              Registrar Nuevo Pago
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Boleto</label>
                  <input
                    type="number"
                    name="id_boleto"
                    value={formData.id_boleto}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto (HNL)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto"
                    value={formData.monto}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                  <input
                    type="date"
                    name="fecha_pago"
                    value={formData.fecha_pago}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                  <select
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="estado_pago"
                    value={formData.estado_pago}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Completado">Completado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="Reembolsado">Reembolsado</option>
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
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {payments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment.id_pago} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Payment Info */}
                    <div className="sm:col-span-3 flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <FiCreditCard className="text-indigo-600" size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Pago #{payment.id_pago}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Boleto #{payment.id_boleto} • Viaje #{payment.id_viaje}
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <FiUser className="text-gray-500" size={16} />
                      <span className="text-sm text-gray-700">
                        {payment.nombre_usuario} {payment.apellido_usuario}
                      </span>
                    </div>

                    {/* Amount and Date */}
                    <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          HNL {payment.monto.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-500" size={16} />
                        <span className="text-sm text-gray-700">
                          {formatDate(payment.fecha_pago)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method and Status */}
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-900">
                        {payment.metodo_pago}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.estado_pago)}`}>
                        {payment.estado_pago}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleDelete(payment.id_pago)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        title="Eliminar pago"
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
              <FiCreditCard size={48} className="mx-auto text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hay pagos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isCreating ? 
                  "Completa el formulario para registrar tu primer pago" : 
                  "Haz clic en 'Nuevo Pago' para comenzar"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}