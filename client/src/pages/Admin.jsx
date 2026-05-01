import { useState, useEffect } from 'react'
import { 
  adminAddMoney, 
  adminSetMoney, 
  adminResetMoney, 
  adminSimulateTime, 
  adminResetMonthly, 
  adminTestMonthChange,
  adminResetAll,
  adminUnlockTrucks,
  adminGodMode,
  adminGetAICompanies,
  adminCreateAICompany,
  adminUpdateAICompany,
  adminDeleteAICompany,
  adminGetFreeHiring,
  adminToggleFreeHiring,
  adminGetTrucks,
  adminCreateTruck,
  adminDeleteTruck,
  adminGetSettings,
  adminUpdateSettings,
  getCompany
} from '../api'
import { Settings, DollarSign, Clock, RotateCcw, Unlock, Zap, Building2, Trash2, Plus, Sliders, Map } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

export default function Admin() {
  const [company, setCompany] = useState(null)
  const [aiCompanies, setAICompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [moneyAmount, setMoneyAmount] = useState(10000)
  const [simulateMinutes, setSimulateMinutes] = useState(60)
  const [newAIName, setNewAIName] = useState('')
  const [newAIMode, setNewAIMode] = useState('real')
  const [newAIPersonality, setNewAIPersonality] = useState('stable')
  const [newAIMaxDrivers, setNewAIMaxDrivers] = useState(5)
  const [newAISkill, setNewAISkill] = useState(1)
  const [freeHiring, setFreeHiring] = useState(false)
  const [trucks, setTrucks] = useState([])
  const [newTruckName, setNewTruckName] = useState('')
  const [newTruckPrice, setNewTruckPrice] = useState(50000)
  const [settings, setSettings] = useState({})

  // ============ KM MANAGEMENT STATE ============
  const [kmSnapshot, setKmSnapshot] = useState(null)
  const [kmEdits, setKmEdits] = useState({}) // { id: { monthly_km_real, monthly_km_race, total_km_real, total_km_race } }
  const [kmPlayerEdits, setKmPlayerEdits] = useState({})
  const [kmLoading, setKmLoading] = useState(false)
  const [kmSaving, setKmSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [companyData, aiData, freeHiringData, trucksData, settingsData] = await Promise.all([
        getCompany(),
        adminGetAICompanies(),
        adminGetFreeHiring(),
        adminGetTrucks(),
        adminGetSettings()
      ])
      setCompany(companyData)
      setAICompanies(aiData)
      setFreeHiring(freeHiringData.enabled)
      setTrucks(trucksData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============ KM MANAGEMENT FUNCTIONS ============

  async function loadKmSnapshot() {
    setKmLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/km-snapshot`)
      const data = await res.json()
      setKmSnapshot(data)

      // Initialiser les champs d'édition avec les valeurs actuelles
      const edits = {}
      for (const ai of data.ai_companies) {
        edits[ai.id] = {
          monthly_km_real: Math.round(ai.monthly_km_real || 0),
          monthly_km_race: Math.round(ai.monthly_km_race || 0),
          total_km_real:   Math.round(ai.total_km_real   || 0),
          total_km_race:   Math.round(ai.total_km_race   || 0),
        }
      }
      setKmEdits(edits)

      setKmPlayerEdits({
        monthly_km_real: Math.round(data.player?.monthly_km_real || 0),
        monthly_km_race: Math.round(data.player?.monthly_km_race || 0),
        total_km_real:   Math.round(data.player?.total_km_real   || 0),
        total_km_race:   Math.round(data.player?.total_km_race   || 0),
      })
    } catch (error) {
      alert('Erreur chargement snapshot: ' + error.message)
    } finally {
      setKmLoading(false)
    }
  }

  function handleKmEdit(id, field, value) {
    setKmEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: parseInt(value) || 0 }
    }))
  }

  function handleKmPlayerEdit(field, value) {
    setKmPlayerEdits(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
  }

  async function saveAllKm() {
    if (!confirm('Sauvegarder tous les km modifiés ?')) return
    setKmSaving(true)
    try {
      // Sauvegarder le joueur
      await fetch(`${API}/api/admin/player/km`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kmPlayerEdits)
      })

      // Sauvegarder toutes les IA
      for (const [id, km] of Object.entries(kmEdits)) {
        await fetch(`${API}/api/admin/ai-company/${id}/km`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(km)
        })
      }

      alert('✅ Tous les km ont été sauvegardés !')
      await loadKmSnapshot()
      await loadData()
    } catch (error) {
      alert('Erreur sauvegarde: ' + error.message)
    } finally {
      setKmSaving(false)
    }
  }

  async function downloadSnapshot() {
    try {
      const res = await fetch(`${API}/api/admin/km-snapshot`)
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `km-snapshot-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Erreur: ' + error.message)
    }
  }

  async function downloadDB() {
    window.open(`${API}/api/admin/backup-db`, '_blank')
  }

  // ============ EXISTING FUNCTIONS ============

  async function handleAddMoney() {
    try {
      await adminAddMoney(moneyAmount)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleSetMoney() {
    try {
      await adminSetMoney(moneyAmount)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleResetMoney() {
    try {
      await adminResetMoney()
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleSimulateTime() {
    try {
      await adminSimulateTime(simulateMinutes)
      alert(`${simulateMinutes} minutes simulées!`)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleResetMonthly() {
    if (!confirm('Réinitialiser les km mensuels + redistribuer les modes IA (50/50) ?')) return
    try {
      await adminResetMonthly()
      alert('✅ Km mensuels réinitialisés!\n🔄 Modes IA redistribués (50% réel, 50% course)')
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleTestMonthChange() {
    try {
      const result = await adminTestMonthChange()
      alert(`🧪 TEST CHANGEMENT DE MOIS\n\n${result.message}\n\nActions effectuées:\n- ${result.actions.join('\n- ')}`)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleResetAll() {
    if (!confirm('⚠️ ATTENTION: Cela va tout supprimer et recommencer à zéro. Continuer ?')) return
    try {
      await adminResetAll()
      alert('Reset complet effectué!')
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleUnlockTrucks() {
    try {
      await adminUnlockTrucks()
      alert('Tous les camions débloqués!')
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleGodMode() {
    try {
      await adminGodMode()
      alert('God mode activé! (999M€)')
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleCreateAI() {
    if (!newAIName.trim()) return
    try {
      await adminCreateAICompany({ 
        name: newAIName, 
        drive_mode: newAIMode,
        personality: newAIPersonality,
        max_drivers: newAIMaxDrivers,
        skill_level: newAISkill
      })
      setNewAIName('')
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleDeleteAI(id) {
    if (!confirm('Supprimer cette entreprise IA ?')) return
    try {
      await adminDeleteAICompany(id)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleUpdateAI(id, field, value) {
    try {
      await adminUpdateAICompany(id, { [field]: value })
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleToggleFreeHiring() {
    try {
      const result = await adminToggleFreeHiring()
      setFreeHiring(result.enabled)
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleCreateTruck() {
    if (!newTruckName.trim()) return
    try {
      await adminCreateTruck({ name: newTruckName, price: newTruckPrice })
      setNewTruckName('')
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleDeleteTruck(id) {
    if (!confirm('Supprimer ce camion ?')) return
    try {
      await adminDeleteTruck(id)
      await loadData()
    } catch (error) {
      alert(error.message)
    }
  }

  function handleSettingChange(key, value) {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }))
  }

  async function handleSaveSettings() {
    try {
      const settingsToSave = {}
      for (const [key, data] of Object.entries(settings)) {
        settingsToSave[key] = data.value
      }
      await adminUpdateSettings(settingsToSave)
      alert('✅ Paramètres sauvegardés!')
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
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <p className="text-dark-400 text-sm">Mode debug / test</p>
        </div>
      </div>

      {/* Current balance */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <p className="text-dark-400">Solde actuel</p>
        <p className="text-3xl font-bold text-green-500">
          {company?.balance?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
        </p>
      </div>

      {/* Money controls */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Gestion argent
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-dark-400 text-sm mb-1">Montant</label>
            <input
              type="number"
              value={moneyAmount}
              onChange={(e) => setMoneyAmount(parseInt(e.target.value) || 0)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 w-40"
            />
          </div>
          <button onClick={handleAddMoney} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
            + Ajouter
          </button>
          <button onClick={handleSetMoney} className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg">
            = Définir
          </button>
          <button onClick={handleResetMoney} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
            Reset à 0
          </button>
          <button onClick={handleGodMode} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <Zap className="w-4 h-4" />
            God Mode
          </button>
        </div>
      </div>

      {/* Time simulation */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          Simulation temps
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-dark-400 text-sm mb-1">Minutes à simuler</label>
            <input
              type="number"
              value={simulateMinutes}
              onChange={(e) => setSimulateMinutes(parseInt(e.target.value) || 0)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 w-40"
            />
          </div>
          <button onClick={handleSimulateTime} className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg">
            Simuler
          </button>
          <button onClick={() => { setSimulateMinutes(60); handleSimulateTime(); }} className="bg-dark-600 hover:bg-dark-500 px-4 py-2 rounded-lg">
            +1 heure
          </button>
          <button onClick={() => { setSimulateMinutes(1440); handleSimulateTime(); }} className="bg-dark-600 hover:bg-dark-500 px-4 py-2 rounded-lg">
            +1 jour
          </button>
          <button onClick={() => { setSimulateMinutes(10080); handleSimulateTime(); }} className="bg-dark-600 hover:bg-dark-500 px-4 py-2 rounded-lg">
            +1 semaine
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Unlock className="w-5 h-5 text-accent-500" />
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleUnlockTrucks} className="bg-accent-600 hover:bg-accent-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <Unlock className="w-4 h-4" />
            Débloquer tous les camions
          </button>
          <button onClick={handleResetMonthly} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset km mensuels
          </button>
          <button onClick={handleTestMonthChange} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2">
            🧪 Tester Fin de Mois
          </button>
          <button onClick={downloadDB} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2">
            💾 Télécharger la DB
          </button>
          <button onClick={handleResetAll} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            RESET COMPLET
          </button>
        </div>
      </div>

      {/* ============ GESTION KM ============ */}
      <div className="bg-dark-800 rounded-xl p-6 border border-orange-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Map className="w-5 h-5 text-orange-400" />
            Gestion des KM (restauration après reset)
          </h2>
          <div className="flex gap-3">
            <button
              onClick={downloadSnapshot}
              className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              📥 Sauvegarder snapshot
            </button>
            <button
              onClick={loadKmSnapshot}
              disabled={kmLoading}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              {kmLoading ? '⏳ Chargement...' : '📊 Charger les km actuels'}
            </button>
          </div>
        </div>

        {!kmSnapshot ? (
          <div className="text-center py-8 text-dark-400">
            <p>Clique sur <strong>"Charger les km actuels"</strong> pour voir et modifier les km de chaque équipe.</p>
            <p className="text-sm mt-2">Utile pour restaurer les km après un reset Render.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-700">
                  <tr className="text-left text-dark-400">
                    <th className="px-3 py-2">Équipe</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2">Km mensuel Réel</th>
                    <th className="px-3 py-2">Km mensuel Course</th>
                    <th className="px-3 py-2">Km total Réel</th>
                    <th className="px-3 py-2">Km total Course</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">

                  {/* Joueur */}
                  <tr className="bg-primary-900/30 hover:bg-primary-900/50">
                    <td className="px-3 py-2 font-bold text-primary-400">
                      🎮 {company?.name || 'Ma VTC'} (Vous)
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-1 rounded ${company?.drive_mode === 'race' ? 'bg-orange-700' : 'bg-blue-700'}`}>
                        {company?.drive_mode === 'race' ? '🏎️ Course' : '🚗 Réel'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={kmPlayerEdits.monthly_km_real ?? 0}
                        onChange={(e) => handleKmPlayerEdit('monthly_km_real', e.target.value)}
                        className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={kmPlayerEdits.monthly_km_race ?? 0}
                        onChange={(e) => handleKmPlayerEdit('monthly_km_race', e.target.value)}
                        className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={kmPlayerEdits.total_km_real ?? 0}
                        onChange={(e) => handleKmPlayerEdit('total_km_real', e.target.value)}
                        className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={kmPlayerEdits.total_km_race ?? 0}
                        onChange={(e) => handleKmPlayerEdit('total_km_race', e.target.value)}
                        className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                      />
                    </td>
                  </tr>

                  {/* IA */}
                  {kmSnapshot.ai_companies.map((ai) => (
                    <tr key={ai.id} className="hover:bg-dark-700/50">
                      <td className="px-3 py-2 font-semibold">{ai.name}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-1 rounded ${ai.drive_mode === 'race' ? 'bg-orange-700' : 'bg-blue-700'}`}>
                          {ai.drive_mode === 'race' ? '🏎️ Course' : '🚗 Réel'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={kmEdits[ai.id]?.monthly_km_real ?? 0}
                          onChange={(e) => handleKmEdit(ai.id, 'monthly_km_real', e.target.value)}
                          className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={kmEdits[ai.id]?.monthly_km_race ?? 0}
                          onChange={(e) => handleKmEdit(ai.id, 'monthly_km_race', e.target.value)}
                          className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={kmEdits[ai.id]?.total_km_real ?? 0}
                          onChange={(e) => handleKmEdit(ai.id, 'total_km_real', e.target.value)}
                          className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={kmEdits[ai.id]?.total_km_race ?? 0}
                          onChange={(e) => handleKmEdit(ai.id, 'total_km_race', e.target.value)}
                          className="w-28 bg-dark-600 border border-dark-500 rounded px-2 py-1 text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={saveAllKm}
                disabled={kmSaving}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                {kmSaving ? '⏳ Sauvegarde...' : '✅ Sauvegarder tous les km'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Companies */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Entreprises IA ({aiCompanies.length})
          </h2>
          <button 
            onClick={handleToggleFreeHiring}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${freeHiring ? 'bg-green-600 hover:bg-green-700' : 'bg-dark-600 hover:bg-dark-500'}`}
          >
            {freeHiring ? '✅ Embauche gratuite ON' : '💰 Embauche gratuite OFF'}
          </button>
        </div>
        
        {/* Add new AI */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <input
            type="text"
            value={newAIName}
            onChange={(e) => setNewAIName(e.target.value)}
            placeholder="Nom de l'entreprise"
            className="col-span-2 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2"
          />
          <select
            value={newAIMode}
            onChange={(e) => setNewAIMode(e.target.value)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="real">🚗 Réel</option>
            <option value="race">🏎️ Course</option>
          </select>
          <select
            value={newAIPersonality}
            onChange={(e) => setNewAIPersonality(e.target.value)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="passive">😴 Passive</option>
            <option value="stable">⚖️ Stable</option>
            <option value="aggressive">🔥 Agressive</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-dark-400 text-xs">Max:</label>
            <input
              type="number"
              value={newAIMaxDrivers}
              onChange={(e) => setNewAIMaxDrivers(parseInt(e.target.value) || 1)}
              min="1"
              max="15"
              className="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-2 text-sm"
            />
          </div>
          <button onClick={handleCreateAI} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </div>

        {/* AI list */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700">
              <tr className="text-left text-dark-400">
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Personnalité</th>
                <th className="px-3 py-2">Chauffeurs</th>
                <th className="px-3 py-2">Km Réel</th>
                <th className="px-3 py-2">Km Course</th>
                <th className="px-3 py-2">Solde</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {aiCompanies.map((ai) => (
                <tr key={ai.id} className="hover:bg-dark-700/50">
                  <td className="px-3 py-2 font-semibold">{ai.name}</td>
                  <td className="px-3 py-2">
                    <select
                      value={ai.drive_mode}
                      onChange={(e) => handleUpdateAI(ai.id, 'drive_mode', e.target.value)}
                      className="bg-dark-600 border-none rounded px-2 py-1 text-xs"
                    >
                      <option value="real">🚗 Réel</option>
                      <option value="race">🏎️ Course</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={ai.personality || 'stable'}
                      onChange={(e) => handleUpdateAI(ai.id, 'personality', e.target.value)}
                      className="bg-dark-600 border-none rounded px-2 py-1 text-xs"
                    >
                      <option value="passive">😴 Passive</option>
                      <option value="stable">⚖️ Stable</option>
                      <option value="aggressive">🔥 Agressive</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={ai.driver_count}
                      onChange={(e) => handleUpdateAI(ai.id, 'driver_count', parseInt(e.target.value) || 1)}
                      min="1"
                      max="15"
                      className="w-14 bg-dark-600 border-none rounded px-2 py-1 text-xs text-center"
                    />
                  </td>
                  <td className="px-3 py-2">{Math.round(ai.monthly_km_real || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{Math.round(ai.monthly_km_race || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{Math.round(ai.balance || 0).toLocaleString()}€</td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleDeleteAI(ai.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-500" />
            Paramètres IA (Équilibrage)
          </h2>
          <button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
            💾 Sauvegarder
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'ai_km_multiplier',      label: 'Multiplicateur km IA',      step: '0.1',  suffix: 'x' },
            { key: 'player_km_multiplier',  label: 'Multiplicateur km Joueur',  step: '0.1',  suffix: 'x' },
            { key: 'ai_break_probability',  label: 'Probabilité pause',         step: '0.01', suffix: '' },
            { key: 'ai_active_hours_start', label: 'Heure début activité',      step: '1',    suffix: 'h' },
            { key: 'ai_active_hours_end',   label: 'Heure fin activité',        step: '1',    suffix: 'h' },
            { key: 'revenue_per_km_real',   label: 'Revenu/km (Réel)',          step: '0.1',  suffix: '€/km' },
            { key: 'revenue_per_km_race',   label: 'Revenu/km (Course)',        step: '0.1',  suffix: '€/km' },
            { key: 'base_km_per_min_real',  label: 'Km base/min (Réel)',        step: '0.1',  suffix: 'km/min' },
            { key: 'base_km_per_min_race',  label: 'Km base/min (Course)',      step: '0.1',  suffix: 'km/min' },
          ].map(({ key, label, step, suffix }) => (
            <div key={key} className="bg-dark-700 rounded-lg p-4">
              <label className="block text-dark-400 text-sm mb-1">{label}</label>
              <input
                type="number"
                step={step}
                value={settings[key]?.value || ''}
                onChange={(e) => handleSettingChange(key, e.target.value)}
                className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2"
              />
              <p className="text-dark-500 text-xs mt-1">
                Actuellement: {settings[key]?.value || '—'}{suffix}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trucks Management */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🚛 Camions disponibles ({trucks.length})
        </h2>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newTruckName}
            onChange={(e) => setNewTruckName(e.target.value)}
            placeholder="Nom du camion (ex: Volvo FH16)"
            className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2"
          />
          <div className="flex items-center gap-2">
            <label className="text-dark-400 text-sm">Prix:</label>
            <input
              type="number"
              value={newTruckPrice}
              onChange={(e) => setNewTruckPrice(parseInt(e.target.value) || 50000)}
              step="5000"
              className="w-28 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
            />
            <span className="text-dark-400">€</span>
          </div>
          <button onClick={handleCreateTruck} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trucks.map((truck) => (
            <div key={truck.id} className="bg-dark-700 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{truck.name}</p>
                <p className="text-dark-400 text-xs">{truck.price?.toLocaleString()}€</p>
              </div>
              <button onClick={() => handleDeleteTruck(truck.id)} className="text-red-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}