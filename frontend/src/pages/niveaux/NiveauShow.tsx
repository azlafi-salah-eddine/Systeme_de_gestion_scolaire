import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import niveauService from '../../services/niveauService';

const NiveauShow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) throw new Error('ID manquant');
        const res = await niveauService.show(Number(id));
        setData(res);
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHead 
        title="Détails du niveau" 
        subtitle="Aperçu du niveau" 
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Classes', link: '/classes' }, { label: 'Niveaux', link: '/niveaux' }, { label: 'Détails', link: `/niveaux/${id}` }]} 
      />
      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div>
        ) : error ? (
          <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
        ) : !data ? (
          <div className="p-6 text-slate-500 dark:text-gray-400">Introuvable</div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Nom</div>
                <div className="font-medium text-gray-900 dark:text-white">{data.nom}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Barème</div>
                <div className="font-medium text-gray-900 dark:text-white">{data.bareme || 20.00}</div>
                <div className="text-xs text-slate-400 dark:text-gray-500 mt-1">Note maximale pour ce niveau</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-slate-500 dark:text-gray-400">Description</div>
                <div className="font-medium text-gray-900 dark:text-white">{data.description || '—'}</div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate('/niveaux')}>Retour</Button>
              <Button variant="primary" onClick={() => navigate(`/niveaux/${id}/edit`)}>Modifier</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NiveauShow;


