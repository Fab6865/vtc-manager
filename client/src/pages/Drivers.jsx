import { useState, useEffect } from 'react'
import { getDrivers, hireDriver, fireDriver, trainDriver, getOwnedTrucks, assignTruck, getDriverStats } from '../api'
import { Users, UserPlus, UserMinus, GraduationCap, Truck, AlertTriangle, BarChart3, X, Calendar, Route, TrendingUp } from 'lucide-react'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDriverName, setNewDriverName] = useState('')
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [driverStats, setDriverStats] = useState(null)
  const [showStatsModal, setShowStatsModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [driversData, trucksData] = await Promise.all([
        getDrivers(),
        getOwnedTrucks()
      ])
      setDrivers(driversData)
      setTrucks(trucksData)
    } catch (error) {
      console.error('Error loading drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleHire() {
    try {
      await hireDriver(newDriverName || undefined)
      setNewDriverName('')
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleFire(id) {
    if (!confirm('Êtes-vous sûr de vouloir licencier ce chauffeur ?')) return
    try {
      await fireDriver(id)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleTrain(id, type) {
    try {
      await trainDriver(id, type)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleAssignTruck(driverId, truckId) {
    try {
      await assignTruck(driverId, truckId)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleShowStats(driver) {
    try {
      const stats = await getDriverStats(driver.id)
      setDriverStats(stats)
      setSelectedDriver(driver)
      setShowStatsModal(true)
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

  const availableTrucks = trucks.filter(t => !t.assigned_driver_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-primary-500" />
          Mes Chauffeurs
        </h1>
        <span className="text-dark-400">{drivers.length} chauffeur(s)</span>
      </div>

      {/* Hire new driver */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-500" />
          Embaucher un chauffeur
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newDriverName}
            onChange={(e) => setNewDriverName(e.target.value)}
            placeholder="Nom (optionnel, généré automatiquement)"
            className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleHire}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Embaucher (500€)
          </button>
        </div>
      </div>

      {/* Drivers list */}
      {drivers.length === 0 ? (
        <div className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center">
          <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Aucun chauffeur pour le moment</p>
          <p className="text-dark-500 text-sm mt-2">Embauchez votre premier chauffeur pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {drivers.map((driver) => (
            <div 
              key={driver.id} 
              className="bg-dark-800 rounded-xl p-6 border border-dark-700 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-xl font-bold">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{driver.name}</h3>
                    <p className="text-dark-400 text-sm">
                      {driver.truck_name ? (
                        <span className="text-primary-400">🚛 {driver.truck_name}</span>
                      ) : (
                        <span className="text-yellow-500">⚠️ Pas de camion</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowStats(driver)}
                    className="text-primary-500 hover:text-primary-400 p-2"
                    title="Voir statistiques"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleFire(driver.id)}
                    className="text-red-500 hover:text-red-400 p-2"
                    title="Licencier"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="bg-dark-700 rounded-lg p-3">
                  <p className="text-dark-400">Km Réel</p>
                  <p className="font-semibold">{Math.round(driver.monthly_km_real).toLocaleString()}</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-3">
                  <p className="text-dark-400">Km Course</p>
                  <p className="font-semibold">{Math.round(driver.monthly_km_race).toLocaleString()}</p>
                </div>
              </div>

              {/* Training */}
              <div className="mb-4">
                <p className="text-dark-400 text-sm mb-2 flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Formations
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-dark-700 rounded px-2 py-1">
                    <span>Conduite</span>
                    <span className="text-primary-400">{driver.training_driving}%</span>
                  </div>
                  <div className="flex items-center justify-between bg-dark-700 rounded px-2 py-1">
                    <span>Éco</span>
                    <span className="text-green-400">{driver.training_eco}%</span>
                  </div>
                  <div className="flex items-center justify-between bg-dark-700 rounded px-2 py-1">
                    <span>Endurance</span>
                    <span className="text-purple-400">{driver.training_endurance}%</span>
                  </div>
                  <div className="flex items-center justify-between bg-dark-700 rounded px-2 py-1">
                    <span>ADR</span>
                    <span className="text-yellow-400">{driver.certification_adr ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTrain(driver.id, 'driving')}
                  className="text-xs bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 px-3 py-1.5 rounded transition-colors"
                >
                  +Conduite (500€)
                </button>
                <button
                  onClick={() => handleTrain(driver.id, 'eco')}
                  className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded transition-colors"
                >
                  +Éco (800€)
                </button>
                <button
                  onClick={() => handleTrain(driver.id, 'endurance')}
                  className="text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-3 py-1.5 rounded transition-colors"
                >
                  +Endurance (1200€)
                </button>
                {!driver.certification_adr && (
                  <button
                    onClick={() => handleTrain(driver.id, 'adr')}
                    className="text-xs bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 px-3 py-1.5 rounded transition-colors"
                  >
                    ADR (2000€)
                  </button>
                )}
              </div>

              {/* Assign truck */}
              {!driver.truck_name && availableTrucks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-dark-400 text-sm mb-2 flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Assigner un camion
                  </p>
                  <select
                    onChange={(e) => handleAssignTruck(driver.id, e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Choisir un camion...</option>
                    {availableTrucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>{truck.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {!driver.truck_name && availableTrucks.length === 0 && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-yellow-500 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Aucun camion disponible. Achetez-en un dans le garage.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Stats Modal */}
      {showStatsModal && driverStats && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowStatsModal(false)}>
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-lg font-bold">
                  {driverStats.driver.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{driverStats.driver.name}</h2>
                  <p className="text-dark-400 text-sm">Statistiques détaillées</p>
                </div>
              </div>
              <button onClick={() => setShowStatsModal(false)} className="text-dark-400 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-700 rounded-lg p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-primary-500" />
                  <p className="text-2xl font-bold">{driverStats.stats.days_employed}</p>
                  <p className="text-dark-400 text-xs">Jours employé</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4 text-center">
                  <Route className="w-5 h-5 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{Math.round(driverStats.stats.total_km).toLocaleString()}</p>
                  <p className="text-dark-400 text-xs">Km total</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-2 text-accent-500" />
                  <p className="text-2xl font-bold">{Math.round(driverStats.stats.km_per_day).toLocaleString()}</p>
                  <p className="text-dark-400 text-xs">Km/jour</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4 text-center">
                  <BarChart3 className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{driverStats.stats.total_deliveries}</p>
                  <p className="text-dark-400 text-xs">Livraisons</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-green-400">Mode Réel</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Total</span>
                      <span>{Math.round(driverStats.stats.total_km_real).toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Ce mois</span>
                      <span>{Math.round(driverStats.stats.monthly_km_real).toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-accent-400">Mode Course</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Total</span>
                      <span>{Math.round(driverStats.stats.total_km_race).toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Ce mois</span>
                      <span>{Math.round(driverStats.stats.monthly_km_race).toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Stats */}
              <div className="bg-dark-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3">💰 Finances</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-dark-400">Revenu total</p>
                    <p className="font-semibold text-green-400">{driverStats.stats.total_revenue.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-dark-400">Profit total</p>
                    <p className="font-semibold text-green-500">{driverStats.stats.total_profit.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-dark-400">Profit/livraison</p>
                    <p className="font-semibold">{driverStats.stats.avg_profit_per_delivery.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              {/* Training Progress */}
              <div className="bg-dark-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3">🎓 Formations ({driverStats.stats.training_total}%)</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conduite</span>
                      <span>{driverStats.driver.training_driving}%</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${driverStats.driver.training_driving}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Éco-conduite</span>
                      <span>{driverStats.driver.training_eco}%</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${driverStats.driver.training_eco}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Endurance</span>
                      <span>{driverStats.driver.training_endurance}%</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${driverStats.driver.training_endurance}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Certification ADR:</span>
                    <span className={driverStats.driver.certification_adr ? 'text-green-400' : 'text-red-400'}>
                      {driverStats.driver.certification_adr ? '✓ Certifié' : '✗ Non certifié'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Deliveries */}
              {driverStats.recent_deliveries?.length > 0 && (
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">📦 Dernières livraisons</h3>
                  <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                    {driverStats.recent_deliveries.map((d) => (
                      <div key={d.id} className="flex justify-between items-center py-2 border-b border-dark-600 last:border-0">
                        <div>
                          <span>{d.origin} → {d.destination}</span>
                          <span className="text-dark-400 ml-2">({d.cargo})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400">{d.profit.toFixed(2)} €</span>
                          <span className="text-dark-400 ml-2">{d.km_real + d.km_race} km</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
