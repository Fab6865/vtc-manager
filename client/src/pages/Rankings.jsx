import { useState, useEffect } from 'react'
import { getRealRankings, getRaceRankings, getDriversRanking } from '../api'
import { Trophy, Medal, Car, Gauge, Users } from 'lucide-react'

function RankingTable({ rankings, playerRank }) {
  return (
    <div className="space-y-2">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 0, 2].map((index) => {
          const company = rankings[index]
          if (!company) return <div key={index} />
          
          const heights = ['h-32', 'h-40', 'h-24']
          const colors = ['bg-gray-400', 'bg-yellow-500', 'bg-amber-700']
          const positions = [2, 1, 3]
          
          return (
            <div key={index} className="flex flex-col items-center justify-end">
              <div className={`w-16 h-16 rounded-full ${company.type === 'player' ? 'bg-primary-600 ring-2 ring-primary-400' : 'bg-dark-600'} flex items-center justify-center mb-2`}>
                {company.logo ? (
                  <img src={company.logo} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-bold">{company.name.charAt(0)}</span>
                )}
              </div>
              <p className={`text-sm font-semibold text-center truncate w-full ${company.type === 'player' ? 'text-primary-400' : ''}`}>
                {company.name}
              </p>
              <p className="text-xs text-dark-400">{Math.round(company.monthly_km).toLocaleString()} km</p>
              <div className={`${heights[index]} w-full ${colors[index]} rounded-t-lg mt-2 flex items-center justify-center`}>
                <span className="text-2xl font-bold text-black">{positions[index]}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full ranking list */}
      <div className="bg-dark-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-600">
            <tr className="text-left text-dark-400 text-sm">
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3 text-right">Chauffeurs</th>
              <th className="px-4 py-3 text-right">Camions</th>
              <th className="px-4 py-3 text-right">Km ce mois</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {rankings.map((company) => (
              <tr 
                key={company.id} 
                className={`${company.type === 'player' ? 'bg-primary-900/30' : 'hover:bg-dark-600/50'}`}
              >
                <td className="px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    company.rank === 1 ? 'bg-yellow-500 text-black' :
                    company.rank === 2 ? 'bg-gray-400 text-black' :
                    company.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-dark-600'
                  }`}>
                    {company.rank}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${company.type === 'player' ? 'bg-primary-600' : 'bg-dark-500'} flex items-center justify-center`}>
                      {company.logo ? (
                        <img src={company.logo} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="font-bold">{company.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className={company.type === 'player' ? 'text-primary-400 font-semibold' : ''}>
                      {company.name}
                      {company.type === 'player' && <span className="ml-2 text-xs bg-primary-600 px-2 py-0.5 rounded">VOUS</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-dark-400">{company.driver_count}</td>
                <td className="px-4 py-3 text-right text-dark-400">{company.truck_count}</td>
                <td className="px-4 py-3 text-right font-semibold">{Math.round(company.monthly_km).toLocaleString()} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DriversTable({ drivers }) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl p-8 text-center text-dark-400">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun chauffeur actif</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Top 3 Podium */}
      {drivers.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((index) => {
            const driver = drivers[index]
            if (!driver) return <div key={index} />
            
            const heights = ['h-32', 'h-40', 'h-24']
            const colors = ['bg-gray-400', 'bg-yellow-500', 'bg-amber-700']
            const positions = [2, 1, 3]
            
            return (
              <div key={index} className="flex flex-col items-center justify-end">
                <div className={`w-16 h-16 rounded-full ${driver.type === 'player' ? 'bg-primary-600 ring-2 ring-primary-400' : 'bg-dark-600'} flex items-center justify-center mb-2 text-2xl`}>
                  {driver.avatar || '👤'}
                </div>
                <p className={`text-sm font-semibold text-center truncate w-full ${driver.type === 'player' ? 'text-primary-400' : ''}`}>
                  {driver.name}
                </p>
                <p className="text-xs text-dark-400">{Math.round(driver.monthly_km).toLocaleString()} km</p>
                <div className={`${heights[index]} w-full ${colors[index]} rounded-t-lg mt-2 flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-black">{positions[index]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full ranking list */}
      <div className="bg-dark-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-600">
            <tr className="text-left text-dark-400 text-sm">
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3">Chauffeur</th>
              <th className="px-4 py-3 text-right">Conduite</th>
              <th className="px-4 py-3 text-right">Endurance</th>
              <th className="px-4 py-3 text-right">Km ce mois</th>
              <th className="px-4 py-3 text-right">Km total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {drivers.map((driver) => (
              <tr key={driver.id} className={`${driver.type === 'player' ? 'bg-primary-900/30' : 'hover:bg-dark-600/50'}`}>
                <td className="px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    driver.rank === 1 ? 'bg-yellow-500 text-black' :
                    driver.rank === 2 ? 'bg-gray-400 text-black' :
                    driver.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-dark-600'
                  }`}>
                    {driver.rank}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${driver.type === 'player' ? 'bg-primary-600' : 'bg-dark-500'} flex items-center justify-center text-lg`}>
                      {driver.avatar || '👤'}
                    </div>
                    <span className={`font-medium ${driver.type === 'player' ? 'text-primary-400' : ''}`}>
                      {driver.name}
                      {driver.type === 'player' && <span className="ml-2 text-xs bg-primary-600 px-2 py-0.5 rounded">VOUS</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-primary-400">{driver.type === 'player' ? '⭐' : `+${driver.training_driving}%`}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-green-400">{driver.type === 'player' ? '⭐' : `+${driver.training_endurance}%`}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{Math.round(driver.monthly_km).toLocaleString()} km</td>
                <td className="px-4 py-3 text-right text-dark-400">{Math.round(driver.total_km).toLocaleString()} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Rankings() {
  const [mode, setMode] = useState('real')
  const [realData, setRealData] = useState(null)
  const [raceData, setRaceData] = useState(null)
  const [driversData, setDriversData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRankings()
    const interval = setInterval(loadRankings, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadRankings() {
    try {
      const [real, race, drivers] = await Promise.all([
        getRealRankings(),
        getRaceRankings(),
        getDriversRanking()
      ])
      setRealData(real)
      setRaceData(race)
      setDriversData(drivers)
    } catch (error) {
      console.error('Error loading rankings:', error)
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

  const currentData = mode === 'real' ? realData : raceData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Classement
        </h1>
        <p className="text-dark-400 text-sm">Mise à jour auto toutes les 30s</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('real')}
          className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
            mode === 'real'
              ? 'bg-green-600 text-white'
              : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
          }`}
        >
          <Car className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Mode Réel</p>
            <p className="text-xs opacity-75">≤100 km/h</p>
          </div>
          {realData && (
            <span className={`ml-auto px-3 py-1 rounded-full text-sm ${mode === 'real' ? 'bg-green-700' : 'bg-dark-700'}`}>
              #{realData.player_rank}
            </span>
          )}
        </button>
        <button
          onClick={() => setMode('race')}
          className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
            mode === 'race'
              ? 'bg-accent-600 text-white'
              : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
          }`}
        >
          <Gauge className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Mode Course</p>
            <p className="text-xs opacity-75">≤180 km/h</p>
          </div>
          {raceData && (
            <span className={`ml-auto px-3 py-1 rounded-full text-sm ${mode === 'race' ? 'bg-accent-700' : 'bg-dark-700'}`}>
              #{raceData.player_rank}
            </span>
          )}
        </button>
        <button
          onClick={() => setMode('drivers')}
          className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
            mode === 'drivers'
              ? 'bg-purple-600 text-white'
              : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Chauffeurs</p>
            <p className="text-xs opacity-75">Mes employés</p>
          </div>
          {driversData && (
            <span className={`ml-auto px-3 py-1 rounded-full text-sm ${mode === 'drivers' ? 'bg-purple-700' : 'bg-dark-700'}`}>
              {driversData.total}
            </span>
          )}
        </button>
      </div>

      {/* Rankings */}
      {mode === 'drivers' ? (
        <DriversTable drivers={driversData?.drivers} />
      ) : currentData && (
        <RankingTable rankings={currentData.rankings} playerRank={currentData.player_rank} />
      )}

      {/* Info */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-sm text-dark-400">
        <p>📊 Le classement est réinitialisé au début de chaque mois.</p>
        <p className="mt-1">🤖 Les entreprises IA progressent en temps réel, même quand vous êtes absent.</p>
      </div>
    </div>
  )
}
