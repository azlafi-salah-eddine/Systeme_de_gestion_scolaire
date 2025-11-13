import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { fraisScolaireService } from '../../services/fraisScolaireService';
import niveauService from '../../services/niveauService';
import type { FraisScolaire } from '../../types/paiements';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const FraisScolairesIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [fraisScolaires, setFraisScolaires] = useState<FraisScolaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; frais: FraisScolaire | null }>({
    isOpen: false,
    frais: null
  });

  useEffect(() => {
    loadNiveaux();
  }, []);

  useEffect(() => {
    loadFraisScolaires();
  }, [currentPage, typeFilter, niveauFilter]);

  const loadNiveaux = async () => {
    try {
      const response = await niveauService.getNiveaux();
      setNiveaux(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des niveaux:', error);
    }
  };

  const loadFraisScolaires = async () => {
    try {
      setLoading(true);
      const response = await fraisScolaireService.getFraisScolaires({
        type: typeFilter || undefined,
        niveau_id: niveauFilter || undefined,
        per_page: 10,
        page: currentPage
      });
      
      if (response.success) {
        setFraisScolaires(response.data);
      }
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des frais scolaires');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (frais: FraisScolaire) => {
    try {
      const response = await fraisScolaireService.deleteFraisScolaire(frais.id);
      if (response.success) {
        showSuccess('Succès', 'Frais scolaire supprimé avec succès');
        loadFraisScolaires();
      }
    } catch (error: any) {
      showError('Erreur', 'Erreur lors de la suppression');
    } finally {
      setDeleteModal({ isOpen: false, frais: null });
    }
  };


  return (
    <div className="space-y-6">
      <PageHead
        title="Frais Scolaires"
        subtitle="Configuration des frais mensuels pour scolarité, cantine et transport"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Paiements Élèves', link: '/paiements-eleves' },
          { label: 'Frais Scolaires', link: '/frais-scolaires' }
        ]}
        actions={[
          {
            icon: 'plus',
            label: 'Nouveau Frais',
            link: '/frais-scolaires/new',
            variant: 'primary'
          }
        ]}
      />


      {/* Liste des frais scolaires */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <div className="flex items-center justify-between gap-2 p-4 mb-4">
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                >
                  <option value="">Tous les types</option>
                  <option value="scolarite">Scolarité</option>
                  <option value="cantine">Cantine</option>
                  <option value="transport">Transport</option>
                </select>
                <select
                  value={niveauFilter}
                  onChange={(e) => setNiveauFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                >
                  <option value="">Tous les niveaux</option>
                  {niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 max-w-sm ml-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon name="search" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="block w-full py-2 pr-3 text-sm placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-9 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-20 px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Nom</th>
                  <th className="w-28 px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Montant</th>
                  <th className="w-28 px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Niveau</th>
                  <th className="w-28 px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Obligatoire</th>
                  <th className="w-28 px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {(() => {
                  const q = search.trim().toLowerCase();
                  const filtered = q ? fraisScolaires.filter((f) => 
                    (f.nom || '').toLowerCase().includes(q) || 
                    (f.type || '').toLowerCase().includes(q) ||
                    (f.description || '').toLowerCase().includes(q)
                  ) : fraisScolaires.filter(f => !typeFilter || f.type === typeFilter);
                  const total = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(total / 10));
                  const safePage = Math.min(currentPage, totalPages);
                  const start = (safePage - 1) * 10;
                  const end = start + 10;
                  const pageItems = filtered.slice(start, end);
                  
                  if (total === 0) {
                    return (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                          {fraisScolaires.length === 0 ? (
                            <div className="py-12 text-center">
                              <Icon name="credit-card" size="lg" className="mx-auto mb-4 text-gray-400" />
                              <h3 className="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">
                                Aucun frais scolaire créé
            </h3>
                              <p className="mb-6 text-sm text-gray-400 dark:text-gray-500">
                                Commencez par créer votre premier frais scolaire
              </p>
              <Button
                onClick={() => navigate('/frais-scolaires/new')}
                                className="text-white bg-blue-600 hover:bg-blue-700"
              >
                <Icon name="plus" size="sm" className="mr-2" />
                                Créer mon premier frais
              </Button>
            </div>
          ) : (
                            'Aucun résultat trouvé'
                          )}
                        </td>
                  </tr>
                    );
                  }
                  
                  return pageItems.map((frais) => (
                    <tr key={frais.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${fraisScolaireService.getTypeColor(frais.type)}`}>
                          {fraisScolaireService.getTypeLabel(frais.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{frais.nom}</div>
                          {frais.description && (
                            <div className="max-w-xs mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate" title={frais.description}>
                              {frais.description.length > 35 ? `${frais.description.substring(0, 35)}...` : frais.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {Math.round(frais.montant_mensuel).toLocaleString('fr-FR')} MAD
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {frais.niveau ? (
                          <div className="text-xs text-gray-900 dark:text-white">{frais.niveau.nom}</div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Général</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          frais.obligatoire 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        }`}>
                          {frais.obligatoire ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            onClick={() => navigate(`/frais-scolaires/${frais.id}`)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Voir"
                          >
                            <Icon name="eye" size="sm" />
                          </button>
                          <button
                            onClick={() => navigate(`/frais-scolaires/${frais.id}/edit`)}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            title="Modifier"
                          >
                            <Icon name="edit" size="sm" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, frais })}
                            className="p-1.5 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Supprimer"
                          >
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
              </table>
            {(() => {
              const q = search.trim().toLowerCase();
              const filtered = q ? fraisScolaires.filter((f) => 
                (f.nom || '').toLowerCase().includes(q) || 
                (f.type || '').toLowerCase().includes(q) ||
                (f.description || '').toLowerCase().includes(q)
              ) : fraisScolaires.filter(f => !typeFilter || f.type === typeFilter);
              const total = filtered.length;
              const totalPages = Math.max(1, Math.ceil(total / 10));
              const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * 10 + 1;
              const end = Math.min(total, Math.min(currentPage, totalPages) * 10);
              
              if (total === 0) return null;
              
              return (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Affichage {start}-{end} sur {total}
            </div>
                  <div className="inline-flex items-center gap-2">
              <button
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                      disabled={currentPage <= 1}
              >
                Précédent
              </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {Math.min(currentPage, totalPages)} / {totalPages}
                    </span>
              <button
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
                      disabled={currentPage >= totalPages}
              >
                Suivant
              </button>
            </div>
              </div>
              );
            })()}
          </div>
        )}
        </Card>


      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, frais: null })}
        onConfirm={() => deleteModal.frais && handleDelete(deleteModal.frais)}
        title="Supprimer le frais scolaire"
        message={`Êtes-vous sûr de vouloir supprimer le frais "${deleteModal.frais?.nom}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default FraisScolairesIndex;
