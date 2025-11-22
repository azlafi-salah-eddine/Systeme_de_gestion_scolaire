import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHead from '../../components/ui/PageHead'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/Icon'
import { timetableService, type TimetableItem } from '../../services/timetableService'
import { classeService, type Classe } from '../../services/classeService'
import { exportTimetable } from '../../utils/exportUtils'
import niveauService, { type NiveauItem } from '../../services/niveauService'
import { useNotification } from '../../contexts/NotificationContext'
import ConfirmationModal from '../../components/ui/ConfirmationModal'
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext'
import { useAuth } from '../../contexts/AuthContext'
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter'

const jours: TimetableItem['jour'][] = ['lundi','mardi','mercredi','jeudi','vendredi','samedi']
const heures = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00']
const formatTime = (t: string) => t.substring(0,5)
const getNextHour = (h: string) => {
  const i = heures.indexOf(h)
  return i < heures.length - 1 ? heures[i+1] : '17:00'
}
const toMinutes = (t: string) => {
  const [h,m] = (t || '0:0').split(':').map(n => parseInt(n || '0',10))
  return (isNaN(h)?0:h)*60 + (isNaN(m)?0:m)
}

const EmploisDuTempsIndex: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const { anneeActive } = useAnneeScolaire()
  const { user } = useAuth()
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin'
  const [classes, setClasses] = useState<Classe[]>([])
  const [timetables, setTimetables] = useState<Record<number, TimetableItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ jour?: TimetableItem['jour']; search?: string; niveau?: string }>({})
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined)
  const [exporting, setExporting] = useState(false)
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; label: string }>({ isOpen: false, id: null, label: '' })
  const [exportingIndividual, setExportingIndividual] = useState<{ [key: string]: boolean }>({})

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
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load all classes with annee_scolaire_id filter
        const classesRes = await classeService.index({ 
          per_page: 100,
          annee_scolaire_id: selectedAnneeScolaire
        })
        const classesList = classesRes.data || []
        setClasses(classesList)

        // Load timetables for each class with annee_scolaire_id filter
        const timetablePromises = classesList.map(async (classe) => {
          try {
            const res = await timetableService.byClasse(classe.id, {
              annee_scolaire_id: selectedAnneeScolaire
            })
            return { classeId: classe.id, items: res.data || [] }
          } catch {
            return { classeId: classe.id, items: [] }
          }
        })

        const timetableResults = await Promise.all(timetablePromises)
        const timetableMap: Record<number, TimetableItem[]> = {}
        timetableResults.forEach(({ classeId, items }) => {
          timetableMap[classeId] = items
        })
        setTimetables(timetableMap)

      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    if (selectedAnneeScolaire) {
      run()
    }
  }, [selectedAnneeScolaire])

  const refreshTimetables = async () => {
    try {
      const classesRes = await classeService.index({ 
        per_page: 100,
        annee_scolaire_id: selectedAnneeScolaire
      })
      const classesList = classesRes.data || []
      setClasses(classesList)
      const timetablePromises = classesList.map(async (classe) => {
        try {
          const res = await timetableService.byClasse(classe.id, {
            annee_scolaire_id: selectedAnneeScolaire
          })
          return { classeId: classe.id, items: res.data || [] }
        } catch {
          return { classeId: classe.id, items: [] }
        }
      })
      const timetableResults = await Promise.all(timetablePromises)
      const timetableMap: Record<number, TimetableItem[]> = {}
      timetableResults.forEach(({ classeId, items }) => { timetableMap[classeId] = items })
      setTimetables(timetableMap)
    } catch {}
  }

  useEffect(() => {
    const loadNiveaux = async () => {
      try {
        const data = await niveauService.list()
        setNiveaux(data.filter((n: any) => n.active !== false)); // Filter inactive niveaux
      } catch {
        setNiveaux([])
      }
    }
    loadNiveaux()
  }, [])

  const filteredClasses = useMemo(() => {
    return classes.filter(classe => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const nomComplet = classe.nom_complet?.toLowerCase() || ''
        const nom = classe.nom?.toLowerCase() || ''
        const section = classe.section?.toLowerCase() || ''
        
        if (!nomComplet.includes(searchTerm) && 
            !nom.includes(searchTerm) && 
            !section.includes(searchTerm)) {
          return false
        }
      }
      if (filters.niveau) {
        const niveauNom = typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : classe.niveau;
        if (niveauNom !== filters.niveau) {
          return false
        }
      }
      return true
    })
  }, [classes, filters.search, filters.niveau])

  const requestDelete = (classe: Classe) => {
    setConfirmState({ isOpen: true, id: classe.id, label: classe.nom_complet || `${classe.nom} ${classe.section}` })
  }

  const confirmDelete = async () => {
    if (!confirmState.id) return
    try {
      await timetableService.removeByClasse(confirmState.id)
      await refreshTimetables()
      showSuccess('Emploi du temps supprimé', 'L\'emploi du temps a été supprimé avec succès.')
    } catch (e: any) {
      const message = e?.message || 'Erreur lors de la suppression'
      showError('Échec de suppression', message)
    } finally {
      setConfirmState({ isOpen: false, id: null, label: '' })
    }
  }

  const getClassTimetable = (classeId: number) => {
    const items = timetables[classeId] || []
    if (!filters.jour) return items
    
    return items.filter(item => item.jour === filters.jour)
  }

  const getGroupedTimetable = (items: TimetableItem[]) => {
    const g: Record<string, TimetableItem[]> = {}
    for (const j of jours) g[j] = []
    items.forEach(it => {
      if (!g[it.jour]) g[it.jour] = []
      g[it.jour].push(it)
    })
    Object.values(g).forEach(arr => arr.sort((a,b) => a.heure_debut.localeCompare(b.heure_debut)))
    return g
  }

  const handleExportAllPDF = async () => {
    try {
      setExporting(true);
      await exportTimetable('all-timetables-content', { 
        filename: 'tous-les-emplois-du-temps', 
        format: 'pdf' 
      });
    } catch (error) {
      setError('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllImage = async () => {
    try {
      setExporting(true);
      await exportTimetable('all-timetables-content', { 
        filename: 'tous-les-emplois-du-temps', 
        format: 'jpg' 
      });
    } catch (error) {
      setError('Erreur lors de l\'export image');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintAll = () => {
    try {
      exportTimetable('all-timetables-content', { filename: 'tous-les-emplois', format: 'pdf' });
    } catch (error) {
      setError('Erreur lors de l\'impression');
    }
  };

  const handleExportIndividualPDF = async (classe: Classe) => {
    const exportKey = `pdf-${classe.id}`
    try {
      setExportingIndividual(prev => ({ ...prev, [exportKey]: true }))
      const elementId = `timetable-${classe.id}`
      const element = document.getElementById(elementId)
      if (element) {
        await exportTimetable(elementId, { 
          filename: `emploi-${classe.nom}-${new Date().toISOString().split('T')[0]}`, 
          format: 'pdf' 
        })
        showSuccess('Export PDF réussi', `L'emploi du temps de ${classe.nom} a été exporté en PDF avec succès.`)
      }
    } catch (error) {
      const message = 'Erreur lors de l\'export PDF'
      showError('Erreur d\'export', message)
    } finally {
      setExportingIndividual(prev => ({ ...prev, [exportKey]: false }))
    }
  }

  const handleExportIndividualImage = async (classe: Classe) => {
    const exportKey = `img-${classe.id}`
    try {
      setExportingIndividual(prev => ({ ...prev, [exportKey]: true }))
      const elementId = `timetable-${classe.id}`
      const element = document.getElementById(elementId)
      if (element) {
        await exportTimetable(elementId, { 
          filename: `emploi-${classe.nom}-${new Date().toISOString().split('T')[0]}`, 
          format: 'jpg' 
        })
        showSuccess('Export Image réussi', `L'emploi du temps de ${classe.nom} a été exporté en image avec succès.`)
      }
    } catch (error) {
      const message = 'Erreur lors de l\'export image'
      showError('Erreur d\'export', message)
    } finally {
      setExportingIndividual(prev => ({ ...prev, [exportKey]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Emplois du temps"
        subtitle="Gestion des emplois du temps par classe"
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Emplois du temps' }]}
      />

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnneeScolaireFilter
              value={selectedAnneeScolaire}
              onChange={(value) => setSelectedAnneeScolaire(value)}
            />
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la classe</label>
              <input 
                type="text" 
                value={filters.search || ''} 
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} 
                placeholder="Rechercher une classe..."
                className="block w-full px-3 py-2 mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Niveau de classe</label>
              <select 
                value={filters.niveau || ''} 
                onChange={e => setFilters(f => ({ ...f, niveau: e.target.value || undefined }))} 
                className="block w-full px-3 py-2 mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map(n => (
                  <option key={n.id} value={n.nom}>{n.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="secondary" onClick={() => {
                setFilters({})
                if (anneeActive) {
                  setSelectedAnneeScolaire(anneeActive.id)
                }
              }} className="w-full">
                <Icon name="refresh" />
                <span className="ml-2">Réinitialiser</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
        </div>
      )}

      {exporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-50">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-b-2 rounded-full animate-spin border-primary-500"></div>
              <span className="text-slate-700 dark:text-gray-300">Export en cours...</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erreur</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <Card>
          <div id="all-timetables-content">
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="calendar" size="lg" className="mx-auto mb-4 text-slate-400 dark:text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">Aucune classe trouvée</h3>
                <p className="mb-4 text-slate-500 dark:text-gray-400">Créez une nouvelle classe pour commencer à gérer les emplois du temps.</p>
                <Button variant="primary" onClick={() => navigate('/classes/new')}>
                  <Icon name="plus" />
                  <span className="ml-2">Nouvelle classe</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
                  <thead className="bg-slate-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Nom de classe</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Niveau</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Section</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Séances</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-gray-700">
                    {(() => {
                      const total = filteredClasses.length
                      const totalPages = Math.max(1, Math.ceil(total / pageSize))
                      const safePage = Math.min(currentPage, totalPages)
                      const start = (safePage - 1) * pageSize
                      const end = start + pageSize
                      const pageItems = filteredClasses.slice(start, end)
                      return pageItems.map(classe => {
                      const classItems = getClassTimetable(classe.id)
                      const totalSessions = classItems.length

                      return (
                        <tr key={classe.id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{classe.nom_complet || classe.nom} {classe.nombre_eleves} / {classe.capacite} élèves</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              {typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : String(classe.niveau || '')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-500 dark:text-gray-400">
                            {classe.section}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Icon name="calendar" size="sm" className="mr-2 text-slate-400 dark:text-gray-500" />
                              <span className="text-sm text-slate-900 dark:text-white">{totalSessions}</span>
                              <span className="ml-1 text-sm text-slate-500 dark:text-gray-400">séance{totalSessions > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {totalSessions === 0 ? (
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => navigate(`/classes/${classe.id}/emplois-du-temps/new`)}
                                >
                                  <Icon name="calendar" />
                                  <span className="ml-1">Créer un emploi du temps</span>
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => navigate(`/classes/${classe.id}/emplois-du-temps`)}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" 
                                    title="Voir"
                                  >
                                    <Icon name="eye" size="sm" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/classes/${classe.id}/emplois-du-temps/new`)}
                                    className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" 
                                    title="Modifier"
                                  >
                                    <Icon name="edit" size="sm" />
                                  </button>
                                  
                                  <button 
                                    onClick={() => handleExportIndividualPDF(classe)}
                                    disabled={exportingIndividual[`pdf-${classe.id}`]}
                                    className={`p-1.5 rounded-full transition-colors ${exportingIndividual[`pdf-${classe.id}`] ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                                    title={exportingIndividual[`pdf-${classe.id}`] ? "Export en cours..." : "Exporter PDF"}
                                  >
                                    {exportingIndividual[`pdf-${classe.id}`] ? (
                                      <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Icon name="file-pdf" size="sm" />
                                    )}
                                  </button>
                                  <button 
                                    onClick={() => handleExportIndividualImage(classe)}
                                    disabled={exportingIndividual[`img-${classe.id}`]}
                                    className={`p-1.5 rounded-full transition-colors ${exportingIndividual[`img-${classe.id}`] ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
                                    title={exportingIndividual[`img-${classe.id}`] ? "Export en cours..." : "Exporter Image"}
                                  >
                                    {exportingIndividual[`img-${classe.id}`] ? (
                                      <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Icon name="image" size="sm" />
                                    )}
                                  </button>
                                  <button 
                                    onClick={() => requestDelete(classe)}
                                    className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" 
                                    title="Supprimer"
                                  >
                                    <Icon name="trash" size="sm" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                    })()}
                  </tbody>
                </table>
                {(() => {
                  const total = filteredClasses.length
                  const totalPages = Math.max(1, Math.ceil(total / pageSize))
                  const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1
                  const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize)
                  return (
                      <div className="flex items-center justify-between px-4 pb-4 mt-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
                      <div className="inline-flex items-center gap-2">
                        <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Précédent</button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Page {Math.min(currentPage, totalPages)} / {totalPages}</span>
                        <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</button>
                      </div>
                    </div>
                  )
                })()}
                
                {/* Hidden timetable content for individual exports */}
                {filteredClasses.map(classe => {
                  const classItems = getClassTimetable(classe.id)
                  const grouped = getGroupedTimetable(classItems)
                  const totalSessions = classItems.length

                  const getSessionAtSlot = (jour: TimetableItem['jour'], heure: string) => {
                    const list = grouped[jour] || []
                    const slot = toMinutes(heure)
                    return list.find(s => toMinutes(s.heure_debut) <= slot && toMinutes(s.heure_fin) > slot) || null
                  }

                  return (
                    <div key={`timetable-${classe.id}`} id={`timetable-${classe.id}`} style={{ position: 'absolute', left: '-10000px', top: 0, width: '1200px', background: '#ffffff', padding: '16px' }}>
                      <div className="px-4 py-2 text-sm font-semibold text-center text-slate-700">
                        Emploi du temps - {classe.nom_complet || classe.nom}
                      </div>
                      <div className="overflow-hidden border border-gray-300 rounded-lg">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="w-16 p-3 text-sm font-semibold text-center text-gray-700 bg-gray-100 border-r border-gray-300">Heure</th>
                              {jours.map(j => (
                                <th key={j} className="p-3 text-sm font-semibold text-center text-gray-700 capitalize bg-gray-100 border-r border-gray-300 last:border-r-0">{j}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {heures.map(heure => (
                              <tr key={heure} className="hover:bg-gray-50">
                                <td className="w-16 p-3 text-sm font-medium text-center text-gray-700 border-t border-r border-gray-300 bg-gray-50">
                                  <div className="flex items-center justify-center h-8">
                                    <span className="text-sm font-semibold">{formatTime(heure)} - {formatTime(getNextHour(heure))}</span>
                                  </div>
                                </td>
                                {jours.map(jour => {
                                  const session = getSessionAtSlot(jour, heure)
                                  return (
                                    <td key={`${jour}-${heure}`} className={`relative p-2 border-r border-gray-300 border-t border-gray-300 last:border-r-0 h-16 w-24 text-center align-middle ${session ? 'text-white font-medium text-xs' : 'bg-white'}`} style={session ? { backgroundColor: session.matiere_couleur || '#f97316' } : {}}>
                                      {session ? (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-center">
                                          <div className="mb-1 text-[10px] font-semibold flex items-center justify-center gap-1">
                                            <Icon name="map-pin" size="sm" />
                                            <span className="truncate max-w-[90px]">
                                              {session.salle_nom && session.salle_active !== false 
                                                ? session.salle_nom 
                                                : (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    Supprimé
                                                  </span>
                                                )}
                                            </span>
                                          </div>
                                          <div className="mb-1 text-[10px] font-semibold break-all max-w-[110px] mx-auto leading-tight">
                                            {session.matiere_nom && session.matiere_active !== false 
                                              ? session.matiere_nom 
                                              : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                  Élément supprimé
                                                </span>
                                              )}
                                          </div>
                                          <div className="flex items-center justify-center text-[10px] truncate opacity-90">
                                            <Icon name="user" size="sm" className="mr-1" />
                                            <span className="truncate">
                                              {session.professeur_nom && session.professeur_active !== false 
                                                ? session.professeur_nom 
                                                : (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    Supprimé
                                                  </span>
                                                )}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center h-full">
                                          <span className="text-xs text-gray-400">-</span>
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      )}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, label: '' })}
        onConfirm={confirmDelete}
        title="Supprimer l'emploi du temps"
        message={`Êtes-vous sûr de vouloir supprimer l'emploi du temps de "${confirmState.label}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  )
}

export default EmploisDuTempsIndex

