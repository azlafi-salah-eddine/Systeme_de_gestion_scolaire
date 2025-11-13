import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGate from '../../components/PermissionGate';
import api from '../../services/api';

const AdminsIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user: currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const canCreate = !!currentUser?.roles?.includes('super_admin');
  
  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    id: number | null;
    name: string;
    loading: boolean;
  }>({ isOpen: false, id: null, name: '', loading: false });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admins');
      const items = res.data?.data?.data || [];
      // Show only active (soft-visible) users
      const visible = items.filter((u: any) => u.active !== false);
      setAdmins(visible);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur de chargement');
      showError('Erreur', 'Erreur lors du chargement des administrateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter and paginate data
  const filteredAdmins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((admin) => {
      const fullName = admin.nom && admin.prenom ? `${admin.nom} ${admin.prenom}` : admin.nom || admin.prenom || admin.nom_complet || admin.name || '';
      return fullName.toLowerCase().includes(q) ||
        (admin.email || '').toLowerCase().includes(q) ||
        (admin.telephone || '').toLowerCase().includes(q) ||
        (admin.role?.type || '').toLowerCase().includes(q);
    });
  }, [admins, searchQuery]);

  const total = filteredAdmins.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageAdmins = filteredAdmins.slice(startIndex, endIndex);

  // Confirmation modal handlers
  const openConfirm = (id: number, name: string) => setConfirmState({ isOpen: true, id, name, loading: false });
  const closeConfirm = () => setConfirmState({ isOpen: false, id: null, name: '', loading: false });

  const handleDeleteConfirm = async () => {
    if (!confirmState.id) return;
    try {
      setConfirmState(prev => ({ ...prev, loading: true }));
      // Correct endpoint (non-v1) for soft delete
      await api.delete(`/users/${confirmState.id}`);
      showSuccess('Utilisateur supprimé', "L'utilisateur a été supprimé avec succès.");
      closeConfirm();
      await load();
    } catch (error: any) {
      showError('Erreur lors de la suppression', error?.response?.data?.message || 'Opération échouée');
    } finally {
      setConfirmState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Administrateurs" 
        subtitle="Gestion des administrateurs" 
        
      />

      <Card>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-600">Liste des administrateurs</div>
          {canCreate && (
            <Button onClick={() => navigate('/settings/admins/new')} className="inline-flex items-center gap-2">
              <Icon name="plus" size="sm" />
              <span>Nouvel administrateur</span>
            </Button>
          )}
        </div>
        {error && (
          <div className="p-4 border border-red-200 rounded-md dark:border-red-800 bg-red-50 dark:bg-red-900/30">
            <div className="flex">
              <Icon name="alert" className="w-5 h-5 text-red-400 dark:text-red-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erreur</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
          </div>
        ) : (
          <div className="p-0">
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {/* Search bar */}
              <div className="flex items-center justify-between gap-4 p-4 mb-4">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Icon name="search" className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Rechercher par nom, email, téléphone, rôle..."
                      className="block w-full py-2 pr-3 text-sm placeholder-gray-400 border border-gray-300 rounded-md pl-9 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Nom
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Prénom
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Téléphone
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Rôles
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {pageAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-xs text-center text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'Aucun administrateur trouvé pour cette recherche' : 'Aucun administrateur trouvé'}
                      </td>
                    </tr>
                  ) : (
                    pageAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8">
                              <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full dark:bg-indigo-900">
                                <Icon name="user" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            </div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                              {admin.nom || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 dark:text-white">{admin.prenom || '-'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 dark:text-white">{admin.email}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 dark:text-white">{admin.telephone || '-'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {admin.role ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              Admin
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/settings/admins/${admin.id}`)}
                              className="p-2 text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800"
                              title="Voir"
                              aria-label="Voir"
                            >
                              <Icon name="eye" size="sm" />
                            </button>
                            <button
                              onClick={() => navigate(`/settings/admins/${admin.id}/edit`)}
                              className="p-2 text-green-600 rounded-full hover:bg-green-50 dark:hover:bg-gray-800"
                              title="Éditer"
                              aria-label="Éditer"
                            >
                              <Icon name="edit" size="sm" />
                            </button>
                            <PermissionGate permission="delete">
                              <button
                                onClick={() => openConfirm(admin.id, admin.nom && admin.prenom ? `${admin.nom} ${admin.prenom}` : admin.nom || admin.prenom || admin.nom_complet || admin.name || admin.email)}
                                className={`p-2 rounded-full ${
                                  admin.id === currentUser?.id 
                                    ? 'text-gray-400 cursor-not-allowed dark:text-gray-600' 
                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-gray-800'
                                }`}
                                title={admin.id === currentUser?.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer"}
                                disabled={admin.id === currentUser?.id}
                                aria-label="Supprimer"
                              >
                                <Icon name="trash" size="sm" />
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 pb-4 mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Affichage {total === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, total)} sur {total}
                </div>
                <div className="inline-flex items-center gap-2">
                  <button 
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800" 
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                    disabled={currentPage <= 1}
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {Math.min(currentPage, totalPages)} / {totalPages}
                  </span>
                  <button 
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800" 
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
                    disabled={currentPage >= totalPages}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'administrateur"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.name}" ? Cette action est irréversible.`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
        loading={confirmState.loading}
      />
    </div>
  );
};

export default AdminsIndex;


