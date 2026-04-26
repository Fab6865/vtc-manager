import { useState, useEffect } from 'react'
import { getGallery, deletePhoto } from '../api'
import { Image, Upload, Trash2, X } from 'lucide-react'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  async function loadPhotos() {
    try {
      const data = await getGallery()
      setPhotos(data)
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        await loadPhotos()
      }
    } catch (error) {
      alert('Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette photo ?')) return
    try {
      await deletePhoto(id)
      await loadPhotos()
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
          <Image className="w-8 h-8 text-primary-500" />
          Galerie
        </h1>
        <label className={`bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Upload...' : 'Ajouter une photo'}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center">
          <Image className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Aucune photo dans la galerie</p>
          <p className="text-dark-500 text-sm mt-2">Ajoutez des photos de votre entreprise, camions, convois...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-dark-800 border border-dark-700">
              <img
                src={photo.image_path}
                alt={photo.title}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm truncate">{photo.title}</p>
                  <p className="text-xs text-dark-400">
                    {new Date(photo.uploaded_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-dark-300 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto.image_path}
            alt={selectedPhoto.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-lg">{selectedPhoto.title}</p>
            <p className="text-dark-400 text-sm">
              {new Date(selectedPhoto.uploaded_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
