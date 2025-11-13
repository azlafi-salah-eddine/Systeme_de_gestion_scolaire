import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
// import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { transportService } from '../../services/transportService';
import type { Chauffeur } from '../../types/eleve';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const ChauffeursIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; label: string }>({ isOpen: false, id: null, label: '' });

  useEffect(() => {
    void loadChauffeurs();
  }, []);

  const loadChauffeurs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transportService.listChauffeurs();
      setChauffeurs(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: number, label: string) => setConfirmState({ isOpen: true, id, label });
  const confirmDelete = async () => {
    if (!confirmState.id) return;
    try {
      await transportService.removeChauffeur(confirmState.id);
      await loadChauffeurs();
      showSuccess('Chauffeur supprimé', 'Le chauffeur a été supprimé avec succès.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de suppression';
      showError('Échec de suppression', message);
      alert(message);
    } finally {
      setConfirmState({ isOpen: false, id: null, label: '' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Chauffeurs" 
        subtitle="Gestion des chauffeurs"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Transports', link: '/transports' },
          { label: 'Chauffeurs', link: '/chauffeurs' }
        ]}
        actions={[
          { label: 'Nouveau chauffeur', link: '/chauffeurs/new', variant: 'primary' }
        ]}
      />

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
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
                    placeholder="Rechercher par nom, prénom, téléphone ou permis..."
                    className="block w-full py-2 pr-3 text-sm placeholder-gray-400 border border-gray-300 rounded-md pl-9 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Nom</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Prénom</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Téléphone</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Permis</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {/** Filtrage + pagination client **/}
                {(
                  () => {
                    const q = searchQuery.trim().toLowerCase();
                    const filtered = q
                      ? chauffeurs.filter((c) =>
                          (c.nom || '').toLowerCase().includes(q) ||
                          (c.prenom || '').toLowerCase().includes(q) ||
                          (c.telephone || '').toLowerCase().includes(q) ||
                          (c.permis || '').toLowerCase().includes(q)
                        )
                      : chauffeurs;
                    const total = filtered.length;
                    const totalPages = Math.max(1, Math.ceil(total / pageSize));
                    const safePage = Math.min(currentPage, totalPages);
                    const start = (safePage - 1) * pageSize;
                    const end = start + pageSize;
                    const pageItems = filtered.slice(start, end);
                    return pageItems.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{c.nom}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{c.prenom}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{c.telephone}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{c.permis}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 rounded-full hover:bg-slate-100"
                          title="Voir"
                          aria-label="Voir"
                          onClick={() => navigate(`/chauffeurs/${c.id}`)}
                        >
                          <Icon name="eye" size="sm" />
                        </button>
                        <button
                          className="p-2 text-green-600 rounded-full hover:bg-green-50"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={() => navigate(`/chauffeurs/${c.id}/edit`)}
                        >
                          <Icon name="edit" size="sm" />
                        </button>
                        <button
                          className="p-2 text-red-600 rounded-full hover:bg-red-50"
                          title="Supprimer"
                          aria-label="Supprimer"
                           onClick={() => requestDelete(c.id, `${c.prenom} ${c.nom}`)}
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                    ));
                  }
                )()}
                {chauffeurs.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Aucun chauffeur</td>
                  </tr>
                )}
              </tbody>
            </table>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? chauffeurs.filter((c) =>
                    (c.nom || '').toLowerCase().includes(q) ||
                    (c.prenom || '').toLowerCase().includes(q) ||
                    (c.telephone || '').toLowerCase().includes(q) ||
                    (c.permis || '').toLowerCase().includes(q)
                  )
                : chauffeurs;
              const total = filtered.length;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1;
              const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize);
              return (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Page {Math.min(currentPage, totalPages)} / {totalPages}</span>
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
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
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, label: '' })}
        onConfirm={confirmDelete}
        title="Supprimer le chauffeur"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.label}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default ChauffeursIndex;
