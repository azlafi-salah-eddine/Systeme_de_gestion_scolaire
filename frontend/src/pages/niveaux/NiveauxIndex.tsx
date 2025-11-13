import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import niveauService from '../../services/niveauService';
import type { NiveauItem } from '../../services/niveauService';
import Icon from '../../components/Icon';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const NiveauxIndex: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<NiveauItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; label: string }>({ isOpen: false, id: null, label: '' });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await niveauService.list();
      setItems(data.filter((n: any) => n.active !== false)); // Filter inactive niveaux
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: number, label: string) => setConfirmState({ isOpen: true, id, label });

  const confirmDelete = async () => {
    if (!confirmState.id) return;
    try {
      await niveauService.remove(confirmState.id);
      await load();
      showSuccess('Niveau supprimé', 'Le niveau a été supprimé avec succès.');
    } catch (e: any) {
      const message = e.message || 'Erreur de suppression';
      showError('Échec de suppression', message);
    } finally {
      setConfirmState({ isOpen: false, id: null, label: '' });
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-6">
      <PageHead title="Niveaux" subtitle="Gestion des niveaux" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Classes', link: '/classes' }, { label: 'Niveaux', link: '/niveaux' }]} actions={[{ label: 'Nouveau niveau', link: '/niveaux/new', variant: 'primary' }]} />
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500" /></div>
        ) : error ? (
          <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <div className="p-4">
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="flex items-center justify-between gap-4 p-4 mb-4">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Icon name="search" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Rechercher par nom ou description..."
                      className="block w-full py-2 pr-3 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md pl-9 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Nom</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Barème</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const filtered = q ? items.filter((n: NiveauItem) =>
                      (n.nom || '').toLowerCase().includes(q) ||
                      (n.description || '').toLowerCase().includes(q)
                    ) : items;
                    const total = filtered.length;
                    const totalPages = Math.max(1, Math.ceil(total / pageSize));
                    const safePage = Math.min(currentPage, totalPages);
                    const start = (safePage - 1) * pageSize;
                    const end = start + pageSize;
                    const pageItems = filtered.slice(start, end);
                    return pageItems.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Aucun niveau</td></tr>
                    ) : (
                      pageItems.map((n: NiveauItem) => (
                      <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 max-w-[220px]"><span className="line-clamp-1 text-gray-900 dark:text-white">{n.nom}</span></td>
                        <td className="px-4 py-2"><span className="text-gray-900 dark:text-white font-medium">{n.bareme || 20.00}</span></td>
                        <td className="px-4 py-2 max-w-[400px]"><span className="line-clamp-1 text-gray-600 dark:text-gray-400">{n.description || '—'}</span></td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              className="p-1.5 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Voir"
                              aria-label="Voir"
                              onClick={() => navigate(`/niveaux/${n.id}`)}
                            >
                              <Icon name="eye" size="sm" />
                            </button>
                            <button
                              className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                              title="Modifier"
                              aria-label="Modifier"
                              onClick={() => navigate(`/niveaux/${n.id}/edit`)}
                            >
                              <Icon name="edit" size="sm" />
                            </button>
                            <button
                              className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Supprimer"
                              aria-label="Supprimer"
                              onClick={() => requestDelete(n.id, n.nom)}
                            >
                              <Icon name="trash" size="sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    );
                  })()}
                </tbody>
              </table>
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const filtered = q ? items.filter((n: NiveauItem) => (n.nom || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q)) : items;
                const total = filtered.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1;
                const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize);
                return (
                  <div className="flex items-center justify-between px-4 pb-4 mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
                    <div className="inline-flex items-center gap-2">
                      <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Précédent</button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Page {Math.min(currentPage, totalPages)} / {totalPages}</span>
                      <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Card>
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, label: '' })}
        onConfirm={confirmDelete}
        title="Supprimer le niveau"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.label}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default NiveauxIndex;


