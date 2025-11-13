import React, { useEffect, useState, useMemo } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import { professeurService, type Professeur } from '../../services/professeurService';
import { useNavigate } from 'react-router-dom';

const ProfesseursClasses: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Professeur[]>([]);
  const navigate = useNavigate();

  // Search
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await professeurService.list({ per_page: 1000, with: ['classes'] });
        setItems(res.data || []);
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      `${(p as any).prenom || ''} ${(p as any).nom || ''}`.toLowerCase().includes(q) ||
      ((p as any).email || '').toLowerCase().includes(q) ||
      ((p as any).telephone || '').toLowerCase().includes(q) ||
      ((p as any).classes || []).some((c: any) => (c.nom || c.nom_complet || '').toLowerCase().includes(q))
    );
  }, [items, search]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = useMemo(() => filteredItems.slice(startIndex, endIndex), [filteredItems, startIndex, endIndex]);

  return (
    <div className="space-y-6">
      <PageHead
        title="Professeurs · Classes assignées"
        subtitle="Vue des classes assignées à chaque professeur"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Professeurs', link: '/professeurs' },
          { label: 'Classes assignées', link: '/professeurs/classes' },
        ]}
      />

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher (nom, email, téléphone, classe)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md pl-9 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon name="search" size="sm" className="text-slate-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/professeurs')}>
                  <Icon name="eye" size="sm" />
                  <span className="ml-2">Voir tous</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">Professeur</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">Email</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">Téléphone</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">Classes assignées</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {pageItems.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-gray-800 border-b border-slate-100 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                        {p.prenom} {p.nom}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-400">{p.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-400">{p.telephone || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {(p.classes && p.classes.length > 0) ? (
                            p.classes.map((c: any) => (
                              <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                <Icon name="book" size="sm" className="mr-1" />
                                {c.nom_complet || c.nom || `Classe #${c.id}`}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 dark:text-gray-500">Aucune</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Voir" aria-label="Voir" onClick={() => navigate(`/professeurs/${p.id}`)}>
                            <Icon name="eye" size="sm" />
                          </button>
                          <button className="p-2 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors" title="Emploi du temps" aria-label="Emploi du temps" onClick={() => navigate(`/professeurs/${p.id}/timetable`)}>
                            <Icon name="calendar" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
};

export default ProfesseursClasses;
