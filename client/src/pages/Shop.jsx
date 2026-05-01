import { useState, useEffect } from 'react'
import { getShopItems, buyDecoration, buyGarageUpgrade, getGarage, buyBooster, getActiveBoosters } from '../api'
import { ShoppingBag, GraduationCap, Truck, Warehouse, Sparkles, Check, Zap, Clock } from 'lucide-react'

const CATEGORY_INFO = {
  booster: { icon: Zap, label: 'Boosters KM', color: 'yellow' },
  training: { icon: GraduationCap, label: 'Formations', color: 'primary' },
  truck_upgrade: { icon: Truck, label: 'Équipements camion', color: 'accent' },
  garage_deco: { icon: Sparkles, label: 'Décorations garage', color: 'purple' },
  garage_upgrade: { icon: Warehouse, label: 'Améliorations garage', color: 'green' }
}

export default function Shop() {
  const [items, setItems] = useState({})
  const [garage, setGarage] = useState(null)
  const [activeBoosters, setActiveBoosters] = useState({ boosters: [], total_boost: 0 })
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('booster')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [shopData, garageData, boostersData] = await Promise.all([
        getShopItems(),
        getGarage(),
        getActiveBoosters()
      ])
      setItems(shopData)
      setGarage(garageData)
      setActiveBoosters(boostersData)
    } catch (error) {
      console.error('Error loading shop:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuyBooster(itemId) {
    try {
      await buyBooster(itemId)
      alert('🚀 Booster activé!')
      await loadData()
    } catch (error) {
      alert(error.message)
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

      {/* Active boosters banner */}
      {activeBoosters.boosters?.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-xl p-4 border border-yellow-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-400">Boosters actifs: +{activeBoosters.total_boost}% km</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {activeBoosters.boosters.map((b) => {
                    const expiresAt = new Date(b.expires_at)
                    const now = new Date()
                    const remainingMs = expiresAt - now
                    const remainingMin = Math.max(0, Math.floor(remainingMs / 60000))
                    const hours = Math.floor(remainingMin / 60)
                    const mins = remainingMin % 60
                    return (
                      <span key={b.id} className="bg-yellow-600/30 text-yellow-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.booster_name}: {hours > 0 ? `${hours}h${mins}m` : `${mins}m`}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {item.effect_type === 'km_boost' && `+${item.effect_value}% km`}
                    {item.effect_type === 'driving' && `+${item.effect_value}% km/jour`}
                    {item.effect_type === 'endurance' && `+${item.effect_value}% endurance`}
                    {item.effect_type === 'adr' && `+${item.effect_value}% revenus ADR`}
                    {item.effect_type === 'comfort' && `+${item.effect_value}% confort`}
                    {item.effect_type === 'morale' && `+${item.effect_value}% moral`}
                    {item.effect_type === 'capacity' && `+${item.effect_value} places`}
                    {item.effect_type === 'repair' && `-${item.effect_value}% réparations`}
                    {item.effect_type === 'navigation' && `+${item.effect_value}% km`}
                    {item.effect_type === 'speed' && `+${item.effect_value}% vitesse`}
                    {item.effect_type === 'night' && `+${item.effect_value}% nuit`}
                    {item.effect_type === 'special' && `Accès spécial`}
                    {item.effect_type === 'management' && `+${item.effect_value}% gestion`}
                    {item.effect_type === 'security' && `Protection`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-green-500">{item.price.toLocaleString()}€</span>
                
                {activeCategory === 'booster' ? (
                  <button
                    onClick={() => handleBuyBooster(item.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Activer
                  </button>
                ) : activeCategory === 'training' ? (
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
