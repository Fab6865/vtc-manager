import { useState, useEffect } from 'react'
import { getShopItems, buyDecoration, buyGarageUpgrade, getGarage } from '../api'
import { ShoppingBag, GraduationCap, Truck, Warehouse, Sparkles, Check } from 'lucide-react'

const CATEGORY_INFO = {
  training: { icon: GraduationCap, label: 'Formations', color: 'primary' },
  truck_upgrade: { icon: Truck, label: 'Équipements camion', color: 'accent' },
  garage_deco: { icon: Sparkles, label: 'Décorations garage', color: 'purple' },
  garage_upgrade: { icon: Warehouse, label: 'Améliorations garage', color: 'green' }
}

export default function Shop() {
  const [items, setItems] = useState({})
  const [garage, setGarage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('training')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [shopData, garageData] = await Promise.all([
        getShopItems(),
        getGarage()
      ])
      setItems(shopData)
      setGarage(garageData)
    } catch (error) {
      console.error('Error loading shop:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuyDecoration(itemId) {
    try {
      await buyDecoration(itemId)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleBuyGarageUpgrade(itemId) {
    try {
      await buyGarageUpgrade(itemId)
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

  const ownedDecorations = garage?.decorations?.map(d => d.name) || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-primary-500" />
        Boutique
      </h1>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_INFO).map(([key, { icon: Icon, label, color }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeCategory === key
                ? `bg-${color}-600 text-white`
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items[activeCategory]?.map((item) => {
          const isOwned = activeCategory === 'garage_deco' && ownedDecorations.includes(item.name)
          
          return (
            <div 
              key={item.id} 
              className={`bg-dark-800 rounded-xl p-6 border transition-all ${
                isOwned ? 'border-green-600 bg-green-900/10' : 'border-dark-700 card-hover'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-dark-400 text-sm mt-1">{item.description}</p>
                </div>
                {isOwned && (
                  <div className="bg-green-600 rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {item.effect_type && item.effect_type !== 'aesthetic' && (
                <div className="bg-dark-700 rounded-lg px-3 py-2 mb-4 text-sm">
                  <span className="text-dark-400">Effet: </span>
                  <span className="text-primary-400">
                    {item.effect_type === 'driving' && `+${item.effect_value}% km/jour`}
                    {item.effect_type === 'eco' && `-${item.effect_value}% carburant`}
                    {item.effect_type === 'endurance' && `+${item.effect_value}% endurance`}
                    {item.effect_type === 'adr' && `+${item.effect_value}% revenus ADR`}
                    {item.effect_type === 'fuel' && `-${item.effect_value}% carburant`}
                    {item.effect_type === 'comfort' && `+${item.effect_value}% confort`}
                    {item.effect_type === 'morale' && `+${item.effect_value}% moral`}
                    {item.effect_type === 'capacity' && `+${item.effect_value} places`}
                    {item.effect_type === 'repair' && `-${item.effect_value}% réparations`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-green-500">{item.price.toLocaleString()}€</span>
                
                {activeCategory === 'training' ? (
                  <p className="text-dark-500 text-sm">Achetez via Chauffeurs</p>
                ) : activeCategory === 'truck_upgrade' ? (
                  <p className="text-dark-500 text-sm">Achetez via Garage</p>
                ) : isOwned ? (
                  <span className="text-green-500 text-sm font-semibold">Possédé</span>
                ) : (
                  <button
                    onClick={() => {
                      if (activeCategory === 'garage_deco') handleBuyDecoration(item.id)
                      else if (activeCategory === 'garage_upgrade') handleBuyGarageUpgrade(item.id)
                    }}
                    className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Acheter
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Garage status */}
      {garage && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-lg font-semibold mb-4">État du garage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Nom</p>
              <p className="font-semibold">{garage.name}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Niveau</p>
              <p className="font-semibold">{garage.level}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Capacité</p>
              <p className="font-semibold">{garage.trucks_count} / {garage.capacity}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Décorations</p>
              <p className="font-semibold">{garage.decorations?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
