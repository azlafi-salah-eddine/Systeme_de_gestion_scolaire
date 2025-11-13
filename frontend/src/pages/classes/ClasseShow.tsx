import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { classeService } from '../../services/classeService';
import { eleveService, type Eleve } from '../../services/eleveService';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Classe } from '../../services/classeService';
import niveauService, { type NiveauItem } from '../../services/niveauService';

const ClasseShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { anneeActive } = useAnneeScolaire();
  const { isBackendOffline } = useAuth();

  const [classe, setClasse] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  
  // Students state
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [elevesError, setElevesError] = useState<string | null>(null);
  const [searchEleves, setSearchEleves] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (isBackendOffline) {
          setClasse({
            id: parseInt(id),
            nom: 'Classe A',
            nom_court: 'A',
            nom_complet: 'Classe A (2023-2024)',
            niveau: '1ère',
            niveau_id: 1,
            section: 'A',
            annee_scolaire: '2023-2024',
            annee_scolaire_id: 1,
            capacite: 30,
            nombre_eleves: 24,
            taux_occupation: 80,
            est_complete: false,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Classe);
        } else {
          const res = await classeService.show(parseInt(id));
          setClasse(res.data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors du chargement de la classe');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isBackendOffline]);

  useEffect(() => {
    const loadNiveaux = async () => {
      try {
        const data = await niveauService.list();
        setNiveaux(data);
      } catch {
        setNiveaux([]);
      }
    };
    loadNiveaux();
  }, []);

  // Load students when class is loaded
  useEffect(() => {
    if (classe && !isBackendOffline) {
      loadEleves();
    }
  }, [classe, isBackendOffline]);

  const loadEleves = async () => {
    if (!id) return;
    try {
      setLoadingEleves(true);
      setElevesError(null);
      const response = await eleveService.getElevesByClasse(parseInt(id));
      setEleves(response.data || []);
    } catch (e) {
      setElevesError(e instanceof Error ? e.message : 'Erreur lors du chargement des élèves');
    } finally {
      setLoadingEleves(false);
    }
  };

  const handleEdit = () => navigate(`/classes/${id}/edit`);

  const handleToggleActive = async () => {
    if (!classe) return;
    if (anneeActive && classe.annee_scolaire_id && classe.annee_scolaire_id !== anneeActive.id) {
      setError("Action non autorisée: l'année de cette classe n'est pas l'année active.");
      return;
    }
    try {
      if (!isBackendOffline) {
        await classeService.toggleActive(classe.id);
      }
      setClasse({ ...classe, active: !classe.active });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la modification du statut');
    }
  };

  const handleDelete = async () => {
    if (!classe) return;
    if (anneeActive && classe.annee_scolaire_id && classe.annee_scolaire_id !== anneeActive.id) {
      setError("Suppression non autorisée pour une classe hors de l'année active.");
      return;
    }
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) return;
    try {
      if (!isBackendOffline) {
        await classeService.delete(classe.id);
      }
      navigate('/classes');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    }
  };

  // Filter and paginate students
  const filteredEleves = useMemo(() => {
    const q = searchEleves.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter((eleve) =>
      `${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.toLowerCase().includes(q) ||
      (eleve.cne || '').toLowerCase().includes(q) ||
      (eleve.cin || '').toLowerCase().includes(q)
    );
  }, [eleves, searchEleves]);

  const totalPages = Math.max(1, Math.ceil(filteredEleves.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageEleves = filteredEleves.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchEleves]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHead title="Détails de la classe" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHead title="Erreur" />
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!classe) {
    return (
      <div className="space-y-6">
        <PageHead title="Classe non trouvée" />
        <div className="text-sm text-slate-600 dark:text-gray-400">La classe demandée n'existe pas.</div>
      </div>
    );
  }

  const anneeLabel = typeof classe.annee_scolaire === 'object' && classe.annee_scolaire
    ? ((classe.annee_scolaire as any).nom || (classe.annee_scolaire as any).nom_formate || 'N/A')
    : (classe.annee_scolaire as any);

  return (
    <div className="space-y-6">
      <PageHead
        title={classe.nom_complet || classe.nom}
        subtitle="Détails de la classe"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Classes', link: '/classes' },
          { label: classe.nom || 'Détails', link: `/classes/${classe.id}` },
        ]}
      />

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Nom</div>
              <div className="font-medium text-gray-900 dark:text-white">{classe.nom}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Niveau</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {(() => {
                  // Si niveau est un objet (relation), utiliser son nom
                  const niveauNom = typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : classe.niveau;
                  const n = niveaux.find(nv => nv.nom === niveauNom);
                  if (n && n.active === false) {
                    return (
                      <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">Supprimé</span>
                    );
                  }
                  return niveauNom;
                })()}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Section</div>
              <div className="font-medium text-gray-900 dark:text-white">{classe.section}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Année scolaire</div>
              <div className="font-medium text-gray-900 dark:text-white">{anneeLabel}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Capacité</div>
              <div className="font-medium text-gray-900 dark:text-white">{classe.nombre_eleves} / {classe.capacite}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Statut</div>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classe.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                {classe.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Action buttons removed as per request */}
        </div>
      </Card>

      {/* Students Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Icon name="users" className="text-slate-500 dark:text-gray-400" />
              <div className="font-semibold text-slate-800 dark:text-white">Élèves de la classe</div>
              <div className="text-sm text-slate-500 dark:text-gray-400">({eleves.length})</div>
            </div>
            <Button variant="primary" onClick={() => navigate('/eleves/new')}>
              <Icon name="plus" size="sm" />
              Ajouter un élève
            </Button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500" size="sm" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchEleves}
                onChange={(e) => setSearchEleves(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500"
              />
            </div>
          </div>

          {/* Students Table */}
          {loadingEleves ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : elevesError ? (
            <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-400">
              {elevesError}
            </div>
          ) : eleves.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-gray-400">
              <Icon name="users" size="lg" className="mx-auto mb-2 text-slate-300 dark:text-gray-500" />
              <div>Aucun élève dans cette classe</div>
            </div>
          ) : (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600 dark:text-gray-300">Nom complet</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600 dark:text-gray-300">CNE</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600 dark:text-gray-300">CIN</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600 dark:text-gray-300">Date de naissance</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600 dark:text-gray-300">Statut</th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {pageEleves.map((eleve) => (
                    <tr key={eleve.id} className="border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-3">
                          {eleve.photo ? (
                            <img
                              src={eleve.photo}
                              alt={`${eleve.prenom_fr || eleve.prenom} ${eleve.nom_fr || eleve.nom}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center">
                              <Icon name="user" size="sm" className="text-slate-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-medium text-slate-800 dark:text-white">
                              {eleve.prenom_fr || eleve.prenom} {eleve.nom_fr || eleve.nom}
                            </div>
                            {(eleve.prenom_ar || eleve.nom_ar) && (
                              <div className="text-xs text-slate-500 dark:text-gray-400">
                                {eleve.prenom_ar} {eleve.nom_ar}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-600 dark:text-gray-400">
                        {eleve.cne || '—'}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-600 dark:text-gray-400">
                        {eleve.cin || '—'}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-600 dark:text-gray-400">
                        {eleve.date_naissance ? new Date(eleve.date_naissance).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          eleve.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                        }`}>
                          {eleve.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Voir"
                            onClick={() => navigate(`/eleves/${eleve.id}`)}
                          >
                            <Icon name="eye" size="sm" />
                          </button>
                          <button
                            className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                            title="Modifier"
                            onClick={() => navigate(`/eleves/${eleve.id}/edit`)}
                          >
                            <Icon name="edit" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Affichage {filteredEleves.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredEleves.length)} sur {filteredEleves.length}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {safePage} / {totalPages}
                    </span>
                    <button
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ClasseShow;


