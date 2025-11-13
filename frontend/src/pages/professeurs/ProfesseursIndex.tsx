import React, { useEffect, useMemo, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { professeurService } from '../../services/professeurService';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  active?: boolean;
  created_at?: string;
}

const ProfesseursIndex: React.FC = () => {
  const [items, setItems] = useState<Professeur[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { showSuccess, showError } = useNotification();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/v1/professeurs', { params: search ? { search } : undefined });
        setItems(res.data?.data || []);
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [search]);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; name: string; loading: boolean }>({ isOpen: false, id: null, name: '', loading: false });
  const openConfirm = (id: number, name: string) => setConfirmState({ isOpen: true, id, name, loading: false });
  const closeConfirm = () => setConfirmState((s) => ({ ...s, isOpen: false }));
  const handleDeleteConfirm = async () => {
    if (!confirmState.id) return;
    try {
      setConfirmState((s) => ({ ...s, loading: true }));
      await professeurService.remove(confirmState.id);
      setItems(prev => prev.filter(p => p.id !== confirmState.id));
      closeConfirm();
      showSuccess('Supprimé', `Le professeur ${confirmState.name} a été supprimé avec succès.`);
    } catch (e: any) {
      showError('Erreur', e?.message || 'Erreur lors de la suppression');
      setConfirmState((s) => ({ ...s, loading: false }));
    }
  };

  // Derived: filter + paginate
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      (p.nom || '').toLowerCase().includes(q) ||
      (p.prenom || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.telephone || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <PageHead title="Professeurs" subtitle="Liste du personnel enseignant" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Professeurs', link: '/professeurs' }]} />

      <Card>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, email, téléphone..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md pl-9 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon name="search" size="sm" className="text-slate-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => navigate('/professeurs/new')}>
                <Icon name="plus" />
                <span className="ml-2">Nouveau</span>
              </Button>
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
                <path fillRule="evenodd" d="M10 18a 8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Nom</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Prénom</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Email</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Téléphone</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right uppercase text-slate-500 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-gray-700">
                  {pageItems.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{p.nom}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.prenom}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.telephone || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Voir" aria-label="Voir" onClick={() => navigate(`/professeurs/${p.id}`)}>
                            <Icon name="eye" size="sm" />
                          </button>
                          <button className="p-2 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Modifier" aria-label="Modifier" onClick={() => navigate(`/professeurs/${p.id}/edit`)}>
                            <Icon name="edit" size="sm" />
                          </button>
                          <button className="p-2 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors" title="Emploi du temps" aria-label="Emploi du temps" onClick={() => navigate(`/professeurs/${p.id}/timetable`)}>
                            <Icon name="calendar" size="sm" />
                          </button>
                          <button className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Supprimer" aria-label="Supprimer" onClick={() => openConfirm(p.id, `${p.nom} ${p.prenom}`.trim())}>
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td className="py-6 text-slate-500 dark:text-gray-400" colSpan={5}>Aucun professeur</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(() => {
              const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
              const end = Math.min(total, safePage * pageSize);
              return (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
                  <div className="inline-flex items-center gap-2">
                    <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Précédent</button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Page {safePage} / {totalPages}</span>
                    <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Suivant</button>
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

export default ProfesseursIndex;
