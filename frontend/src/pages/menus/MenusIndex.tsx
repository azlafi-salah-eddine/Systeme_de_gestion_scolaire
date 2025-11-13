import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { menuService } from '../../services/menuService';
import { cantineService } from '../../services/cantineService';
import type { MenuItem, MenuListResponse } from '../../services/menuService';
import type { Cantine } from '../../types/eleve';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';

const MenusIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [cantines, setCantines] = useState<Cantine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; label: string }>({ isOpen: false, id: null, label: '' });

  const [cantineId, setCantineId] = useState<number | ''>('');
  const [jour, setJour] = useState<MenuItem['jour'] | ''>('');

  const jours = useMemo(() => ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'] as MenuItem['jour'][] , []);

  useEffect(() => {
    void loadCantines();
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [cantineId, jour]);

  const loadCantines = async () => {
    try {
      const res = await cantineService.list({ per_page: 100 });
      setCantines(res.data);
    } catch {
      // ignore
    }
  };

  const loadMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: MenuListResponse = await menuService.list({
        cantine_id: cantineId === '' ? undefined : Number(cantineId),
        jour: jour === '' ? undefined : jour,
      });
      setMenus(res.data);
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
      const response = await menuService.remove(confirmState.id);
      showSuccess('Suppression réussie', response.message || 'Menu supprimé avec succès');
      await loadMenus();
    } catch (e) {
      showError('Erreur de suppression', e instanceof Error ? e.message : 'Erreur lors de la suppression du menu');
    } finally {
      setConfirmState({ isOpen: false, id: null, label: '' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Menus" 
        subtitle="Gestion des menus de cantine"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Menus', link: '/menus' }
        ]}
        actions={[
          { label: 'Nouveau menu', link: '/menus/new', variant: 'primary' }
        ]}
      />

      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cantine</label>
            <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={cantineId} onChange={(e) => setCantineId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Toutes</option>
              {cantines.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Jour</label>
            <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={jour} onChange={(e) => setJour(e.target.value as MenuItem['jour'] | '')}>
              <option value="">Tous</option>
              {jours.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <Button variant="secondary" onClick={() => { setCantineId(''); setJour(''); }}>Réinitialiser</Button>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Recherche</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon name="search" className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Rechercher par cantine, plat, entrée, dessert, boisson..."
                className="block w-full py-2 pr-3 text-sm placeholder-gray-400 border border-gray-300 rounded-md pl-9 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Cantine</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Jour</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Plat principal</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Entrée</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Dessert</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Boisson</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = q
                    ? menus.filter((m) =>
                        (m.cantine?.nom || cantines.find(c => c.id === m.cantine_id)?.nom || '').toLowerCase().includes(q) ||
                        (m.jour || '').toLowerCase().includes(q) ||
                        (m.plat_principal || '').toLowerCase().includes(q) ||
                        (m.entree || '').toLowerCase().includes(q) ||
                        (m.dessert || '').toLowerCase().includes(q) ||
                        (m.boisson || '').toLowerCase().includes(q)
                      )
                    : menus;
                  const total = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(total / pageSize));
                  const safePage = Math.min(currentPage, totalPages);
                  const start = (safePage - 1) * pageSize;
                  const end = start + pageSize;
                  const pageItems = filtered.slice(start, end);
                  return pageItems.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">{m.cantine?.nom || cantines.find(c => c.id === m.cantine_id)?.nom || '-'}</td>
                    <td className="px-4 py-3 capitalize">{m.jour}</td>
                    <td className="px-4 py-3">{m.plat_principal}</td>
                    <td className="px-4 py-3">{m.entree || '-'}</td>
                    <td className="px-4 py-3">{m.dessert || '-'}</td>
                    <td className="px-4 py-3">{m.boisson || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 rounded-full hover:bg-slate-100"
                          title="Voir"
                          aria-label="Voir"
                          onClick={() => navigate(`/menus/${m.id}`)}
                        >
                          <Icon name="eye" size="sm" />
                        </button>
                        <button
                          className="p-2 text-green-600 rounded-full hover:bg-green-50"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={() => navigate(`/menus/${m.id}/edit`)}
                        >
                          <Icon name="edit" size="sm" />
                        </button>
                        <button
                          className="p-2 text-red-600 rounded-full hover:bg-red-50"
                          title="Supprimer"
                          aria-label="Supprimer"
                          onClick={() => setConfirmState({ isOpen: true, id: m.id, label: m.plat_principal })}
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
                {menus.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Aucun menu</td>
                  </tr>
                )}
              </tbody>
            </table>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? menus.filter((m) =>
                    (m.cantine?.nom || cantines.find(c => c.id === m.cantine_id)?.nom || '').toLowerCase().includes(q) ||
                    (m.jour || '').toLowerCase().includes(q) ||
                    (m.plat_principal || '').toLowerCase().includes(q) ||
                    (m.entree || '').toLowerCase().includes(q) ||
                    (m.dessert || '').toLowerCase().includes(q) ||
                    (m.boisson || '').toLowerCase().includes(q)
                  )
                : menus;
              const total = filtered.length;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1;
              const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize);
              return (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
                  <div className="inline-flex items-center gap-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Précédent</button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Page {Math.min(currentPage, totalPages)} / {totalPages}</span>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</button>
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
        title="Supprimer le menu"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.label}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default MenusIndex;


