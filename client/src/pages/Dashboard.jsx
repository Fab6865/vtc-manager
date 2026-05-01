import { useState, useEffect } from 'react'
import { getDashboard, getRankingsOverview, getTransactions } from '../api'
import { 
  Wallet, 
  Users, 
  Truck, 
  Route, 
  Trophy,
  TrendingUp,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, subValue, color = 'blue' }) {
  const colors = {
    blue: 'from-primary-600 to-primary-800',
    orange: 'from-accent-500 to-accent-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700'
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 card-hover border border-dark-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-400 text-sm">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subValue && <p className="text-dark-500 text-xs mt-1">{subValue}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function RankingPreview({ title, rankings, playerName }) {
  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent-500" />
        {title}
      </h3>
      <div className="space-y-3">
        {rankings.slice(0, 3).map((company, index) => {
          const isPlayer = company.type === 'player' || company.name === playerName;
          return (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isPlayer ? 'bg-primary-900/30 border border-primary-700' : 'bg-dark-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  'bg-amber-700 text-white'
                }`}>
                  {index + 1}
                </span>
                <span className={isPlayer ? 'text-primary-400 font-semibold' : ''}>
                  {company.name}
                  {isPlayer && <span className="ml-2 text-xs bg-primary-600 px-2 py-0.5 rounded">VOUS</span>}
                </span>
              </div>
              <span className="text-dark-400">{Math.round(company.km).toLocaleString()} km</span>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [rankings, setRankings] = useState(null)
  const [transactions, setTransactions] = useState({ transactions: [], summary: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const [dashboardData, rankingsData, transactionsData] = await Promise.all([
        getDashboard(),
        getRankingsOverview(),
        getTransactions(20)
      ])
      setData(dashboardData)
      setRankings(rankingsData)
      setTransactions(transactionsData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-red-500">Erreur de chargement</div>
  }

  const { company, stats } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-dark-400 mt-1">
            Mode: <span className={company.drive_mode === 'real' ? 'text-green-500' : 'text-accent-500'}>
              {company.drive_mode === 'real' ? '🚗 Réel' : '🏎️ Course'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-dark-400">
          <Clock className="w-4 h-4" />
          <span>Mise à jour auto toutes les 30s</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Wallet} 
          label="Solde" 
          value={`${stats.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
          color="green"
        />
        <StatCard 
          icon={Users} 
          label="Chauffeurs" 
          value={stats.driver_count}
          color="blue"
        />
        <StatCard 
          icon={Truck} 
          label="Camions" 
          value={stats.truck_count}
          color="purple"
        />
        <StatCard 
          icon={Route} 
          label="Km ce mois" 
          value={`${Math.round(stats.monthly_km_real + stats.monthly_km_race).toLocaleString()}`}
          subValue={`Réel: ${Math.round(stats.monthly_km_real)} | Course: ${Math.round(stats.monthly_km_race)}`}
          color="orange"
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingPreview 
          title="Top 3 - Mode Réel" 
          rankings={rankings?.top3_real || []}
          playerName={company.name}
        />
        <RankingPreview 
          title="Top 3 - Mode Course" 
          rankings={rankings?.top3_race || []}
          playerName={company.name}
        />
      </div>

      {/* Position — FIX: total par mode au lieu de total_companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Position Réel</p>
              <p className="text-2xl font-bold">
                {stats.real_ranking}<sup>e</sup> / {stats.total_real_companies}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Position Course</p>
              <p className="text-2xl font-bold">
                {stats.race_ranking}<sup>e</sup> / {stats.total_race_companies}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary-500" />
            Historique des transactions
          </h3>
          <div className="flex gap-4 text-sm">
            <span className="text-green-500">
              +{transactions.summary?.today_income?.toFixed(0) || 0}€ revenus
            </span>
            <span className="text-red-500">
              -{transactions.summary?.today_expenses?.toFixed(0) || 0}€ dépenses
            </span>
          </div>
        </div>
        
        {transactions.transactions?.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.transactions.map((tx) => (
              <div 
                key={tx.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  tx.type === 'income' ? 'bg-green-900/20 border border-green-800/30' : 
                  tx.category === 'incident' ? 'bg-red-900/30 border border-red-800/30' :
                  'bg-dark-700/50 border border-dark-600/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tx.type === 'income' ? (
                    <ArrowUpCircle className="w-5 h-5 text-green-500" />
                  ) : tx.category === 'incident' ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-orange-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-dark-400">
                      {tx.category === 'fuel' && '⛽ Carburant'}
                      {tx.category === 'salary' && '💰 Salaire'}
                      {tx.category === 'incident' && '⚠️ Incident'}
                      {tx.category === 'delivery' && '📦 Livraison'}
                      {tx.driver_name && ` • ${tx.driver_name}`}
                      {tx.truck_name && ` • ${tx.truck_name}`}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount?.toFixed(0)}€
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">Aucune transaction récente</p>
        )}
      </div>

      {/* Recent Deliveries */}
      {data.recent_deliveries?.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h3 className="text-lg font-semibold mb-4">Dernières livraisons</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-dark-400 text-sm">
                  <th className="pb-3">Trajet</th>
                  <th className="pb-3">Cargo</th>
                  <th className="pb-3">Distance</th>
                  <th className="pb-3">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {data.recent_deliveries.map((delivery) => (
                  <tr key={delivery.id} className="text-sm">
                    <td className="py-3">{delivery.origin} → {delivery.destination}</td>
                    <td className="py-3">{delivery.cargo}</td>
                    <td className="py-3">{delivery.distance_km} km</td>
                    <td className={`py-3 font-semibold ${delivery.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {delivery.profit.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}