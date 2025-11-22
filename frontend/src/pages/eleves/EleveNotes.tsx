import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import type { Note } from '../../services/notesService';
import notesService from '../../services/notesService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import periodService, { type Periode } from '../../services/periodService';
import niveauService from '../../services/niveauService';

interface Controle {
  id: number;
  libelle: string;
  debut_controle?: string;
  fin_controle?: string;
  matiere_id?: number;
  instructions?: string;
  active: boolean;
  professeur_id?: number;
  matiere?: {
    id: number;
    nom: string;
  };
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

interface Matiere {
  id: number;
  nom: string;
  code?: string;
  niveau_id?: number;
  controles: Controle[];
}

interface Eleve {
  id: number;
  nom?: string;
  prenom?: string;
  nom_fr?: string;
  prenom_fr?: string;
  classe?: {
    id: number;
    nom: string;
    niveau?: {
      id: number;
      nom: string;
      bareme?: number;
    };
  };
}

const EleveNotes: React.FC = () => {
  const { eleveId } = useParams<{ eleveId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();
  const { user, isEleve } = useAuth();
  const isEleveUser = isEleve();
  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<Periode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [bareme, setBareme] = useState<number>(20);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedControle, setSelectedControle] = useState<Controle | null>(null);
  const [noteForm, setNoteForm] = useState({
    note: '',
    coefficient: '',
    type_evaluation: '',
    commentaire: ''
  });

  useEffect(() => {
    if (eleveId) {
      void loadEleve();
      void loadNotes();
      void loadPeriodes();
    }
  }, [eleveId, anneeActive]);

  // Load bareme when eleve is loaded
  useEffect(() => {
    if (eleve?.classe?.niveau?.id) {
      loadBareme(eleve.classe.niveau.id);
    }
  }, [eleve]);

  // Reload notes and matieres when period changes
  useEffect(() => {
    if (selectedPeriode) {
      void loadNotes();
      if (eleve) {
        void loadMatieres();
      }
    }
  }, [selectedPeriode]);

  // Charger les matières après que l'élève soit chargé
  useEffect(() => {
    if (eleve) {
      void loadMatieres();
    }
  }, [eleve, selectedPeriode, anneeActive]);

  const loadEleve = async () => {
    try {
      const response = await api.get(`/v1/eleves/${eleveId}?with=classe`);
      const eleveData = response.data?.eleve || response.data?.data || response.data;
      setEleve(eleveData);
      
      // Si c'est un élève, vérifier qu'il accède uniquement à ses propres notes
      // Faire la vérification après avoir chargé l'élève pour avoir l'ID
      if (isEleveUser && eleveData && eleveData.id) {
        // Récupérer l'eleve_id depuis le user si disponible, sinon depuis l'élève chargé
        const currentEleveId = user?.eleve_id || eleveData.id;
        if (parseInt(eleveId || '0') !== currentEleveId) {
          setError('Vous n\'avez pas accès à ces notes');
          navigate('/eleves/' + currentEleveId + '/notes');
          return;
        }
      }
    } catch (error: any) {
      // Si erreur 403, c'est que l'élève essaie d'accéder aux notes d'un autre
      if (error.response?.status === 403) {
        setError('Vous n\'avez pas accès à ces notes');
        if (user?.eleve_id) {
          navigate('/eleves/' + user.eleve_id + '/notes');
        }
      } else {
        setError('Impossible de charger les informations de l\'élève');
        console.error('Error loading eleve:', error);
      }
    }
  };

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);
      const filters: any = {
        eleve_id: eleveId,
        per_page: 1000
      };
      
      // Filter by active academic year if available
      if (anneeActive) {
        filters.annee_scolaire_id = anneeActive.id;
      }
      
      // Filter by selected period if available
      if (selectedPeriode) {
        filters.periode_id = selectedPeriode.id;
      }
      
      const response = await notesService.getNotes(filters);
      const notesData = (response as any)?.data || response;
      setNotes(Array.isArray(notesData) ? (notesData as Note[]) : []);
    } catch (error: any) {
      setError('Impossible de charger les notes');
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadPeriodes = async () => {
    try {
      if (anneeActive) {
        const response = await periodService.getPeriodesByAnneeScolaire(anneeActive.id);
        
        if (response.success) {
          setPeriodes(response.data || []);
          // Set the first period as selected by default
          if (response.data && response.data.length > 0) {
            setSelectedPeriode(response.data[0]);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading periodes:', error);
    }
  };

  const loadMatieres = async () => {
    try {
      setLoadingMatieres(true);
      // Vérifier que l'élève est chargé et a une classe
      if (!eleve || !eleve.classe) {
        setMatieres([]);
        return;
      }

      // Charger les matières de la classe directement via l'API
      const matieresResponse = await api.get(`/v1/classes/${eleve.classe.id}/matieres`);
      const matieresData = matieresResponse.data?.data || [];
      
      // Charger les contrôles (l'API filtre déjà par classe pour les élèves)
      const params: any = { active: true };
      if (anneeActive) {
        params.annee_scolaire_id = anneeActive.id;
      }
      // Filtrer par période si sélectionnée
      if (selectedPeriode) {
        params.periode_id = selectedPeriode.id;
      }
      const controlesResponse = await api.get('/v1/controles', { params });
      const controles = controlesResponse.data?.data || [];
      
      // Ajouter les contrôles à chaque matière
      const matieresWithControles = matieresData.map((matiere: any) => {
        const controlesOfMatiere = controles.filter((controle: Controle) => controle.matiere_id === matiere.id);
        
        return {
          ...matiere,
          controles: controlesOfMatiere
        };
      });
      
      // Filtrer pour ne garder que les matières qui ont des contrôles
      // (pour éviter d'afficher des matières vides)
      const matieresAvecControles = matieresWithControles.filter((matiere: any) => {
        return matiere.controles.length > 0;
      });
      
      setMatieres(matieresAvecControles);
    } catch (error: any) {
      console.error('Error loading matieres:', error);
    } finally {
      setLoadingMatieres(false);
    }
  };

  const getEleveName = (eleve: Eleve) => {
    const prenom = eleve.prenom_fr || eleve.prenom || '';
    const nom = eleve.nom_fr || eleve.nom || '';
    const fullName = `${prenom} ${nom}`.trim();
    return fullName || 'Élève sans nom';
  };

  const getClasseName = (eleve: Eleve) => {
    return `Classe : ${eleve.classe?.nom || 'Non définie'}`;
  };

  const loadBareme = async (niveauId: number) => {
    try {
      const response = await niveauService.getNiveau(niveauId);
      if (response.data?.bareme !== undefined) {
        const baremeValue = typeof response.data.bareme === 'number'
          ? response.data.bareme
          : parseFloat(String(response.data.bareme || 20));
        setBareme(baremeValue);
      }
    } catch (error) {
      console.error('Error loading bareme:', error);
      setBareme(20); // Default value
    }
  };

  // Format bareme to remove unnecessary .00
  const formatBareme = (value: number): string => {
    const rounded = Math.round(value * 100) / 100;
    if (Math.abs(rounded % 1) < 0.001) {
      return Math.round(rounded).toString();
    }
    return parseFloat(rounded.toFixed(2)).toString();
  };





  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedControle || !noteForm.note) return;

    try {
      const noteData = {
        eleve_id: parseInt(eleveId!),
        controle_id: selectedControle.id,
        matiere_id: selectedControle.matiere_id || 1, // Use control's matiere_id
        professeur_id: selectedControle.professeur_id || 1, // Use control's professor or default
        note: parseFloat(noteForm.note),
        bareme: 20.0, // Barème par défaut
        periode_id: selectedPeriode?.id || 1, // Use selected period
        annee_scolaire_id: anneeActive?.id || 1, // Use active academic year
      };

      const response = await notesService.createNote(noteData);
      
      if (response.success) {
        showSuccess('Succès', 'Note ajoutée avec succès');
        setShowNoteForm(false);
        setSelectedControle(null);
        setNoteForm({ note: '', coefficient: '', type_evaluation: '', commentaire: '' });
        void loadNotes();
      } else {
        showError('Erreur', response.message || 'Erreur lors de l\'ajout de la note');
      }
    } catch (error: any) {
      showError('Erreur', error.response?.data?.message || 'Erreur lors de l\'ajout de la note');
    }
  };


  if (error) {
    return (
      <div className="space-y-6">
        <PageHead
          title="Erreur"
          subtitle="Impossible de charger les données"
        />
        <Card>
          <div className="p-6 text-center">
            <Icon name="error" size="lg" className="mx-auto mb-4 text-red-500 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button
              onClick={() => navigate('/notes')}
              className="mt-4"
            >
              Retour aux notes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={eleve ? `Notes de ${getEleveName(eleve)}` : 'Chargement...'}
        subtitle={eleve ? `${getClasseName(eleve)}${anneeActive ? ` • Année scolaire: ${anneeActive.nom}` : ''}` : ''}
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Notes', link: '/notes' },
          { label: eleve ? getEleveName(eleve) : 'Élève', link: '#' }
        ]}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Période :
            </span>
            {periodes.length > 0 ? (
              <select
                value={selectedPeriode?.id || ''}
                onChange={(e) => {
                  const periodeId = parseInt(e.target.value);
                  const periode = periodes.find(p => p.id === periodeId);
                  if (periode) {
                    setSelectedPeriode(periode);
                    void loadNotes();
                  }
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500 min-w-[150px]"
              >
                <option value="">Sélectionner</option>
                {periodes.map((periode) => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom}
                  </option>
                ))}
              </select>
            ) : anneeActive ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
            ) : (
              <span className="text-sm text-red-500 dark:text-red-400">Aucune année active</span>
            )}
          </div>
          {selectedPeriode && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(selectedPeriode.date_debut).toLocaleDateString('fr-FR')} - {new Date(selectedPeriode.date_fin).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </PageHead>



     


     

      {/* Tableau des matières avec notes */}
      {loadingNotes || loadingMatieres ? (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-primary-500"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loadingNotes ? 'Chargement des notes...' : 'Chargement des matières...'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : matieres.length > 0 ? (
        <div className="space-y-6">
          {matieres.map((matiere) => {
            const matiereNotes = notes.filter(note => 
              matiere.controles.some(controle => controle.id === note.controle_id)
            );
            
            // Calculer moyenne avec le barème correct
            const notesAvecBareme = matiereNotes.map(note => {
              const noteBareme = note.bareme || bareme;
              const noteValue = Number(note.note);
              return (noteValue / noteBareme) * bareme;
            });
            
            const moyenneValue = notesAvecBareme.length > 0 
              ? notesAvecBareme.reduce((sum, note) => sum + note, 0) / notesAvecBareme.length
              : 0;
            
            const moyenne = notesAvecBareme.length > 0 
              ? parseFloat(moyenneValue.toFixed(2)).toString()
              : '—';

            return (
              <Card key={matiere.id}>
                <div className="p-6">
                  {/* En-tête de la matière */}
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                        <Icon name="book" className="text-white" size="lg" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {matiere.nom}
                        </h3>
                        {matiere.code && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Code: {matiere.code}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Moyenne
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {moyenne}
                        </span>
                        <span className="ml-1 text-lg text-gray-500 dark:text-gray-400">
                          /{formatBareme(bareme)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tableau des notes */}
                  {matiere.controles.length > 0 ? (
                    <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase dark:text-gray-300">
                              Contrôle
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-700 uppercase dark:text-gray-300">
                              Date
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-700 uppercase dark:text-gray-300">
                              Note
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-700 uppercase dark:text-gray-300">
                              Appréciation
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                          {matiere.controles.map((controle) => {
                            const note = matiereNotes.find(n => n.controle_id === controle.id);
                            const noteBareme = note?.bareme || bareme;
                            const noteValue = note ? Number(note.note) : 0;
                            const percentage = note ? (noteValue / noteBareme) * 100 : 0;
                            
                            const getAppreciation = () => {
                              if (!note) return { text: '—', color: 'text-gray-400' };
                              if (percentage >= 90) return { text: 'Excellent', color: 'text-green-600 dark:text-green-400' };
                              if (percentage >= 80) return { text: 'Très bien', color: 'text-green-600 dark:text-green-400' };
                              if (percentage >= 70) return { text: 'Bien', color: 'text-blue-600 dark:text-blue-400' };
                              if (percentage >= 60) return { text: 'Assez bien', color: 'text-yellow-600 dark:text-yellow-400' };
                              if (percentage >= 50) return { text: 'Passable', color: 'text-orange-600 dark:text-orange-400' };
                              return { text: 'Insuffisant', color: 'text-red-600 dark:text-red-400' };
                            };

                            const getNoteColor = () => {
                              if (!note) return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
                              if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
                              if (percentage >= 60) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
                              if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
                              return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
                            };

                            const appreciation = getAppreciation();
                            
                            return (
                              <tr key={controle.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4">
                                  <div className="flex items-start">
                                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 mr-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                      <Icon name="file-text" className="text-gray-600 dark:text-gray-300" size="sm" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {controle.libelle}
                                      </div>
                                      {controle.instructions && (
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                          {controle.instructions}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                  {controle.debut_controle && (
                                    <div className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-300">
                                      <Icon name="calendar" size="sm" className="mr-1.5" />
                                      {new Date(controle.debut_controle).toLocaleDateString('fr-FR', { 
                                        day: 'numeric', 
                                        month: 'short'
                                      })}
                                    </div>
                                  )}
                                </td>
                                
                                <td className="px-6 py-4">
                                  <div className="flex justify-center">
                                    {note ? (
                                      <div className={`inline-flex items-center px-4 py-2 text-base font-bold border-2 rounded-lg ${getNoteColor()}`}>
                                        <span className="text-lg">{parseFloat(Number(note.note).toFixed(2))}</span>
                                        <span className="mx-1 text-sm opacity-75">/</span>
                                        <span className="text-sm">{formatBareme(noteBareme)}</span>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center px-4 py-2 text-sm italic text-gray-400 bg-gray-100 rounded-lg dark:text-gray-500 dark:bg-gray-800">
                                        <Icon name="minus" size="sm" className="mr-1.5" />
                                        Non évalué
                                      </span>
                                    )}
                                  </div>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center text-sm font-semibold ${appreciation.color}`}>
                                    {note && percentage >= 80 && <Icon name="star" size="sm" className="mr-1.5" />}
                                    {appreciation.text}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
                        <Icon name="file-text" size="lg" className="text-gray-400 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Aucun contrôle disponible
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Aucun devoir n'a été programmé pour cette matière
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
              <Icon name="book" size="lg" className="text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Aucune matière disponible
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune matière avec contrôles n'est disponible pour le moment
            </p>
          </div>
        </Card>
      )}


      {/* Formulaire d'ajout de note - Seulement pour admin/prof */}
      {showNoteForm && selectedControle && !isEleveUser && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ajouter une note
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedControle.libelle} - {selectedControle.matiere?.nom}
                </p>
                        </div>
              <Button variant="outline" onClick={() => setShowNoteForm(false)}>
                <Icon name="times" size="sm" className="mr-2" />
                Annuler
              </Button>
            </div>

            <form onSubmit={handleSubmitNote} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Note *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    value={noteForm.note}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: 15.5"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={noteForm.coefficient}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, coefficient: e.target.value }))}
                    className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: 1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Commentaire
                </label>
                <textarea
                  value={noteForm.commentaire}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, commentaire: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                  placeholder="Commentaire sur la note..."
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                  <Icon name="save" size="sm" className="mr-2" />
                  Enregistrer la note
                </Button>
              </div>
            </form>
          </div>
        </Card>
        )}
    </div>
  );
};

export default EleveNotes;
