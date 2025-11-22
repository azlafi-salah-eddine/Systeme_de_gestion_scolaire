import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHead from '../../components/ui/PageHead'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/Icon'
import { classeService, type Classe } from '../../services/classeService'
import { salleService, type Salle } from '../../services/salleService'
import { professeurService, type Professeur } from '../../services/professeurService'
import matiereService from '../../services/matiereService'
import { timetableService, type TimetableItem } from '../../services/timetableService'
import { useNotification } from '../../contexts/NotificationContext'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

const jours: TimetableItem['jour'][] = ['lundi','mardi','mercredi','jeudi','vendredi','samedi']
const heures = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
]
  const toMinutes = (t: string): number => {
    if (!t) return 0
    const [h, m] = t.split(':').map(n => parseInt(n || '0', 10))
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
  }


interface Matiere { id: number; nom: string; couleur?: string }

interface SessionForm {
  jour: TimetableItem['jour']
  heure_debut: string
  heure_fin: string
  salle_id: number | null
  professeur_id: number | null
  matiere_id: number | null
}

const EmploisDuTempsNew: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  
  const [classe, setClasse] = useState<Classe | null>(null)
  const [salles, setSalles] = useState<Salle[]>([])
  const [professeurs, setProfesseurs] = useState<Professeur[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [sessions, setSessions] = useState<TimetableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [selectedSlot, setSelectedSlot] = useState<{jour: TimetableItem['jour'], heure: string} | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<SessionForm>({
    jour: 'lundi',
    heure_debut: '',
    heure_fin: '',
    salle_id: null,
    professeur_id: null,
    matiere_id: null
  })
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; sessionId: number | null; message: string; type: 'slot' | 'id' }>({ isOpen: false, sessionId: null, message: '', type: 'slot' })



  const loadMatieresByNiveau = async (niveauId: number) => {
    try {
      const matieresRes = await matiereService.listMatieres({ per_page: 100 })
      const allMatieres = (matieresRes as any).data || matieresRes || []
      // Filtrer les matières par niveau
      const matieresFiltered = allMatieres.filter((m: any) => 
        m.active !== false && m.niveau_id === niveauId
      )
      setMatieres(matieresFiltered as Matiere[])
    } catch (e) {
      console.error('Erreur lors du chargement des matières:', e)
      setMatieres([])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load class data first
        if (id) {
          const classeRes = await classeService.show(parseInt(id))
          const classeData = classeRes.data
          setClasse(classeData)
          
          // Load matières for this class's niveau
          if (classeData?.niveau_id) {
            await loadMatieresByNiveau(classeData.niveau_id)
          }
        }
        
        // Load other reference data
        try {
          const [sallesRes, professeursRes] = await Promise.all([
            salleService.list().catch(() => ({ success: true, data: [] })),
            professeurService.listForTimetable().catch(() => ({ success: true, data: [] }))
          ])
          
          setSalles((sallesRes as any).data || [])
          setProfesseurs((professeursRes as any).data || [])
        } catch (e) {
          setSalles([])
          setProfesseurs([])
        }
        
        // Load existing sessions
        if (id) {
          try {
            const sessionsRes = await timetableService.byClasse(parseInt(id))
            setSessions(sessionsRes.data || [])
          } catch {
            setSessions([])
          }
        }
        
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id])

  const handleSlotClick = (jour: TimetableItem['jour'], heure: string) => {
    // Check if slot is already occupied
    const slotMin = toMinutes(heure)
    const existingSession = sessions.find(s => {
      if (!s) return false
      return s.jour === jour && toMinutes(s.heure_debut) <= slotMin && toMinutes(s.heure_fin) > slotMin
    })
    
    if (existingSession) {
      // Edit existing session
      setFormData({
        jour: existingSession.jour,
        heure_debut: existingSession.heure_debut,
        heure_fin: existingSession.heure_fin,
        salle_id: existingSession.salle_id,
        professeur_id: existingSession.professeur_id,
        matiere_id: existingSession.matiere_id,
      })
      setEditingSessionId(existingSession.id)
    } else {
      // Create new session
      setFormData({
        jour,
        heure_debut: heure,
        heure_fin: getNextHour(heure),
        salle_id: null,
        professeur_id: null,
        matiere_id: null,
      })
      setEditingSessionId(null)
    }
    
    setSelectedSlot({ jour, heure })
    setShowForm(true)
  }

  const getNextHour = (heure: string): string => {
    const index = heures.indexOf(heure)
    return index < heures.length - 1 ? heures[index + 1] : '17:00'
  }

  const formatTime = (time: string): string => {
    const hour = time.split(':')[0]
    return `${hour}⁰⁰`
  }

  const handleSaveSession = async () => {
    if (!id || !formData.salle_id || !formData.professeur_id || !formData.matiere_id) {
      showError('Champs manquants', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setSaving(true)
      
      const sessionData = {
        classe_id: parseInt(id),
        jour: formData.jour,
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        salle_id: formData.salle_id,
        professeur_id: formData.professeur_id,
        matiere_id: formData.matiere_id,
      }

      if (editingSessionId) {
        // Update existing session by id
        await timetableService.update(editingSessionId, sessionData)
        setSessions(sessions.map(s => 
          s.id === editingSessionId 
            ? { ...s, ...sessionData }
            : s
        ))
        showSuccess('Séance mise à jour', 'La séance a été mise à jour avec succès.')
      } else {
        // Create new session
        const newSession = await timetableService.create(sessionData)
        setSessions([...sessions, newSession.data])
        showSuccess('Séance créée', 'La séance a été créée avec succès.')
      }

      setShowForm(false)
      setSelectedSlot(null)
      setEditingSessionId(null)
      
    } catch (e: any) {
      const message = e?.message || 'Erreur lors de la sauvegarde'
      showError('Erreur', message)
    } finally {
      setSaving(false)
    }
  }

  const requestDeleteSession = () => {
    if (!selectedSlot) return
    
    const slotMin = toMinutes(selectedSlot.heure)
    const existingSession = sessions.find(s => 
      s.jour === selectedSlot.jour && 
      toMinutes(s.heure_debut) <= slotMin && 
      toMinutes(s.heure_fin) > slotMin
    )

    if (existingSession) {
      setConfirmState({ 
        isOpen: true, 
        sessionId: existingSession.id, 
        message: 'Êtes-vous sûr de vouloir supprimer cette séance ?',
        type: 'slot'
      })
    }
  }

  const confirmDeleteSession = async () => {
    if (!confirmState.sessionId) return
    
    try {
      await timetableService.remove(confirmState.sessionId)
      setSessions(sessions.filter(s => s.id !== confirmState.sessionId))
      setShowForm(false)
      setSelectedSlot(null)
      setEditingSessionId(null)
      showSuccess('Séance supprimée', 'La séance a été supprimée avec succès.')
    } catch (e: any) {
      const message = e?.message || 'Erreur lors de la suppression'
      showError('Erreur', message)
    } finally {
      setConfirmState({ isOpen: false, sessionId: null, message: '', type: 'slot' })
    }
  }

  const requestDeleteSessionById = (sessionId: number) => {
    if (!sessionId) return
    setConfirmState({ 
      isOpen: true, 
      sessionId: sessionId, 
      message: 'Supprimer cette séance ?',
      type: 'id'
    })
  }

  const confirmDeleteSessionById = async () => {
    if (!confirmState.sessionId) return
    
    try {
      await timetableService.remove(confirmState.sessionId)
      setSessions(sessions.filter(s => s.id !== confirmState.sessionId))
      showSuccess('Séance supprimée', 'La séance a été supprimée avec succès.')
    } catch (e: any) {
      const message = e?.message || 'Erreur lors de la suppression'
      showError('Erreur', message)
    } finally {
      setConfirmState({ isOpen: false, sessionId: null, message: '', type: 'slot' })
    }
  }

  const getSessionAtSlot = (jour: TimetableItem['jour'], heure: string) => {
    if (!sessions || !Array.isArray(sessions)) return null
    const slotMin = toMinutes(heure)
    return sessions.find(s => s && s.jour === jour && toMinutes(s.heure_debut) <= slotMin && toMinutes(s.heure_fin) > slotMin) || null
  }

  const isSlotSelected = (jour: TimetableItem['jour'], heure: string) => {
    return selectedSlot?.jour === jour && selectedSlot?.heure === heure
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <Icon name="error" size="lg" className="mx-auto mb-4 text-red-500 dark:text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button variant="primary" onClick={() => navigate('/emplois-du-temps')} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Nouvel emploi du temps"
        subtitle={`Création d'emploi du temps pour ${classe?.nom_complet || classe?.nom}`}
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Emplois du temps', link: '/emplois-du-temps' },
          { label: classe?.nom_complet || classe?.nom || 'Nouveau', link: '' }
        ]}
        actions={[
          { label: 'Valider', onClick: () => navigate('/emplois-du-temps'), variant: 'primary' }
        ]}
      />

      <Card>
        <div className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Timetable Grid */}
              <div className="overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-16 p-3 text-sm font-semibold text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700">
                        Heure
                      </th>
                      {jours.map(jour => (
                        <th key={jour} className="p-3 text-sm font-semibold text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 last:border-r-0">
                          {jour.charAt(0).toUpperCase() + jour.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heures.map(heure => (
                      <tr key={heure} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="w-16 p-3 text-sm font-medium text-center text-gray-700 dark:text-gray-300 border-t border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                          <div className="flex items-center justify-center h-8">
                            <span className="text-sm font-semibold">{heure.substring(0,5)} - {getNextHour(heure).substring(0,5)}</span>
                          </div>
                        </td>
                        {jours.map(jour => {
                          const session = getSessionAtSlot(jour, heure)
                          const isSelected = isSlotSelected(jour, heure)
                          
                          return (
                            <td
                              key={`${jour}-${heure}`}
                              className={`
                                relative p-2 border-r border-gray-300 dark:border-gray-700 border-t border-gray-300 dark:border-gray-700 last:border-r-0 cursor-pointer h-16 w-24 text-center align-middle
                                ${session 
                                  ? 'text-white font-medium text-[10px]'
                                  : isSelected 
                                    ? 'bg-blue-200 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600' 
                                    : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }
                              `}
                              style={session ? { backgroundColor: session.matiere_couleur || '#f97316' } : {}} // Use matière color or default orange
                              onClick={() => handleSlotClick(jour, heure)}
                            >
                              {session ? (
                                <div className="flex flex-col justify-center h-full text-center">
                                  {/* Room only (hide time for cleaner spacing) */}
                                  <div className="mb-1 text-[9px] font-semibold flex items-center justify-center gap-1">
                                    <Icon name="map-pin" size="sm" />
                                    <span className="truncate max-w-[100px]">
                                      {session.salle_nom && session.salle_active !== false 
                                        ? session.salle_nom 
                                        : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                            Supprimé
                                          </span>
                                        )}
                                    </span>
                                  </div>
                                  {/* Subject in the middle */}
                                  <div className="mb-1 text-[9px] font-semibold break-all max-w-[110px] mx-auto leading-tight">
                                    {session.matiere_nom && session.matiere_active !== false 
                                      ? session.matiere_nom 
                                      : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                          Élément supprimé
                                        </span>
                                      )}
                                  </div>
                                  {/* Professor */}
                                  <div className="flex items-center justify-center text-[9px] truncate opacity-90">
                                     <Icon name="user" size="sm" className="mr-1" />
                                    <span className="truncate">
                                      {session.professeur_nom && session.professeur_active !== false 
                                        ? session.professeur_nom 
                                        : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                            Supprimé
                                          </span>
                                        )}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
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
          </div>
        </div>
      </Card>

      {/* Session Form Overlay */}
      {showForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {editingSessionId ? 'Modifier' : 'Nouvelle'} séance
          </h3>
          <button
            onClick={() => { setShowForm(false); setEditingSessionId(null); }}
            className="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className="p-2 mb-3 text-xs rounded bg-blue-50 dark:bg-blue-900/30">
          <div className="font-medium text-blue-800 dark:text-blue-300">
            {formData.heure_debut} - {formData.heure_fin}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Salle
            </label>
            <select
              value={formData.salle_id || ""}
              onChange={e =>
                setFormData({
                  ...formData,
                  salle_id: parseInt(e.target.value) || null,
                })
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
            >
              <option value="">Sélectionnez salle</option>
              {salles.map(salle => (
                <option key={salle.id} value={salle.id}>
                  {salle.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Professeur
            </label>
            <select
              value={formData.professeur_id || ""}
              onChange={e =>
                setFormData({
                  ...formData,
                  professeur_id: parseInt(e.target.value) || null,
                })
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
            >
              <option value="">Sélectionnez professeur</option>
              {professeurs.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nom} {prof.prenom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Matière
            </label>
            <select
              value={formData.matiere_id || ""}
              onChange={e =>
                setFormData({
                  ...formData,
                  matiere_id: parseInt(e.target.value) || null,
                })
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
            >
              <option value="">Sélectionnez matière</option>
              {matieres.map(matiere => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom}
                </option>
              ))}
            </select>
            {matieres.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Aucune matière disponible pour le niveau de cette classe
              </p>
            )}
            {matieres.length > 0 && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Matières du niveau: {(typeof classe?.niveau === 'object' && classe?.niveau?.nom) ? classe.niveau.nom : 'Niveau non défini'}
              </p>
            )}
          </div>

        </div>

        <div className="flex gap-2 pt-3 mt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="success"
            onClick={handleSaveSession}
            disabled={saving}
            className="flex-1 py-1 text-xs"
          >
            {saving ? "Sauvegarde..." : "Valider"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setShowForm(false); setEditingSessionId(null); }}
            className="flex-1 py-1 text-xs"
          >
            Annuler
          </Button>
          {editingSessionId && (
            <Button
              variant="danger"
              onClick={requestDeleteSession}
              className="flex-1 py-1 text-xs"
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, sessionId: null, message: '', type: 'slot' })}
        onConfirm={confirmState.type === 'slot' ? confirmDeleteSession : confirmDeleteSessionById}
        title="Supprimer la séance"
        message={confirmState.message}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  )
}

export default EmploisDuTempsNew
