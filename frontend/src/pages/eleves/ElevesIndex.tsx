import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import StudentPhoto from '../../components/ui/StudentPhoto';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import type { Eleve } from '../../types/eleve';
import { eleveService } from '../../services/eleveService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter';
 

const ElevesIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { isBackendOffline, user } = useAuth();
  const { anneeActive } = useAnneeScolaire();
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';
  
  // Data state
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10); // Increased from 6 to 10, user can change
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined);
  const [affectationFilter, setAffectationFilter] = useState<'all' | 'affecte' | 'non_affecte'>('all');
  
  // Filter options
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [classes, setClasses] = useState<Array<{
    id: number;
    nom: string;
    niveau: string;
    nom_complet: string;
  }>>([]);
  
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

  useEffect(() => {
    loadEleves();
  }, [currentPage, searchQuery, selectedNiveau, selectedClasse, selectedAnneeScolaire, affectationFilter, perPage]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedNiveau, selectedClasse, selectedAnneeScolaire, affectationFilter, perPage]);

  const loadFilterOptions = async () => {
    try {
      const response = await eleveService.getFilterOptions();
      if (response.success) {
        setNiveaux(response.data.niveaux);
      }
    } catch (err) {
      // Ignore filter options loading error
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
        const res = await (await import('../../services/classeService')).classeService.index({
          per_page: 1000,
          annee_scolaire_id: selectedAnneeScolaire
        }, ['niveau']);
        const list = (res as any).data || [];
        const mapped = list.map((c: any) => ({
          id: c.id,
          nom: c.nom,
          niveau: c.niveau?.nom ?? c.niveau,
          nom_complet: c.nom_complet || `${c.nom}${c.section ? ' ' + c.section : ''}`
        }));
        setClasses(mapped);
        // Si la classe sélectionnée ne fait pas partie de la liste filtrée, la réinitialiser
        if (selectedClasse && !mapped.some((c: any) => String(c.id) === String(selectedClasse))) {
          setSelectedClasse('');
        }
      } catch {
        setClasses([]);
      }
    };
    void loadClasses();
  }, [selectedAnneeScolaire]);

  const loadEleves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isBackendOffline) {
        // Mode hors ligne - données de démonstration filtrées
        const demoData = [
          {
            id: 1,
            nom_fr: 'Alami',
            prenom_fr: 'Ahmed',
            nom_ar: 'علمي',
            prenom_ar: 'أحمد',
            date_naissance: '2010-05-15',
            matricule: 'E001',
            cne: 'CNE001',
            photo: '',
            adresse: '123 Rue Mohammed V, Casablanca',
            classe_id: 1,
            active: true,
            created_at: '2023-09-01T00:00:00Z',
            updated_at: '2023-09-01T00:00:00Z',
            classe: {
              id: 1,
              nom: '6ème A',
              niveau: '6ème',
              section: 'A'
            }
          },
          {
            id: 2,
            nom_fr: 'Benali',
            prenom_fr: 'Sara',
            nom_ar: 'بن علي',
            prenom_ar: 'سارة',
            date_naissance: '2009-08-22',
            matricule: 'E002',
            cne: 'CNE002',
            photo: '',
            adresse: '456 Avenue Hassan II, Rabat',
            classe_id: 2,
            active: true,
            created_at: '2023-09-01T00:00:00Z',
            updated_at: '2023-09-01T00:00:00Z',
            classe: {
              id: 2,
              nom: '5ème B',
              niveau: '5ème',
              section: 'B'
            }
          }
        ];
        
        // Apply filters to demo data
        let filtered = demoData;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(e => 
            e.nom_fr.toLowerCase().includes(q) ||
            e.prenom_fr.toLowerCase().includes(q) ||
            e.matricule?.toLowerCase().includes(q) ||
            e.cne?.toLowerCase().includes(q)
          );
        }
        if (selectedNiveau) {
          filtered = filtered.filter(e => e.classe?.niveau === selectedNiveau);
        }
        if (selectedClasse) {
          filtered = filtered.filter(e => e.classe_id.toString() === selectedClasse);
        }
        
        setEleves(filtered);
        setTotal(filtered.length);
        setTotalPages(Math.ceil(filtered.length / perPage));
      } else {
        const params: any = {
          page: currentPage,
          per_page: perPage,
          active: 'true' // Only show active students by default
        };
        
        if (searchQuery.trim()) params.search = searchQuery.trim();
        
        // Ajouter le filtre d'affectation en premier
        if (affectationFilter === 'affecte') {
          params.has_classe = 'true';
        } else if (affectationFilter === 'non_affecte') {
          params.has_classe = 'false';
        }
        
        // Les autres filtres ne s'appliquent que si on ne filtre pas par "non affecté"
        if (affectationFilter !== 'non_affecte') {
          if (selectedNiveau) params.niveau = selectedNiveau;
          if (selectedClasse) params.classe_id = parseInt(selectedClasse);
          // Ajouter le filtre d'année scolaire
          if (selectedAnneeScolaire) {
            params.annee_scolaire_id = selectedAnneeScolaire;
          }
        }
        
        const response = await eleveService.getEleves(params);
        if (response.success) {
        setEleves(response.data);
          setTotal(response.pagination.total);
          setTotalPages(response.pagination.last_page);
        } else {
          throw new Error(response.message || 'Erreur lors du chargement');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des élèves');
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
        await eleveService.deleteEleve(confirmState.id);
      }
      
      setEleves(prev => prev.filter(eleve => eleve.id !== confirmState.id));
      setTotal(prev => prev - 1);
      showSuccess('Suppression réussie', 'L\'élève a été supprimé avec succès');
    } catch (err) {
      showError('Erreur de suppression', err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setConfirmState({ isOpen: false, id: null, name: '' });
    }
  };

  const handleEdit = (eleve: Eleve) => {
    navigate(`/eleves/${eleve.id}/edit`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filtered classes based on selected niveau
  const filteredClasses = useMemo(() => {
    if (!selectedNiveau) return classes;
    return classes.filter(classe => classe.niveau === selectedNiveau);
  }, [classes, selectedNiveau]);

  // Clear niveau filter when classe filter changes
  const handleClasseChange = (classeId: string) => {
    setSelectedClasse(classeId);
    if (classeId && selectedNiveau) {
      const selectedClasseObj = classes.find(c => c.id.toString() === classeId);
      if (selectedClasseObj && selectedClasseObj.niveau !== selectedNiveau) {
        setSelectedNiveau('');
      }
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Élèves" 
          subtitle="Gestion des élèves"
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Élèves', link: '/eleves' }
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
                  onClick={loadEleves}
                  className="text-red-800 border-red-300 dark:text-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
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
        title="Élèves" 
        subtitle="Gestion des élèves"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Élèves', link: '/eleves' }
        ]}
        actions={[
          {
            icon: 'plus',
            label: 'Nouvel élève',
            link: '/eleves/new',
            variant: 'primary'
          }
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
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
            {/* Search */}
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Rechercher
              </label>
              <div className="relative">
                <Icon name="search" className="absolute text-gray-400 transform -translate-y-1/2 dark:text-gray-500 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Nom, prénom, matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
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
                onChange={(e) => setSelectedNiveau(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
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
                onChange={(e) => handleClasseChange(e.target.value)}
                disabled={filteredClasses.length === 0}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {filteredClasses.length === 0 ? (
                  <option value="">{'Aucune classe disponible'}</option>
                ) : (
                  <>
                    <option value="">Toutes les classes</option>
                    {filteredClasses.map((classe) => (
                      <option key={classe.id} value={classe.id.toString()}>
                        {classe.nom_complet}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Affectation Filter */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Affectation
              </label>
              <select
                value={affectationFilter}
                onChange={(e) => setAffectationFilter(e.target.value as 'all' | 'affecte' | 'non_affecte')}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="affecte">Affecté</option>
                <option value="non_affecte">Non affecté</option>
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
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
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
                  setAffectationFilter('all');
                  setPerPage(10);
                  // Réinitialiser l'année scolaire selon le rôle
                  if (anneeActive) {
                    setSelectedAnneeScolaire(anneeActive.id);
                  }
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Élèves ({total})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          ) : eleves.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="users" className="mx-auto mb-4 text-gray-400 dark:text-gray-600" size="lg" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun élève trouvé
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {searchQuery || selectedNiveau || selectedClasse 
                  ? 'Aucun élève ne correspond à vos critères de recherche.'
                  : 'Commencez par ajouter votre premier élève.'
                }
              </p>
              <Link to="/eleves/new">
                <Button>
                  <Icon name="plus" size="sm" className="mr-2" />
                  Ajouter un élève
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Élève
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Matricule
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        CNE
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Classe
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {eleves.map((eleve) => (
                      <tr key={eleve.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <StudentPhoto
                                src={eleve.photo}
                                alt={`${eleve.prenom_fr || ''} ${eleve.nom_fr || ''}`}
                                size="sm"
                                firstName={eleve.prenom_fr || ''}
                                lastName={eleve.nom_fr || ''}
                                cne={eleve.cne}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {eleve.prenom_fr} {eleve.nom_fr}
                              </div>
                              {(eleve.prenom_ar || eleve.nom_ar) && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {eleve.prenom_ar} {eleve.nom_ar}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {eleve.matricule || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {eleve.cne || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {eleve.classe ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                              {eleve.classe.nom}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                              Non affecté
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/eleves/${eleve.id}`}
                              className="p-2 text-indigo-600 rounded-full dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                              title="Voir détails"
                            >
                              <Icon name="eye" size="sm" />
                            </Link>
                            <button
                              onClick={() => handleEdit(eleve)}
                              className="p-2 text-blue-600 rounded-full dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="Modifier"
                            >
                              <Icon name="edit" size="sm" />
                            </button>
                            <button
                              onClick={() => requestDelete(eleve.id, `${eleve.prenom_fr} ${eleve.nom_fr}`)}
                              className="p-2 text-red-600 rounded-full dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Supprimer"
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

              {/* Pagination simple comme la cantine */}
              {(() => {
                const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
                const end = Math.min(total, currentPage * perPage);
                return (
                  <div className="flex items-center justify-between px-4 pb-4 mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Affichage {total === 0 ? 0 : start}-{end} sur {total}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <button 
                        className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                        disabled={currentPage <= 1}
                      >
                        Précédent
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button 
                        className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Supprimer l'élève"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.name}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default ElevesIndex;
