import React, { useEffect, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { parentService, type ParentEleve } from '../../services/parentService';

const ParentShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parent, setParent] = useState<ParentEleve | null>(null);
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await parentService.show(Number(id));
        setParent((res as any).parent);
        const kids = await parentService.eleves(Number(id));
        setChildren(kids.eleves || []);
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHead
        title={parent ? `${parent.prenom} ${parent.nom}` : 'Parent'}
        subtitle="Détails du parent"
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Parents', link: '/parents' }, { label: 'Détails', link: `/parents/${id}` }]}
        actions={[{ label: 'Modifier', icon: 'edit', onClick: () => navigate(`/parents/${id}/edit`), variant: 'secondary' }]}
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

      {!loading && !error && parent && (
        <>
          <Card>
            <div className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white flex items-center justify-center text-xl font-bold">
                {parent.prenom?.[0]}{parent.nom?.[0]}
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-slate-800 dark:text-white">{parent.prenom} {parent.nom}</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">{parent.email || '—'} · {parent.telephone || '—'}</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">{parent.adresse || '—'}</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Profession: {parent.profession || '—'}</div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    parent.type === 'pere' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 
                    parent.type === 'mere' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200' : 
                    'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}>
                    {parent.type === 'pere' ? 'Père' : 'Mère'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate(`/parents/${id}/edit`)}>
                  <Icon name="edit" size="sm" />
                  <span className="ml-2">Modifier</span>
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="users" className="text-slate-500 dark:text-gray-400" />
                <div className="font-semibold text-slate-800 dark:text-white">Élèves</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">({children.length})</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.length ? children.map((e) => (
                  <div key={e.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-white">{e.prenom} {e.nom}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">Classe: {e.classe?.nom_complet || e.classe?.nom || '—'}</div>
                      </div>
                      <Button variant="secondary" onClick={() => navigate(`/eleves/${e.id}`)}>
                        <Icon name="eye" size="sm" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 dark:text-gray-400">Aucun élève lié.</div>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ParentShow;
