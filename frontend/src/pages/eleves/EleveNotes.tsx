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
      setNotes(response.data || []);
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
      <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tableau des matières et notes
              </h3>
            <div className="space-y-6">
              {matieres.map((matiere) => {
                const matiereNotes = notes.filter(note => 
                  matiere.controles.some(controle => controle.id === note.controle_id)
                );
                const moyenne = matiereNotes.length > 0 
                  ? (matiereNotes.reduce((sum, note) => sum + note.note, 0) / matiereNotes.length).toFixed(2)
                  : '—';
    
                return (
                  <div key={matiere.id} className="space-y-4">
                    {/* Titre de la matière - AU-DESSUS du tableau */}
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-100 rounded-full dark:bg-blue-900/30">
                          <Icon name="book" className="text-blue-600 dark:text-blue-400" size="sm" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {matiere.nom}
                          </h3>
                          {matiere.code && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Code: {matiere.code}
                            </p>
                          )}
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-200">
                            Moyenne: {moyenne}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tableau des devoirs pour cette matière */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                              Devoir
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                              Type
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                              Note
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                          {matiere.controles.length > 0 ? (
                            matiere.controles.map((controle) => {
                              const note = matiereNotes.find(n => n.controle_id === controle.id);
                              const percentage = note ? (note.note / note.bareme) * 100 : 0;
                              const getNoteColor = () => {
                                if (percentage >= 80) return 'text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30';
                                if (percentage >= 60) return 'text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30';
                                return 'text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30';
                              };
                              
                              return (
                                <tr key={controle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex items-center justify-center w-8 h-8 mr-3 bg-gray-100 rounded-full dark:bg-gray-800">
                                        <Icon name="file-text" className="text-gray-600 dark:text-gray-400" size="sm" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                          {controle.libelle}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                          {controle.debut_controle && new Date(controle.debut_controle).toLocaleDateString('fr-FR')}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      Devoir
                                    </div>
                                  </td>
                                  
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {note ? (
                                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getNoteColor()}`}>
                                        {note.note}/{note.bareme}
                                      </span>
                                    ) : (
                                      <span className="text-sm italic text-gray-400 dark:text-gray-500">Note non saisie</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                <Icon name="file-text" size="lg" className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                <p>Aucun devoir disponible pour cette matière</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
              </div>
            </Card>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <Icon name="file-text" size="lg" className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">Aucune matière avec contrôles disponible</p>
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
