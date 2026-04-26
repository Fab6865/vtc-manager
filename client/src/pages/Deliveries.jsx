import { useState, useEffect } from 'react'
import { getDeliveries, addDelivery, deleteDelivery, getDeliveryStats, getDrivers, getOwnedTrucks } from '../api'
import { FileText, Plus, Trash2, TrendingUp, Route } from 'lucide-react'

const CARGO_TYPES = [
  { value: 'standard', label: 'Standard', bonus: '+0%' },
  { value: 'fragile', label: 'Fragile', bonus: '+15%' },
  { value: 'heavy', label: 'Lourd', bonus: '+20%' },
  { value: 'dangerous', label: 'Dangereux (ADR)', bonus: '+40%' },
  { value: 'exceptional', label: 'Exceptionnel', bonus: '+50%' },
]

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [stats, setStats] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    cargo: '',
    cargo_type: 'standard',
    distance_km: '',
    km_real: '',
    km_race: '',
    on_time: true,
    driver_id: '',
    truck_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [deliveriesData, statsData, driversData, trucksData] = await Promise.all([
        getDeliveries(),
        getDeliveryStats(),
        getDrivers(),
        getOwnedTrucks()
      ])
      setDeliveries(deliveriesData.deliveries)
      setStats(statsData)
      setDrivers(driversData)
      setTrucks(trucksData)
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await addDelivery({
        ...form,
        distance_km: parseFloat(form.distance_km) || 0,
        km_real: parseFloat(form.km_real) || 0,
        km_race: parseFloat(form.km_race) || 0,
        driver_id: form.driver_id || null,
        truck_id: form.truck_id || null
      })
      setForm({
        origin: '',
        destination: '',
        cargo: '',
        cargo_type: 'standard',
        distance_km: '',
        km_real: '',
        km_race: '',
        on_time: true,
        driver_id: '',
        truck_id: ''
      })
      setShowForm(false)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette livraison ?')) return
    try {
      await deleteDelivery(id)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary-500" />
          Facturation
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle livraison
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-sm">Total livraisons</p>
            <p className="text-2xl font-bold">{stats.total_deliveries}</p>
          </div>
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-sm">Profit total</p>
            <p className="text-2xl font-bold text-green-500">{stats.total_profit.toFixed(2)}€</p>
          </div>
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-sm">Km Réel</p>
            <p className="text-2xl font-bold">{Math.round(stats.total_km_real).toLocaleString()}</p>
          </div>
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <p className="text-dark-400 text-sm">Km Course</p>
            <p className="text-2xl font-bold">{Math.round(stats.total_km_race).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* New Delivery Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-lg font-semibold mb-4">Enregistrer une livraison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-dark-400 text-sm mb-1">Origine *</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                placeholder="Paris"
                required
              />
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Destination *</label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                placeholder="Berlin"
                required
              />
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Cargo *</label>
              <input
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                placeholder="Électronique"
                required
              />
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Type de cargo</label>
              <select
                value={form.cargo_type}
                onChange={(e) => setForm({ ...form, cargo_type: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
              >
                {CARGO_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.bonus})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Distance totale (km) *</label>
              <input
                type="number"
                value={form.distance_km}
                onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                placeholder="500"
                required
              />
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Km en mode Réel (≤100km/h)</label>
              <input
                type="number"
                value={form.km_real}
                onChange={(e) => setForm({ ...form, km_real: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Km en mode Course (≤180km/h)</label>
              <input
                type="number"
                value={form.km_race}
                onChange={(e) => setForm({ ...form, km_race: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                placeholder="200"
              />
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Chauffeur (optionnel)</label>
              <select
                value={form.driver_id}
                onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
              >
                <option value="">Moi-même</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-dark-400 text-sm mb-1">Camion (optionnel)</label>
              <select
                value={form.truck_id}
                onChange={(e) => setForm({ ...form, truck_id: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
              >
                <option value="">Non spécifié</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>{truck.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.on_time}
                onChange={(e) => setForm({ ...form, on_time: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span>Livré à l'heure (+10%)</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-dark-600 hover:bg-dark-500 px-6 py-2 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Deliveries List */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr className="text-left text-dark-400 text-sm">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Trajet</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Km Réel</th>
                <th className="px-4 py-3">Km Course</th>
                <th className="px-4 py-3">Revenu</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-dark-400">
                    Aucune livraison enregistrée
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-3 text-sm text-dark-400">
                      {new Date(delivery.delivered_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span>{delivery.origin}</span>
                        <Route className="w-3 h-3 text-dark-500" />
                        <span>{delivery.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{delivery.cargo}</span>
                      <span className="text-xs text-dark-500 ml-2">({delivery.cargo_type})</span>
                    </td>
                    <td className="px-4 py-3">{delivery.distance_km} km</td>
                    <td className="px-4 py-3 text-green-400">{delivery.km_real}</td>
                    <td className="px-4 py-3 text-accent-400">{delivery.km_race}</td>
                    <td className="px-4 py-3">{delivery.revenue.toFixed(2)}€</td>
                    <td className={`px-4 py-3 font-semibold ${delivery.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {delivery.profit.toFixed(2)}€
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(delivery.id)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
