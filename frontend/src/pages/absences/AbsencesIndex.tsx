import React, { useEffect, useMemo, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { absenceService } from '../../services/absenceService';
import type { Absence } from '../../services/absenceService';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter';
import niveauService, { type NiveauItem } from '../../services/niveauService';

const AbsencesIndex: React.FC = () => {
  const [items, setItems] = useState<Absence[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { anneeActive } = useAnneeScolaire();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';
  
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined);
  const [filters, setFilters] = useState({
    justifie: undefined as boolean | undefined,
    date: '',
    niveau: '',
    classe: ''
  });
  const { showSuccess, showError } = useNotification();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // 5 éléments par page pour un chargement plus rapide

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, selectedAnneeScolaire]);

  useEffect(() => {
    void loadNiveaux();
    void loadClasses();
    void loadProfesseurs();
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

  // Recharger les absences quand les filtres ou la page changent (temps réel)
  useEffect(() => {
    void loadAbsences();
  }, [filters, currentPage, search, selectedAnneeScolaire]);

  const loadAbsences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les paramètres de filtrage avec pagination côté API
      const params: any = {
        search: search || undefined,
        with: ['eleve', 'eleve.classe', 'professeur', 'matiere'],
        per_page: pageSize,
        page: currentPage,
        justifie: filters.justifie,
        date: filters.date || undefined,
        niveau: filters.niveau || undefined,
        classe: filters.classe || undefined
      };

      // Ajouter le filtre d'année scolaire
      if (selectedAnneeScolaire) {
        params.annee_scolaire_id = selectedAnneeScolaire;
      }

      const res = await api.get('/v1/absences', { params });
      setItems(res.data?.data || []);
      
      // Mettre à jour les métadonnées de pagination si disponibles
      if (res.data?.meta) {
        setTotalItems(res.data.meta.total || 0);
      } else {
        setTotalItems(res.data?.data?.length || 0);
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };


  const loadNiveaux = async () => {
    try {
      const data = await niveauService.list();
      setNiveaux(data);
    } catch {
      setNiveaux([]);
    }
  };

  // Charger les classes depuis les absences (fallback car API classes a un problème)
  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      // Essayer d'abord l'API des classes avec filtre d'année
      const response = await api.get('/v1/classes', {
        params: {
          per_page: 1000,
          annee_scolaire_id: selectedAnneeScolaire
        }
      });
      const list = response.data?.data || [];
      setClasses(list);
      // Si la classe sélectionnée ne fait pas partie de la liste filtrée, la réinitialiser
      if (filters.classe && !list.some((c: any) => String(c.id) === String(filters.classe))) {
        setFilters((f) => ({ ...f, classe: '' }));
      }
    } catch (error) {
      // Fallback: extraire les classes des absences
      try {
        const absencesResponse = await api.get('/v1/absences', {
          params: {
            with: ['eleve.classe.niveau'],
            per_page: 1000 // Récupérer plus d'absences pour avoir toutes les classes
          }
        });
        
        const uniqueClasses = new Map();
        absencesResponse.data?.data?.forEach((absence: any) => {
          if (absence.eleve?.classe) {
            const classe = absence.eleve.classe;
            if (!uniqueClasses.has(classe.id)) {
              uniqueClasses.set(classe.id, classe);
            }
          }
        });
        
        const classesArray = Array.from(uniqueClasses.values());
        setClasses(classesArray);
      } catch (fallbackError) {
        setClasses([]);
      }
    } finally {
      setLoadingClasses(false);
    }
  };
  
  // Recharger les classes quand l'année change
  useEffect(() => {
    void loadClasses();
  }, [selectedAnneeScolaire]);

  const loadProfesseurs = async () => {
    try {
      const response = await api.get('/v1/professeurs');
      setProfesseurs(response.data?.data || []);
    } catch {
      setProfesseurs([]);
    }
  };

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; name: string; loading: boolean }>({ isOpen: false, id: null, name: '', loading: false });
  const openConfirm = (id: number, name: string) => setConfirmState({ isOpen: true, id, name, loading: false });
  const closeConfirm = () => setConfirmState((s) => ({ ...s, isOpen: false }));
  const handleDeleteConfirm = async () => {
    if (!confirmState.id) return;
    try {
      setConfirmState((s) => ({ ...s, loading: true }));
      await absenceService.remove(confirmState.id);
      setItems(prev => prev.filter(a => a.id !== confirmState.id));
      closeConfirm();
      showSuccess('Supprimé', `L'absence ${confirmState.name} a été supprimée avec succès.`);
    } catch (e: any) {
      showError('Erreur', e?.message || 'Erreur lors de la suppression');
      setConfirmState((s) => ({ ...s, loading: false }));
    }
  };

  // Utiliser directement les items de l'API (pagination côté serveur)
  const pageItems = items;
  const total = totalItems; // Utiliser le total réel de l'API
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = currentPage;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (justifie: boolean) => {
    if (justifie) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Justifiée</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">Non justifiée</span>;
  };

  return (
    <div className="space-y-6">
      <PageHead title="Absences" subtitle="Gestion des absences des élèves" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Absences', link: '/absences' }]} />

      <Card>
        <div className="p-6">
          {/* Barre de recherche principale */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par élève, professeur..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md pl-9 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon name="search" size="sm" className="text-slate-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilters({
                    justifie: undefined,
                    date: '',
                    niveau: '',
                    classe: ''
                  });
                  // Réinitialiser l'année scolaire selon le rôle
                  if (anneeActive) {
                    setSelectedAnneeScolaire(anneeActive.id);
                  }
                }}
              >
                <Icon name="refresh" size="sm" />
                <span className="ml-1">Réinitialiser</span>
              </Button>
              <Button variant="primary" onClick={() => navigate('/eleves/absences/new')}>
                <Icon name="plus" />
                <span className="ml-2">Nouvelle absence</span>
              </Button>
            </div>
          </div>

          {/* Filtres avancés */}
          <div className="grid grid-cols-1 gap-4 p-4 rounded-lg md:grid-cols-2 lg:grid-cols-5 bg-slate-50 dark:bg-gray-800">
            {/* Filtre par statut */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Statut
              </label>
              <select
                value={filters.justifie === undefined ? '' : filters.justifie.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  justifie: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500"
              >
                <option value="">Tous</option>
                <option value="false">Non justifiées</option>
                <option value="true">Justifiées</option>
              </select>
            </div>

            {/* Filtre par année scolaire */}
            <div>
              <AnneeScolaireFilter
                value={selectedAnneeScolaire}
                onChange={(value) => setSelectedAnneeScolaire(value)}
                className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Filtre par date */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500"
              />
            </div>

            {/* Filtre par niveau */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Niveau
              </label>
              <select
                value={filters.niveau}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, niveau: e.target.value, classe: '' }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.nom}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par classe - toujours visible; vide quand aucune classe */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Classe
              </label>
              <select
                value={filters.classe}
                onChange={(e) => setFilters(prev => ({ ...prev, classe: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!filters.niveau || loadingClasses || classes.filter(classe => !filters.niveau || classe.niveau?.nom === filters.niveau).length === 0}
              >
                {loadingClasses ? (
                  <option value="">Chargement...</option>
                ) : classes.filter(classe => !filters.niveau || classe.niveau?.nom === filters.niveau).length === 0 ? (
                  <option value="">Aucune classe disponible</option>
                ) : (
                  <>
                    <option value="">Toutes les classes</option>
                    {classes
                      .filter(classe => !filters.niveau || classe.niveau?.nom === filters.niveau)
                      .map((classe) => (
                        <option key={classe.id} value={classe.nom}>
                          {classe.nom}
                        </option>
                      ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Compteur de résultats */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-500 dark:text-gray-400">
              {pageItems.length} absence(s) sur cette page • {total} au total
            </div>
            <div className="text-xs text-slate-400 dark:text-gray-500">
              {pageSize} éléments par page
            </div>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
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
          <div className="p-6">
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full text-sm divide-y divide-slate-200 dark:divide-gray-700">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                      Classe
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                      Heure
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                      Professeur
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right uppercase text-slate-500 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-gray-700">
                  {pageItems.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                      {/* Nom */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-white">
                          {(() => {
                            const nom = a.eleve?.nom_fr || a.eleve?.nom || '';
                            const prenom = a.eleve?.prenom_fr || a.eleve?.prenom || '';
                            return `${prenom} ${nom}`.trim() || 'Nom manquant';
                          })()}
                        </div>
                      </td>
                      {/* Classe */}
                      <td className="px-4 py-3 text-slate-600 dark:text-gray-400">
                        {a.eleve?.classe?.nom || '—'}
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-800 dark:text-white">{formatDate(a.date)}</td>
                      {/* Heure */}
                      <td className="px-4 py-3 text-slate-600 dark:text-gray-400">
                        {a.heure_debut && a.heure_fin 
                          ? `${a.heure_debut} - ${a.heure_fin}`
                          : '—'
                        }
                      </td>
                      {/* Professeur */}
                      <td className="px-4 py-3 text-slate-600 dark:text-gray-400">
                        {a.professeur ? `${a.professeur.nom} ${a.professeur.prenom}` : '—'}
                      </td>
                      {/* Statut */}
                      <td className="px-4 py-3">
                        {getStatusBadge(a.justifie)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Voir" aria-label="Voir" onClick={() => navigate(`/eleves/absences/${a.id}`)}>
                            <Icon name="eye" size="sm" />
                          </button>
                          <button className="p-2 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Modifier" aria-label="Modifier" onClick={() => navigate(`/eleves/absences/${a.id}/edit`)}>
                            <Icon name="edit" size="sm" />
                          </button>
                          <button 
                            className={`p-2 rounded-full transition-colors ${
                              a.justifie 
                                ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' 
                                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                            }`}
                            title={a.justifie ? "Déjà justifiée" : "Justifier"}
                            aria-label={a.justifie ? "Déjà justifiée" : "Justifier"}
                            onClick={() => !a.justifie && navigate(`/eleves/absences/${a.id}/justify`)}
                            disabled={a.justifie}
                          >
                            <Icon name="check" size="sm" />
                          </button>
                          <button className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Supprimer" aria-label="Supprimer" onClick={() => openConfirm(a.id, `${a.eleve?.nom} ${a.eleve?.prenom} - ${formatDate(a.date)}`.trim())}>
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td className="py-12 text-center text-slate-500 dark:text-gray-400" colSpan={7}>
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Icon name="calendar" className="w-12 h-12 text-slate-300 dark:text-gray-600" />
                          <p className="text-lg font-medium dark:text-white">Aucune absence</p>
                          <p className="text-sm text-slate-400 dark:text-gray-500">Aucune absence trouvée pour les critères sélectionnés</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination simple comme la cantine */}
            {(() => {
              const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
              const end = Math.min(total, safePage * pageSize);
              return (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Affichage {total === 0 ? 0 : start}-{end} sur {total}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {safePage} / {totalPages}
                    </span>
                    <button
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer\n${confirmState.name} ? Cette action est irréversible.`}
        type="danger"
        loading={confirmState.loading}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default AbsencesIndex;