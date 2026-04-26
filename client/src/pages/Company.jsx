import { useState, useEffect } from 'react'
import { getCompany, updateCompany } from '../api'
import { Building2, Save, Upload, Car, Gauge } from 'lucide-react'

export default function Company() {
  const [company, setCompany] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCompany()
  }, [])

  async function loadCompany() {
    try {
      const data = await getCompany()
      setCompany(data)
      setName(data.name)
    } catch (error) {
      console.error('Error loading company:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateCompany({ name })
      await loadCompany()
    } catch (error) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleModeChange(mode) {
    try {
      await updateCompany({ drive_mode: mode })
      await loadCompany()
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('logo', file)

    try {
      const response = await fetch('/api/company/logo', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        await loadCompany()
      }
    } catch (error) {
      alert('Erreur upload logo')
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
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary-500" />
        Mon Entreprise
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-xl font-semibold mb-6">Informations</h2>
          
          {/* Logo */}
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-dark-600">
              {company.logo ? (
                <img src={company.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-dark-500" />
              )}
            </div>
            <div>
              <label className="cursor-pointer bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4" />
                Changer le logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-dark-500 text-sm mt-2">PNG, JPG (max 2MB)</p>
            </div>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label className="block text-dark-400 text-sm mb-2">Nom de l'entreprise</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Ma VTC"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* Drive Mode */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-xl font-semibold mb-6">Mode de conduite équipe</h2>
          <p className="text-dark-400 mb-6">
            Ce mode s'applique à tous vos chauffeurs IA. Il détermine comment ils roulent et les revenus générés.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleModeChange('real')}
              className={`p-6 rounded-xl border-2 transition-all ${
                company.drive_mode === 'real'
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  company.drive_mode === 'real' ? 'bg-green-600' : 'bg-dark-600'
                }`}>
                  <Car className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Mode Réel</h3>
                  <p className="text-dark-400 text-sm">Vitesse max 100 km/h • 1.20€/km</p>
                </div>
              </div>
              {company.drive_mode === 'real' && (
                <div className="mt-4 text-green-500 text-sm font-semibold">✓ Mode actif</div>
              )}
            </button>

            <button
              onClick={() => handleModeChange('race')}
              className={`p-6 rounded-xl border-2 transition-all ${
                company.drive_mode === 'race'
                  ? 'border-accent-500 bg-accent-900/20'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  company.drive_mode === 'race' ? 'bg-accent-600' : 'bg-dark-600'
                }`}>
                  <Gauge className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Mode Course</h3>
                  <p className="text-dark-400 text-sm">Vitesse max 180 km/h • 0.80€/km</p>
                </div>
              </div>
              {company.drive_mode === 'race' && (
                <div className="mt-4 text-accent-500 text-sm font-semibold">✓ Mode actif</div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-dark-400 text-sm">Solde</p>
            <p className="text-xl font-bold text-green-500">
              {company.balance?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-dark-400 text-sm">Chauffeurs</p>
            <p className="text-xl font-bold">{company.driver_count || 0}</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-dark-400 text-sm">Camions</p>
            <p className="text-xl font-bold">{company.truck_count || 0}</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-dark-400 text-sm">Km ce mois</p>
            <p className="text-xl font-bold">
              {Math.round((company.monthly_km_real || 0) + (company.monthly_km_race || 0)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
