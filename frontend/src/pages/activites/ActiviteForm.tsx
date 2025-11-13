import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHead from '../../components/ui/PageHead'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/Icon'
import { useNotification } from '../../contexts/NotificationContext'
import { activiteService } from '../../services/activiteService'

interface ActiviteFormData {
  nom: string
  description?: string
  capacite: number
  date_debut: string
  date_fin?: string
  heure_debut?: string
  heure_fin?: string
  lieu: string
  prix: number
  type: string
  responsable_id?: number
}

interface ActiviteOptions {
  types: Array<{ value: string; label: string }>
  responsables: Array<{ value: number; label: string }>
}

const ActiviteForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showSuccess, showError } = useNotification()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState<ActiviteFormData>({
    nom: '',
    description: '',
    capacite: 10,
    date_debut: '',
    date_fin: '',
    heure_debut: '',
    heure_fin: '',
    lieu: '',
    prix: 0,
    type: '',
    responsable_id: undefined
  })

  const [options, setOptions] = useState<ActiviteOptions>({ types: [], responsables: [] })
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activityTypes = [
    { value: 'sport', label: 'Sport' },
    { value: 'culturel', label: 'Culturel' },
    { value: 'artistique', label: 'Artistique' },
    { value: 'scientifique', label: 'Scientifique' },
    { value: 'social', label: 'Social' },
    { value: 'autre', label: 'Autre' }
  ]

  useEffect(() => {
    loadOptions()
    if (isEdit) {
      loadActivite()
    }
  }, [id])

  const loadOptions = async () => {
    try {
      setLoadingOptions(true)
      const response = await activiteService.getOptions()
      setOptions(response.data)
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger les options')
    } finally {
      setLoadingOptions(false)
    }
  }

  const loadActivite = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await activiteService.getById(parseInt(id))
      const activite = response.data
      setFormData({
        nom: activite.nom,
        description: activite.description || '',
        capacite: activite.capacite,
        date_debut: activite.date_debut,
        date_fin: activite.date_fin || '',
        heure_debut: activite.heure_debut || '',
        heure_fin: activite.heure_fin || '',
        lieu: activite.lieu,
        prix: activite.prix,
        type: activite.type,
        responsable_id: activite.responsable_id
      })
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger l\'activité')
      navigate('/activites')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ActiviteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!formData.lieu.trim()) newErrors.lieu = 'Le lieu est requis'
    if (!formData.type) newErrors.type = 'Le type est requis'
    if (formData.capacite < 1) newErrors.capacite = 'La capacité doit être supérieure à 0'
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise'
    if (formData.prix < 0) newErrors.prix = 'Le prix ne peut pas être négatif'

    if (formData.date_fin && formData.date_debut && new Date(formData.date_fin) < new Date(formData.date_debut)) {
      newErrors.date_fin = 'La date de fin doit être postérieure à la date de début'
    }

    if (formData.heure_debut && formData.heure_fin && formData.heure_debut >= formData.heure_fin) {
      newErrors.heure_fin = 'L\'heure de fin doit être postérieure à l\'heure de début'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      if (isEdit) {
        await activiteService.update(parseInt(id!), formData)
        showSuccess('Succès', 'Activité mise à jour avec succès')
      } else {
        await activiteService.create(formData)
        showSuccess('Succès', 'Activité créée avec succès')
      }
      
      navigate('/activites')
    } catch (err: any) {
      showError('Erreur', err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={isEdit ? 'Modifier l\'activité' : 'Nouvelle activité'}
        subtitle={isEdit ? 'Modifiez les informations de l\'activité' : 'Créez une nouvelle activité parascolaire'}
        actions={[
          {
            label: 'Retour',
            icon: 'arrow-left',
            onClick: () => navigate('/activites'),
            variant: 'ghost' as const
          }
        ]}
      />

      <Card>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Nom */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Nom de l'activité *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Club de Football"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez l'activité..."
                />
              </div>

              {/* Type */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Type d'activité *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un type</option>
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>

              {/* Capacité */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Capacité *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacite}
                  onChange={(e) => handleInputChange('capacite', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.capacite ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.capacite && <p className="mt-1 text-sm text-red-600">{errors.capacite}</p>}
              </div>

              {/* Lieu */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Lieu *
                </label>
                <input
                  type="text"
                  value={formData.lieu}
                  onChange={(e) => handleInputChange('lieu', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lieu ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Terrain de sport"
                />
                {errors.lieu && <p className="mt-1 text-sm text-red-600">{errors.lieu}</p>}
              </div>

              {/* Prix */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Prix (MAD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prix}
                  onChange={(e) => handleInputChange('prix', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prix ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.prix && <p className="mt-1 text-sm text-red-600">{errors.prix}</p>}
              </div>

              {/* Responsable */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Responsable
                </label>
                <select
                  value={formData.responsable_id || ''}
                  onChange={(e) => handleInputChange('responsable_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un responsable</option>
                  {options.responsables.map(responsable => (
                    <option key={responsable.value} value={responsable.value}>
                      {responsable.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date de début */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => handleInputChange('date_debut', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.date_debut ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date_debut && <p className="mt-1 text-sm text-red-600">{errors.date_debut}</p>}
              </div>

              {/* Date de fin */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => handleInputChange('date_fin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.date_fin ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date_fin && <p className="mt-1 text-sm text-red-600">{errors.date_fin}</p>}
              </div>

              {/* Heure de début */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={formData.heure_debut}
                  onChange={(e) => handleInputChange('heure_debut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Heure de fin */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={formData.heure_fin}
                  onChange={(e) => handleInputChange('heure_fin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.heure_fin ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.heure_fin && <p className="mt-1 text-sm text-red-600">{errors.heure_fin}</p>}
              </div>

            </div>

            <div className="flex justify-end pt-6 space-x-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/activites')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                loading={loading}
                icon={<Icon name="save" size="sm" />}
              >
                {isEdit ? 'Mettre à jour' : 'Créer l\'activité'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default ActiviteForm