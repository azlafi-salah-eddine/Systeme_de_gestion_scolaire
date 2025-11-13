import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { transportService } from '../../services/transportService';
import type { Transport } from '../../types/eleve';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const TransportsIndex: React.FC = () => {
  const navigate = useNavigate();
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { showSuccess, showError } = useNotification();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; label: string }>(
    { isOpen: false, id: null, label: '' }
  );

  useEffect(() => {
    void loadTransports();
  }, []);

  const loadTransports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transportService.list({ with: ['chauffeur', 'accompagnateur'] });
      setTransports(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: number, label: string) => {
    setConfirmState({ isOpen: true, id, label });
  };

  const confirmDelete = async () => {
    if (!confirmState.id) return;
    try {
      await transportService.remove(confirmState.id);
      await loadTransports();
      showSuccess('Transport supprimé', 'Le transport a été supprimé avec succès.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de suppression';
      showError('Échec de suppression', message);
    } finally {
      setConfirmState({ isOpen: false, id: null, label: '' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Transports" 
        subtitle="Gestion des transports scolaires"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Transports', link: '/transports' }
        ]}
        actions={[
          { label: 'Nouveau transport', link: '/transports/new', variant: 'primary' }
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
                    placeholder="Rechercher par ligne, matricule, chauffeur ou accompagnateur..."
                    className="block w-full py-2 pr-3 text-sm placeholder-gray-400 border border-gray-300 rounded-md pl-9 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Ligne</th>
                  <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Matricule</th>
                  <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Capacité</th>
                  <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Chauffeur</th>
                  <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Accompagnateur</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = q
                    ? transports.filter((t) =>
                        (t.ligne || '').toLowerCase().includes(q) ||
                        (t.matricule || '').toLowerCase().includes(q) ||
                        (t.chauffeur ? `${t.chauffeur.prenom} ${t.chauffeur.nom}`.toLowerCase() : '').includes(q) ||
                        (t.accompagnateur ? `${t.accompagnateur.prenom} ${t.accompagnateur.nom}`.toLowerCase() : '').includes(q)
                      )
                    : transports;
                  const total = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(total / pageSize));
                  const safePage = Math.min(currentPage, totalPages);
                  const start = (safePage - 1) * pageSize;
                  const end = start + pageSize;
                  const pageItems = filtered.slice(start, end);
                  return pageItems.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="max-w-[220px] truncate text-xs font-medium text-gray-900 dark:text-white" title={t.ligne}>{t.ligne}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap dark:text-white text-xs">{t.matricule || '-'}</td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap dark:text-white text-xs">{t.capacite}</td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap dark:text-white">
                      <div className="max-w-[180px] truncate text-xs" title={t.chauffeur && t.chauffeur.active !== false ? `${t.chauffeur.prenom} ${t.chauffeur.nom}` : ''}>
                      {t.chauffeur ? (t.chauffeur.active === false ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Supprimé</span>
                      ) : `${t.chauffeur.prenom} ${t.chauffeur.nom}`) : '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap dark:text-white">
                      <div className="max-w-[180px] truncate text-xs" title={t.accompagnateur && t.accompagnateur.active !== false ? `${t.accompagnateur.prenom} ${t.accompagnateur.nom}` : ''}>
                      {t.accompagnateur ? (t.accompagnateur.active === false ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Supprimé</span>
                      ) : `${t.accompagnateur.prenom} ${t.accompagnateur.nom}`) : '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 rounded-full hover:bg-slate-100"
                          title="Voir"
                          aria-label="Voir"
                          onClick={() => navigate(`/transports/${t.id}`)}
                        >
                          <Icon name="eye" size="sm" />
                        </button>
                        <button
                          className="p-2 text-green-600 rounded-full hover:bg-green-50"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={() => navigate(`/transports/${t.id}/edit`)}
                        >
                          <Icon name="edit" size="sm" />
                        </button>
                        <button
                          className="p-2 text-red-600 rounded-full hover:bg-red-50"
                          title="Supprimer"
                          aria-label="Supprimer"
                          onClick={() => requestDelete(t.id, t.ligne)}
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
                {transports.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Aucun transport</td>
                  </tr>
                )}
              </tbody>
            </table>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? transports.filter((t) =>
                    (t.ligne || '').toLowerCase().includes(q) ||
                    (t.matricule || '').toLowerCase().includes(q) ||
                    (t.chauffeur ? `${t.chauffeur.prenom} ${t.chauffeur.nom}`.toLowerCase() : '').includes(q) ||
                    (t.accompagnateur ? `${t.accompagnateur.prenom} ${t.accompagnateur.nom}`.toLowerCase() : '').includes(q)
                  )
                : transports;
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
        title="Supprimer le transport"
        message={`Êtes-vous sûr de vouloir supprimer le transport "${confirmState.label}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default TransportsIndex;
