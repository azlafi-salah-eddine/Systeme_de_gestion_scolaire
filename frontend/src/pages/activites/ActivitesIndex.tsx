import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHead from '../../components/ui/PageHead'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/Icon'
import { activiteService } from '../../services/activiteService'
import { useNotification } from '../../contexts/NotificationContext'
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext'
import { useAuth } from '../../contexts/AuthContext'
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter'
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
  created_at: string
  updated_at: string
}

const ActivitesIndex: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const { anneeActive } = useAnneeScolaire()
  const { user } = useAuth()
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin'
  
  const [activites, setActivites] = useState<Activite[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined)
  const [selectedType, setSelectedType] = useState('')
  const pageSize = 5
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; name: string }>({ 
    isOpen: false, 
    id: null, 
    name: '' 
  })

  // Mettre à jour le filtre avec l'année active quand elle est disponible (pour Admin/Prof)
  useEffect(() => {
    if (anneeActive) {
      // Pour Admin/Prof: toujours utiliser l'année active
      // Pour Super Admin: utiliser l'année active par défaut si aucune n'est sélectionnée
      if (!isSuperAdmin || !selectedAnneeScolaire) {
        setSelectedAnneeScolaire(anneeActive.id)
      }
    }
  }, [anneeActive, isSuperAdmin])

  useEffect(() => {
    loadActivites()
  }, [currentPage, searchQuery, selectedAnneeScolaire, selectedType])

  const loadActivites = async () => {
    try {
      setLoading(true)
      setError(null)
      let queryParams = `page=${currentPage}&per_page=${pageSize}`
      
      if (searchQuery) {
        queryParams += `&search=${searchQuery}`
      }
      
      if (selectedAnneeScolaire) {
        queryParams += `&annee_scolaire_id=${selectedAnneeScolaire}`
      }
      
      if (selectedType) {
        queryParams += `&type=${selectedType}`
      }
      
      const response = await activiteService.getAll(queryParams)
      setActivites(response.data)
      setTotalItems(response.meta?.total || response.data.length)
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement des activités')
    } finally {
      setLoading(false)
    }
  }


  const requestDelete = (id: number, name: string) => {
    setConfirmState({ isOpen: true, id, name })
  }

  const confirmDelete = async () => {
    if (!confirmState.id) return
    try {
      await activiteService.delete(confirmState.id)
      showSuccess('Activité supprimée', 'L\'activité a été supprimée avec succès.')
      await loadActivites()
    } catch (err: any) {
      showError('Échec de suppression', err.message || 'Erreur de suppression')
    } finally {
      setConfirmState({ isOpen: false, id: null, name: '' })
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

  const getStatusColor = (activite: Activite) => {
    if (activite.est_terminee) return 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'
    if (activite.est_en_cours) return 'text-green-600 dark:text-green-200 bg-green-100 dark:bg-green-900/30'
    return 'text-blue-600 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30'
  }

  const getStatusText = (activite: Activite) => {
    if (activite.est_terminee) return 'Terminée'
    if (activite.est_en_cours) return 'En cours'
    return 'À venir'
  }


  return (
    <div className="space-y-6">
      <PageHead
        title="Activités Parascolaires"
        subtitle="Gérez les activités parascolaires de l'école"
        actions={[
          {
            label: 'Nouvelle Activité',
            icon: 'plus',
            onClick: () => navigate('/activites/new'),
            variant: 'primary' as const
          }
        ]}
      />

      {/* Filtres */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Rechercher
              </label>
              <div className="relative">
                <Icon name="search" className="absolute text-gray-400 transform -translate-y-1/2 dark:text-gray-500 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Nom, description, lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Année Scolaire Filter */}
            <div>
              <AnneeScolaireFilter
                value={selectedAnneeScolaire}
                onChange={(value) => setSelectedAnneeScolaire(value)}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Type d'Activité
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous les types</option>
                <option value="sport">Sport</option>
                <option value="culturel">Culturel</option>
                <option value="artistique">Artistique</option>
                <option value="scientifique">Scientifique</option>
                <option value="social">Social</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          )}

          {error && (
            <div className="p-4 border border-red-200 rounded-md dark:border-red-800 bg-red-50 dark:bg-red-900/30">
              <div className="flex">
                <div className="flex-shrink-0">
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erreur</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {activites.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune activité trouvée</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Aucune activité ne correspond à votre recherche.' : 'Commencez par créer votre première activité parascolaire.'}
                  </p>
                  <Button onClick={() => navigate('/activites/new')} icon="plus">
                    Créer une activité
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="w-1/4 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Activité</th>
                        <th className="w-20 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Type</th>
                        <th className="w-32 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Responsable</th>
                        <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300 w-28">Dates</th>
                        <th className="w-24 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Inscriptions</th>
                         <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-14 dark:text-gray-300">Statut</th>
                        <th className="w-24 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                      {activites.map((activite) => (
                        <tr key={activite.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="w-1/4 px-3 py-4">
                            <div>
                              <div className="text-xs font-medium text-gray-900 truncate dark:text-white">{activite.nom}</div>
                              <div className="text-xs text-gray-500 truncate dark:text-gray-400">
                                {activite.lieu}
                              </div>
                              {activite.prix > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {activite.prix} MAD
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="w-20 px-3 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(activite.type)}`}>
                              {activite.type_label}
                            </span>
                          </td>
                          <td className="w-32 px-3 py-4 text-xs text-gray-900 dark:text-white">
                            <div className="truncate" title={activite.responsable ? activite.responsable.nom_complet : 'Non assigné'}>
                              {activite.responsable ? activite.responsable.nom_complet : 'Non assigné'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-xs text-gray-900 dark:text-white w-28">
                            <div>
                              <div className="text-xs">{new Date(activite.date_debut).toLocaleDateString('fr-FR')}</div>
                              {activite.date_fin && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  au {new Date(activite.date_fin).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                              {activite.heure_debut && activite.heure_fin && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {activite.heure_debut} - {activite.heure_fin}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="w-24 px-3 py-4 text-xs text-gray-900 dark:text-white">
                            <div>
                              <div className="text-xs">{activite.eleves_count} / {activite.capacite}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {activite.places_disponibles} libres
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 w-14">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(activite)}`}>
                              {getStatusText(activite)}
                            </span>
                          </td>
                          <td className="w-24 px-3 py-4 text-sm font-medium">
                            <div className="inline-flex items-center gap-1">
                              <button
                                className="p-1.5 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                title="Voir"
                                aria-label="Voir"
                                onClick={() => navigate(`/activites/${activite.id}`)}
                              >
                                <Icon name="eye" size="sm" />
                              </button>
                              <button
                                className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                                title="Modifier"
                                aria-label="Modifier"
                                onClick={() => navigate(`/activites/${activite.id}/edit`)}
                              >
                                <Icon name="edit" size="sm" />
                              </button>
                              <button
                                className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Supprimer"
                                aria-label="Supprimer"
                                onClick={() => requestDelete(activite.id, activite.nom)}
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
              )}

              {(() => {
                const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
                const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
                const end = Math.min(totalItems, currentPage * pageSize);
                
                if (totalItems === 0) return null;
                
                return (
                  <div className="flex items-center justify-between px-4 pb-4 mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Affichage {start}-{end} sur {totalItems}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <button 
                        className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                        disabled={currentPage <= 1}
                      >
                        Précédent
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button 
                        className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
                        disabled={currentPage >= totalPages}
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Supprimer l'activité"
        message={`Êtes-vous sûr de vouloir supprimer l'activité "${confirmState.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  )
}

export default ActivitesIndex