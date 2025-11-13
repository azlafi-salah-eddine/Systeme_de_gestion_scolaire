import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { cantineService } from '../../services/cantineService';
import type { Cantine } from '../../types/eleve';

const CantineShow: React.FC = () => {
  const { id } = useParams();
  const cantineId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [cantine, setCantine] = useState<Cantine | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cantineId) return;
    void loadCantine();
  }, [cantineId]);

  const loadCantine = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cantineService.show(cantineId);
      setCantine(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title={cantine ? cantine.nom : 'Cantine'} 
        subtitle="Informations de la cantine"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Cantines', link: '/cantines' },
          { label: cantine ? cantine.nom : 'Détails', link: `/cantines/${cantineId}` }
        ]}
        actions={[
          { label: 'Modifier', onClick: () => navigate(`/cantines/${cantineId}/edit`), variant: 'secondary' }
        ]}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <Card><div className="p-6 text-red-600 dark:text-red-400">{error}</div></Card>
      ) : cantine ? (
        <Card>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Nom</div>
              <div className="font-medium text-slate-900 dark:text-white">{cantine.nom}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Capacité</div>
              <div className="font-medium text-slate-900 dark:text-white">{cantine.capacite ?? '-'} places</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-slate-500 dark:text-gray-400">Localisation</div>
              <div className="font-medium text-slate-900 dark:text-white">{cantine.localisation || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Créée le</div>
              <div className="font-medium text-slate-900 dark:text-white">{new Date(cantine.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-gray-400">Dernière mise à jour</div>
              <div className="font-medium text-slate-900 dark:text-white">{new Date(cantine.updated_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default CantineShow;


