import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { classeService } from '../../services/classeService';
import { eleveService } from '../../services/eleveService';
import notesService from '../../services/notesService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter';

interface Note {
  id: number;
  eleve_id: number;
  discipline_id: number;
  professeur_id: number;
  note: number;
  bareme: number;
  type_controle: string;
  date_controle: string;
  annee_scolaire_id: number;
  created_at: string;
  updated_at: string;
  eleve?: {
    id: number;
    nom_fr: string;
    prenom_fr: string;
    nom_complet: string;
    classe?: {
      id: number;
      nom: string;
    };
  };
  discipline?: {
    id: number;
    nom: string;
    code: string;
  };
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
  };
}

interface Classe {
  id: number;
  nom: string;
  niveau?: {
    id: number;
    nom: string;
  };
}

const NotesIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { isBackendOffline, user } = useAuth();
  const { anneeActive } = useAnneeScolaire();
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';
  
  // Data state
  const [notes, setNotes] = useState<Note[]>([]);
  const [eleves, setEleves] = useState<Array<{
    id: number;
    nom_fr?: string;
    prenom_fr?: string;
    nom_complet?: string;
    matricule?: string;
    cne?: string;
    cin?: string;
    photo?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined);
  
  // Filter options
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  
  // Confirmation modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    id: number | null;
    name: string;
  }>({ isOpen: false, id: null, name: '' });

  // Load data on component mount and when filters change
  useEffect(() => {
    if (!isBackendOffline) {
      loadFilterOptions();
    }
  }, []);

  // Mettre à jour le filtre avec l'année active quand elle est disponible (pour Admin/Prof)
  useEffect(() => {
    if (anneeActive) {
      // Pour Admin/Prof: toujours utiliser l'année active
      // Pour Super Admin: utiliser l'année active par défaut si aucune n'est sélectionnée
      if (!isSuperAdmin || !selectedAnneeScolaire) {
        setSelectedAnneeScolaire(anneeActive.id);
      }
    }
  }, [anneeActive, isSuperAdmin]);

  // Reset classe when niveau changes
  useEffect(() => {
    if (selectedNiveau) {
      setSelectedClasse('');
    }
  }, [selectedNiveau]);

  // Load students when classe is selected
  useEffect(() => {
    if (selectedClasse) {
      loadElevesByClasse(selectedClasse);
    } else {
      setEleves([]);
      setNotes([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [selectedClasse, selectedAnneeScolaire]);

  // Load notes when students are loaded (optional - for existing notes display)
  useEffect(() => {
    if (selectedClasse && eleves.length > 0) {
      loadNotes();
    }
  }, [currentPage, searchQuery, selectedClasse, selectedAnneeScolaire, perPage, eleves.length]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedClasse, selectedAnneeScolaire, perPage]);

  const loadFilterOptions = async () => {
    try {
      // Load niveaux - exclure les élèves non affectés
      const params: any = {};
      if (selectedAnneeScolaire) {
        params.annee_scolaire_id = selectedAnneeScolaire;
      }
      const response = await eleveService.getFilterOptions(params);
      if (response.success) {
        setNiveaux(response.data.niveaux);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  // Charger les classes de l'année sélectionnée
  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (!selectedAnneeScolaire) {
          setClasses([]);
          setSelectedClasse('');
          return;
        }
        const res = await classeService.index({
          per_page: 1000,
          annee_scolaire_id: selectedAnneeScolaire
        }, ['niveau']);
        const list = res.data || [];
        setClasses(list as any);
        // Si la classe sélectionnée ne fait pas partie de la liste filtrée, la réinitialiser
        if (selectedClasse && !list.some((c: any) => String(c.id) === String(selectedClasse))) {
          setSelectedClasse('');
        }
      } catch {
        setClasses([]);
      }
    };
    void loadClasses();
  }, [selectedAnneeScolaire]);

  // Filtered classes based on selected niveau (like ElevesIndex)
  const filteredClasses = useMemo(() => {
    if (!selectedNiveau) return classes;
    return classes.filter(classe => {
      const niveauNom = typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : (classe as any)?.niveau;
      return niveauNom === selectedNiveau;
    });
  }, [classes, selectedNiveau]);

  const loadElevesByClasse = async (classeId: string) => {
    try {
      setLoading(true);
      const params: any = {
        has_classe: 'true' // Exclure les élèves non affectés
      };
      // Ajouter le filtre d'année scolaire
      if (selectedAnneeScolaire) {
        params.annee_scolaire_id = selectedAnneeScolaire;
      }
      const response = await eleveService.getElevesByClasse(parseInt(classeId), params);
      setEleves(response.data || []);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les élèves de cette classe');
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isBackendOffline) {
        // Mode hors ligne - données de démonstration filtrées
        const demoData: Note[] = [
          {
            id: 1,
            eleve_id: 1,
            discipline_id: 1,
            professeur_id: 1,
            note: 15.5,
            bareme: 20,
            type_controle: 'Devoir',
            date_controle: '2024-01-15',
            annee_scolaire_id: 1,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            eleve: {
              id: 1,
              nom_fr: 'Alami',
              prenom_fr: 'Ahmed',
              nom_complet: 'Ahmed Alami',
              classe: {
                id: 1,
                nom: '6ème A'
              }
            },
            discipline: {
              id: 1,
              nom: 'Mathématiques',
              code: 'MATH'
            },
            professeur: {
              id: 1,
              nom: 'Benali',
              prenom: 'Mohamed',
              nom_complet: 'Mohamed Benali'
            }
          },
          {
            id: 2,
            eleve_id: 2,
            discipline_id: 2,
            professeur_id: 2,
            note: 18.0,
            bareme: 20,
            type_controle: 'Contrôle',
            date_controle: '2024-01-16',
            annee_scolaire_id: 1,
            created_at: '2024-01-16T10:00:00Z',
            updated_at: '2024-01-16T10:00:00Z',
            eleve: {
              id: 2,
              nom_fr: 'Benali',
              prenom_fr: 'Sara',
              nom_complet: 'Sara Benali',
              classe: {
                id: 2,
                nom: '5ème B'
              }
            },
            discipline: {
              id: 2,
              nom: 'Français',
              code: 'FR'
            },
            professeur: {
              id: 2,
              nom: 'Alaoui',
              prenom: 'Fatima',
              nom_complet: 'Fatima Alaoui'
            }
          }
        ];
        
        // Apply filters to demo data
        let filtered = demoData;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(n => 
            n.eleve?.nom_complet.toLowerCase().includes(q) ||
            n.discipline?.nom.toLowerCase().includes(q) ||
            n.professeur?.nom_complet.toLowerCase().includes(q) ||
            n.type_controle.toLowerCase().includes(q)
          );
        }
        if (selectedClasse) {
          filtered = filtered.filter(n => n.eleve?.classe?.id.toString() === selectedClasse);
        }
        // TODO: Add these filters when implemented
        // if (selectedDiscipline) {
        //   filtered = filtered.filter(n => n.discipline_id.toString() === selectedDiscipline);
        // }
        // if (selectedProfesseur) {
        //   filtered = filtered.filter(n => n.professeur_id.toString() === selectedProfesseur);
        // }
        // if (selectedTypeControle) {
        //   filtered = filtered.filter(n => n.type_controle === selectedTypeControle);
        // }
        
        setNotes(filtered);
        setTotal(filtered.length);
        setTotalPages(Math.ceil(filtered.length / perPage));
      } else {
        const params: any = {
          page: currentPage,
          per_page: perPage
        };
        
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (selectedClasse) params.classe_id = parseInt(selectedClasse);
        // Ajouter le filtre d'année scolaire
        if (selectedAnneeScolaire) {
          params.annee_scolaire_id = selectedAnneeScolaire;
        }
        
        const response = await notesService.getNotes(params);
        // Support both new paginated shape and legacy plain array
        if (Array.isArray(response)) {
          setNotes(response as any);
          setTotal((response as any).length);
          setTotalPages(Math.max(1, Math.ceil((response as any).length / perPage)));
        } else if ((response as any).success) {
          setNotes((response as any).data || []);
          const pagination = (response as any).pagination || (response as any).meta;
          if (pagination) {
            setTotal(pagination.total || ((response as any).data || []).length);
            setTotalPages(pagination.last_page || 1);
          }
        } else {
          setNotes((response as any).data || []);
          setTotal(((response as any).data || []).length);
          setTotalPages(Math.max(1, Math.ceil(((response as any).data || []).length / perPage)));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: number, name: string) => {
    setConfirmState({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!confirmState.id) return;

    try {
      if (!isBackendOffline) {
        await notesService.deleteNote(confirmState.id);
      }
      
      setNotes(prev => prev.filter(note => note.id !== confirmState.id));
      setTotal(prev => prev - 1);
      showSuccess('Suppression réussie', 'La note a été supprimée avec succès');
    } catch (err) {
      showError('Erreur de suppression', err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setConfirmState({ isOpen: false, id: null, name: '' });
    }
  };

  const handleEdit = (note: Note) => {
    navigate(`/notes/${note.id}/edit`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddNotes = () => {
    if (selectedClasse) {
      navigate(`/notes/classe/${selectedClasse}/manage`);
    } else {
      navigate('/notes/new');
    }
  };

  const getNoteColor = (note: number, bareme: number) => {
    const percentage = (note / bareme) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Gestion des Notes" 
          subtitle="Gérez les notes des élèves"
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Notes', link: '/notes' }
          ]}
        />
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Icon name="alert" className="text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1 ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erreur de connexion</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p className="font-medium">{error}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={loadNotes}
                  className="text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title="Gestion des Notes" 
        subtitle="Gérez les notes des élèves, consultez les statistiques et analysez les performances"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Notes', link: '/notes' }
        ]}
      />

      {isBackendOffline && (
        <Card className="p-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon name="alert" className="text-yellow-500 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Mode hors ligne - Affichage des données de démonstration
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {/* Search */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Rechercher
              </label>
              <div className="relative">
                <Icon name="search" className="absolute text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Nom, prénom, matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
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

            {/* Niveau Filter */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Niveau
              </label>
              <select
                value={selectedNiveau}
                onChange={(e) => {
                  setSelectedNiveau(e.target.value);
                  setSelectedClasse('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {niveau}
                  </option>
                ))}
              </select>
            </div>

            {/* Classe Filter - always shown; disabled/empty when no classes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Classe
              </label>
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedNiveau || filteredClasses.length === 0}
              >
                {filteredClasses.length === 0 ? (
                  <option value="">{'Aucune classe disponible'}</option>
                ) : (
                  <>
                    <option value="">Toutes les classes</option>
                    {filteredClasses.map((classe) => (
                      <option key={classe.id} value={classe.id.toString()}>
                        {classe.nom}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Per Page Selector */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Par page
              </label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedNiveau('');
                  setSelectedClasse('');
                  setPerPage(10);
                }} 
                className="w-full"
              >
                <Icon name="refresh" />
                <span className="ml-2">Réinitialiser</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>


      {/* Results */}
      <Card>
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-end">
              {selectedClasse && eleves.length > 0 && (
                <Button onClick={handleAddNotes} variant="primary">
                  <Icon name="table" size="sm" className="mr-2" />
                  Gérer les notes
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          ) : !selectedClasse ? (
            <div className="p-12 text-center">
              <Icon 
                name="check-circle" 
                className="mx-auto mb-4 text-gray-400 dark:text-gray-600" 
                size="lg" 
              />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Sélectionnez une classe pour commencer
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Choisissez un niveau, puis une classe pour consulter les notes des élèves.
              </p>
            </div>
          ) : eleves.length === 0 ? (
            <div className="p-12 text-center">
              <Icon 
                name="users" 
                className="mx-auto mb-4 text-gray-400 dark:text-gray-600" 
                size="lg" 
              />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun élève trouvé
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Cette classe ne contient aucun élève.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                      Élève
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                      Matricule
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                      CNE
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                      CIN
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {eleves.map((eleve) => (
                    <tr key={eleve.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {eleve.photo ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0">
                              <img 
                                src={eleve.photo} 
                                alt={eleve.nom_complet}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Si l'image ne charge pas, afficher l'icône par défaut
                                  e.currentTarget.style.display = 'none';
                                  const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (sibling) {
                                    sibling.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="w-full h-full bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                                <Icon name="user" className="text-primary-600 dark:text-primary-400" size="sm" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <Icon name="user" className="text-primary-600 dark:text-primary-400" size="sm" />
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {eleve.nom_complet}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {eleve.matricule || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {eleve.cne || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {eleve.cin || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => navigate(`/eleves/${eleve.id}/notes`)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Icon name="notes" size="sm" />
                          Notes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Supprimer la note"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.name}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default NotesIndex;
