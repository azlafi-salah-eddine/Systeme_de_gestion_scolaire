import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHead from '../../components/ui/PageHead'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/Icon'
import { useNotification } from '../../contexts/NotificationContext'
import { activiteService } from '../../services/activiteService'
import { eleveService } from '../../services/eleveService'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

interface Activite {
  id: number
  nom: string
  description: string
  capacite: number
  places_disponibles: number
  est_complet: boolean
  date_debut: string
  date_fin?: string
  heure_debut?: string
  heure_fin?: string
  lieu: string
  prix: number
  type: string
  type_label: string
  responsable_id?: number
  responsable?: {
    id: number
    nom: string
    prenom: string
    nom_complet: string
  }
  active: boolean
  est_en_cours: boolean
  est_terminee: boolean
  eleves_count: number
  eleves?: Array<{
    id: number
    nom: string
    prenom: string
    nom_complet: string
    pivot: {
      date_inscription: string
      statut: 'inscrit' | 'present' | 'absent' | 'exclu'
      notes?: string
    }
  }>
  created_at: string
  updated_at: string
}


interface Eleve {
  id: number
  nom: string
  prenom: string
  nom_complet: string
  classe?: {
    nom: string
    niveau: string
  }
}

const ActiviteShow: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()

  const [activite, setActivite] = useState<Activite | null>(null)
  const [eleves, setEleves] = useState<Activite['eleves']>([])
  const [allEleves, setAllEleves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEleves, setLoadingEleves] = useState(false)
  const [showInscriptionModal, setShowInscriptionModal] = useState(false)
  const [showPresenceModal, setShowPresenceModal] = useState(false)
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null)
  
  // États pour le filtrage des élèves
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [niveaux, setNiveaux] = useState<Array<{id: number, nom: string}>>([])
  const [classes, setClasses] = useState<Array<{id: number, nom: string, niveau_id: number}>>([])
  const [filteredEleves, setFilteredEleves] = useState<any[]>([])
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; eleveId: number | null; eleveName: string }>({ 
    isOpen: false, 
    eleveId: null, 
    eleveName: '' 
  })

  useEffect(() => {
    if (id) {
      loadActivite()
      loadEleves()
      loadAllEleves()
      loadNiveaux()
      loadClasses()
    }
  }, [id])

  // Logique de filtrage des élèves
  useEffect(() => {
    // Par défaut, ne rien afficher
    let filtered: any[] = []
    
    // Afficher les élèves seulement si niveau ET classe sont sélectionnés
    if (selectedNiveau && selectedClasse) {
      filtered = allEleves
        .filter(eleve => !eleves?.some(e => e.id === eleve.id))
        .filter(eleve => {
          const classeId = (eleve as any).classe_id || (eleve as any).classe?.id
          return classeId === parseInt(selectedClasse)
        })
    }
    
    setFilteredEleves(filtered)
  }, [allEleves, eleves, selectedNiveau, selectedClasse, classes])

  // Réinitialiser la classe quand le niveau change
  useEffect(() => {
    setSelectedClasse('')
  }, [selectedNiveau])

  const loadActivite = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await activiteService.getById(parseInt(id))
      setActivite(response.data)
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger l\'activité')
      navigate('/activites')
    } finally {
      setLoading(false)
    }
  }

  const loadEleves = async () => {
    if (!id) return
    try {
      setLoadingEleves(true)
      const response = await activiteService.getEleves(parseInt(id))
      setEleves(response.data || [])
    } catch (err: any) {
      // Erreur silencieuse pour éviter les notifications répétées
    } finally {
      setLoadingEleves(false)
    }
  }


  const loadAllEleves = async () => {
    try {
      const response = await eleveService.getEleves({ per_page: 1000 })
      setAllEleves(response.data || [])
    } catch (err: any) {
      // Erreur silencieuse
    }
  }

  const loadNiveaux = async () => {
    try {
      const response = await fetch('/api/v1/niveaux', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const text = await response.text()
        const cleanText = text.replace(/^\uFEFF/, '')
        const data = JSON.parse(cleanText)
        setNiveaux(data.data || [])
      }
    } catch (err) {
      // Erreur silencieuse
    }
  }

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/v1/classes', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const text = await response.text()
        const cleanText = text.replace(/^\uFEFF/, '')
        const data = JSON.parse(cleanText)
        setClasses(data.data || [])
      }
    } catch (err) {
      // Erreur silencieuse
    }
  }

  const handleInscription = async (eleveId: number) => {
    if (!id) return
    try {
      await activiteService.inscrireEleve(parseInt(id), eleveId)
      showSuccess('Succès', 'Élève inscrit avec succès')
      await loadEleves()
      setShowInscriptionModal(false)
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible d\'inscrire l\'élève')
    }
  }

  const openInscriptionModal = () => {
    // Réinitialiser les filtres
    setSelectedNiveau('')
    setSelectedClasse('')
    setShowInscriptionModal(true)
  }

  const requestDesinscription = (eleveId: number, eleveName: string) => {
    setConfirmState({ isOpen: true, eleveId, eleveName })
  }

  const confirmDesinscription = async () => {
    if (!id || !confirmState.eleveId) return
    try {
      await activiteService.desinscrireEleve(parseInt(id), confirmState.eleveId)
      showSuccess('Succès', 'Élève désinscrit avec succès')
      await loadEleves()
      setConfirmState({ isOpen: false, eleveId: null, eleveName: '' })
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de désinscrire l\'élève')
    }
  }

  const handlePresence = async (eleveId: number, statut: 'present' | 'absent' | 'exclu') => {
    if (!id) return
    try {
      await activiteService.marquerPresence(parseInt(id), eleveId, statut)
      showSuccess('Succès', 'Présence mise à jour')
      await loadEleves()
      setShowPresenceModal(false)
      setSelectedEleve(null)
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de mettre à jour la présence')
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      sport: 'text-red-600 dark:text-red-200 bg-red-100 dark:bg-red-900/30',
      culturel: 'text-purple-600 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/30',
      artistique: 'text-pink-600 dark:text-pink-200 bg-pink-100 dark:bg-pink-900/30',
      scientifique: 'text-blue-600 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30',
      social: 'text-green-600 dark:text-green-200 bg-green-100 dark:bg-green-900/30',
      autre: 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'
    }
    return colors[type as keyof typeof colors] || colors.autre
  }

  const getStatusColor = (statut: string) => {
    const colors = {
      inscrit: 'text-blue-600 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30',
      present: 'text-green-600 dark:text-green-200 bg-green-100 dark:bg-green-900/30',
      absent: 'text-red-600 dark:text-red-200 bg-red-100 dark:bg-red-900/30',
      exclu: 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'
    }
    return colors[statut as keyof typeof colors] || colors.inscrit
  }

  const getStatusIcon = (statut: string) => {
    const icons = {
      inscrit: 'user',
      present: 'check-circle',
      absent: 'x-circle',
      exclu: 'alert-circle'
    }
    return icons[statut as keyof typeof icons] || 'user'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    )
  }

  if (!activite) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Activité non trouvée</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">L'activité demandée n'existe pas ou a été supprimée.</p>
        <Button onClick={() => navigate('/activites')} icon="arrow-left">
          Retour aux activités
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={activite.nom}
        subtitle={`${activite.type_label} • ${activite.lieu}`}
        actions={[
          {
            label: 'Retour',
            icon: 'arrow-left',
            onClick: () => navigate('/activites'),
            variant: 'ghost' as const
          },
          {
            label: 'Modifier',
            icon: 'edit',
            onClick: () => navigate(`/activites/${activite.id}/edit`),
            variant: 'secondary' as const
          }
        ]}
      />

      {/* Informations générales */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{activite.description || 'Aucune description'}</p>
              </div>
              
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Type</h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(activite.type)}`}>
                  {activite.type_label}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Dates et horaires</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span>Début: {new Date(activite.date_debut).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {activite.date_fin && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span>Fin: {new Date(activite.date_fin).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {activite.heure_debut && activite.heure_fin && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span>{activite.heure_debut} - {activite.heure_fin}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Lieu</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span>{activite.lieu}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Responsable</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span>{activite.responsable ? activite.responsable.nom_complet : 'Non assigné'}</span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Prix</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <span>{activite.prix > 0 ? `${activite.prix} MAD` : 'Gratuit'}</span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Statut</h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  activite.est_terminee ? 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-800' :
                  activite.est_en_cours ? 'text-green-600 dark:text-green-200 bg-green-100 dark:bg-green-900/30' :
                  'text-blue-600 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {activite.est_terminee ? 'Terminée' :
                   activite.est_en_cours ? 'En cours' : 'À venir'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>


      {/* Élèves inscrits */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Élèves inscrits ({eleves?.length || 0})</h3>
            <Button
              onClick={openInscriptionModal}
              icon={<Icon name="user-plus" size="sm" />}
              disabled={activite.est_complet}
            >
              Inscrire un élève
            </Button>
          </div>

          {loadingEleves ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          ) : eleves && eleves.length > 0 ? (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">Élève</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">Classe</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">Date d'inscription</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {eleves.map((eleve) => (
                    <tr key={eleve.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900 dark:text-white">{eleve.nom_complet}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {(eleve as any).classe?.nom || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {eleve.pivot?.date_inscription ? new Date(eleve.pivot.date_inscription).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(eleve.pivot?.statut || 'inscrit')}`}>
                          {eleve.pivot?.statut || 'inscrit'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            className="p-1.5 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Marquer présence"
                            aria-label="Marquer présence"
                            onClick={() => {
                              setSelectedEleve(eleve)
                              setShowPresenceModal(true)
                            }}
                          >
                            <Icon name="user-check" size="sm" />
                          </button>
                          <button
                            className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Désinscrire"
                            aria-label="Désinscrire"
                            onClick={() => requestDesinscription(eleve.id, eleve.nom_complet)}
                          >
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun élève inscrit</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">Commencez par inscrire des élèves à cette activité.</p>
              <Button onClick={openInscriptionModal} icon={<Icon name="user-plus" size="sm" />}>
                Inscrire un élève
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal d'inscription avec filtrage intelligent */}
      {showInscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Inscrire un élève
                </h3>
                <button
                  onClick={() => setShowInscriptionModal(false)}
                  className="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
                
              {/* Filtres de sélection */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Niveau
                  </label>
                  <select
                    value={selectedNiveau}
                    onChange={(e) => setSelectedNiveau(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les niveaux</option>
                    {niveaux.map((niveau) => (
                      <option key={niveau.id} value={niveau.id}>
                        {niveau.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Classe
                  </label>
                  <select
                    value={selectedClasse}
                    onChange={(e) => setSelectedClasse(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={!selectedNiveau}
                  >
                    <option value="">Toutes les classes</option>
                    {classes
                      .filter(classe => !selectedNiveau || classe.niveau_id === parseInt(selectedNiveau))
                      .map((classe) => (
                        <option key={classe.id} value={classe.id}>
                          {classe.nom}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Liste des élèves filtrés */}
              <div className="overflow-y-auto border border-gray-200 dark:border-gray-700 rounded max-h-48 bg-gray-50 dark:bg-gray-900">
                {filteredEleves.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredEleves.map(eleve => (
                      <div key={eleve.id} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{eleve.nom_complet}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {eleve.classe?.nom || 'Classe non définie'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleInscription(eleve.id)}
                          className="flex-shrink-0 px-2 py-1 ml-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          Inscrire
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                    <Icon name="users" size="lg" className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm">
                      {!selectedNiveau || !selectedClasse 
                        ? "Sélectionnez un niveau ET une classe pour voir les élèves"
                        : "Aucun élève disponible pour les critères sélectionnés"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de présence */}
      {showPresenceModal && selectedEleve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-50">
            <div className="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Marquer la présence
                </h3>
                <button
                  onClick={() => setShowPresenceModal(false)}
                  className="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
                      {selectedEleve.nom_complet?.charAt(0)}
                    </span>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">{selectedEleve.nom_complet}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedEleve as any).classe?.nom || 'N/A'}</p>
                </div>
              
              <div className="space-y-2">
                <button
                  className="flex items-center w-full p-3 text-left text-green-700 dark:text-green-300 transition-colors border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50"
                  onClick={() => handlePresence(selectedEleve.id, 'present')}
                >
                  <div className="flex items-center justify-center w-6 h-6 mr-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <Icon name="check-circle" size="sm" className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Présent</div>
                  </div>
                </button>
                
                <button
                  className="flex items-center w-full p-3 text-left text-red-700 dark:text-red-300 transition-colors border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={() => handlePresence(selectedEleve.id, 'absent')}
                >
                  <div className="flex items-center justify-center w-6 h-6 mr-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                    <Icon name="x-circle" size="sm" className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Absent</div>
                  </div>
                </button>
                
                <button
                  className="flex items-center w-full p-3 text-left text-orange-700 dark:text-orange-300 transition-colors border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                  onClick={() => handlePresence(selectedEleve.id, 'exclu')}
                >
                  <div className="flex items-center justify-center w-6 h-6 mr-3 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                    <Icon name="ban" size="sm" className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Exclu</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, eleveId: null, eleveName: '' })}
        onConfirm={confirmDesinscription}
        title="Désinscrire l'élève"
        message={`Êtes-vous sûr de vouloir désinscrire "${confirmState.eleveName}" de cette activité ?`}
        confirmText="Désinscrire"
        cancelText="Annuler"
        type="warning"
      />
    </div>
  )
}

export default ActiviteShow