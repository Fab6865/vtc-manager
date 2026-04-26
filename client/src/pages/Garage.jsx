import { useState, useEffect } from 'react'
import { getTrucks, buyTruck, sellTruck, renameTruck, getGarage } from '../api'
import { Warehouse, Truck, ShoppingCart, DollarSign, Edit2, Check, X } from 'lucide-react'

export default function Garage() {
  const [trucks, setTrucks] = useState([])
  const [garage, setGarage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingTruck, setEditingTruck] = useState(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [trucksData, garageData] = await Promise.all([
        getTrucks(),
        getGarage()
      ])
      setTrucks(trucksData)
      setGarage(garageData)
    } catch (error) {
      console.error('Error loading garage:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuy(id) {
    try {
      await buyTruck(id)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleSell(id) {
    if (!confirm('Êtes-vous sûr de vouloir vendre ce camion ?')) return
    try {
      await sellTruck(id)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleRename(id) {
    if (!newName.trim()) return
    try {
      await renameTruck(id, newName)
      setEditingTruck(null)
      setNewName('')
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

  const ownedTrucks = trucks.filter(t => t.owned)
  const availableTrucks = trucks.filter(t => !t.owned && !t.rented)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-primary-500" />
          Mon Garage
        </h1>
        {garage && (
          <span className="text-dark-400">
            {ownedTrucks.length} / {garage.capacity} places
          </span>
        )}
      </div>

      {/* Garage Info */}
      {garage && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{garage.name}</h2>
              <p className="text-dark-400">Niveau {garage.level} • Capacité: {garage.capacity} camions</p>
            </div>
            {garage.decorations?.length > 0 && (
              <div className="flex gap-2">
                {garage.decorations.map((deco, i) => (
                  <span key={i} className="bg-dark-700 px-3 py-1 rounded-full text-sm">
                    {deco.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Owned Trucks */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-500" />
          Mes Camions ({ownedTrucks.length})
        </h2>
        
        {ownedTrucks.length === 0 ? (
          <div className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center">
            <Truck className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Aucun camion possédé</p>
            <p className="text-dark-500 text-sm mt-2">Achetez votre premier camion ci-dessous</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownedTrucks.map((truck) => (
              <div key={truck.id} className="bg-dark-800 rounded-xl p-6 border border-dark-700 card-hover">
                <div className="flex items-center justify-between mb-4">
                  {editingTruck === truck.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm"
                        placeholder={truck.name}
                        autoFocus
                      />
                      <button onClick={() => handleRename(truck.id)} className="text-green-500 hover:text-green-400">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingTruck(null); setNewName(''); }} className="text-red-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold">{truck.name}</h3>
                      <button 
                        onClick={() => { setEditingTruck(truck.id); setNewName(truck.name); }}
                        className="text-dark-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Modèle</span>
                    <span>{truck.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Km total</span>
                    <span>{Math.round(truck.total_km).toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Chauffeur</span>
                    <span className={truck.driver_name ? 'text-primary-400' : 'text-yellow-500'}>
                      {truck.driver_name || 'Non assigné'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Efficacité carburant</span>
                    <span className={truck.fuel_efficiency <= 1 ? 'text-green-400' : 'text-yellow-400'}>
                      {(truck.fuel_efficiency * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSell(truck.id)}
                  className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 py-2 rounded-lg transition-colors text-sm"
                >
                  Vendre ({(truck.price * 0.6).toLocaleString()}€)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Trucks */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-accent-500" />
          Camions disponibles
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTrucks.map((truck) => (
            <div key={truck.id} className="bg-dark-800 rounded-xl p-6 border border-dark-700 card-hover">
              <h3 className="font-semibold mb-4">{truck.name}</h3>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-dark-400">Modèle</span>
                  <span>{truck.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Vitesse max</span>
                  <span>{truck.max_speed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Confort</span>
                  <span>{'⭐'.repeat(truck.comfort)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Efficacité carburant</span>
                  <span className={truck.fuel_efficiency <= 1 ? 'text-green-400' : 'text-yellow-400'}>
                    {(truck.fuel_efficiency * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-green-500">
                  {truck.price.toLocaleString()}€
                </span>
              </div>

              <button
                onClick={() => handleBuy(truck.id)}
                disabled={ownedTrucks.length >= (garage?.capacity || 2)}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Acheter
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
