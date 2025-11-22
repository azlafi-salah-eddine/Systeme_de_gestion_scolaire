import React, { useEffect, useMemo, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import { parentService, type ParentEleve } from '../../services/parentService';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';

const ParentsIndex: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ParentEleve[]>([]);
  const [q, setQ] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const load = async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentService.list({ 
        per_page: 1000, 
        q: query || '',
        // backend expects maybe 'withDeleted' or similar; remove unsupported 'active' flag
        ...(showDeleted ? { deleted: true } : {})
      });
      const data = (res as any).data || (res as any).parents || [];
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load(q);
  }, [showDeleted]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(q);
  };

  // confirm modal
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; name: string; loading: boolean }>({ isOpen: false, id: null, name: '', loading: false });
  const openConfirm = (id: number, name: string) => setConfirmState({ isOpen: true, id, name, loading: false });
  const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));
  const handleDeleteConfirm = async () => {
    if (!confirmState.id) return;
    try {
      setConfirmState(s => ({ ...s, loading: true }));
      await parentService.remove(confirmState.id);
      await load(q);
      closeConfirm();
      showSuccess('Supprimé', `Le parent ${confirmState.name} a été supprimé.`);
    } catch (e: any) {
      showError('Erreur', e?.message || 'Erreur lors de la suppression');
      setConfirmState(s => ({ ...s, loading: false }));
    }
  };

  const handleRestore = async (id: number, name: string) => {
    try {
      await parentService.restore(id);
      showSuccess('Restauré', `Le parent ${name} a été restauré.`);
      load(q);
    } catch (e: any) {
      showError('Erreur', e?.message || 'Erreur lors de la restauration');
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(p =>
      `${p.prenom || ''} ${p.nom || ''}`.toLowerCase().includes(s) ||
      (p.email || '').toLowerCase().includes(s) ||
      (p.telephone || '').toLowerCase().includes(s) ||
      (p.profession || '').toLowerCase().includes(s) ||
      (p.adresse || '').toLowerCase().includes(s)
    );
  }, [items, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <PageHead
        title="Parents"
        subtitle="Gestion des parents"
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Parents', link: '/parents' }]}
        
      />
      <div className="p-3 mb-4 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/30">
        <div className="flex items-start gap-2">
          <Icon name="info" className="text-blue-500 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Les parents sont créés automatiquement lors de l'inscription des élèves. 
            Utilisez cette page pour modifier ou consulter les informations des parents existants.
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <form onSubmit={onSearch} className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher par nom, email, téléphone, profession, adresse"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md pl-9 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon name="search" size="sm" className="text-slate-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary">
                <Icon name="search" />
                <span className="ml-2">Rechercher</span>
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setQ(''); load(''); }}>
                <Icon name="x" />
                <span className="ml-2">Réinitialiser</span>
              </Button>
            </div>
          </form>
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
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Nom</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Prénom</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Email</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Téléphone</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Type</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Profession</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right uppercase text-slate-500 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-gray-700">
                  {pageItems.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{p.nom}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.prenom}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.telephone || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.type}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-400">{p.profession || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Voir" aria-label="Voir" onClick={() => navigate(`/parents/${p.id}`)}>
                            <Icon name="eye" size="sm" />
                          </button>
                          {!showDeleted && (
                            <>
                              <button className="p-2 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Modifier" aria-label="Modifier" onClick={() => navigate(`/parents/${p.id}/edit`)}>
                                <Icon name="edit" size="sm" />
                              </button>
                              <button className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Supprimer" aria-label="Supprimer" onClick={() => openConfirm(p.id, `${p.prenom} ${p.nom}`.trim())}>
                                <Icon name="trash" size="sm" />
                              </button>
                            </>
                          )}
                          {showDeleted && (
                            <button className="p-2 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Restaurer" aria-label="Restaurer" onClick={() => handleRestore(p.id, `${p.prenom} ${p.nom}`.trim())}>
                              <Icon name="arrow-path" size="sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td className="py-6 text-slate-500 dark:text-gray-400" colSpan={7}>
                        {showDeleted ? "Aucun parent supprimé" : "Aucun parent"}
                      </td>
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

export default ParentsIndex;
