import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import { salleService, type Salle } from '../../services/salleService';

const SalleShow: React.FC = () => {
  const { id } = useParams();
  const [salle, setSalle] = useState<Salle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSalle = async () => {
    try {
      setLoading(true);
      const res = await salleService.show(Number(id));
      setSalle(res.data);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadSalle();
  }, [id]);

  if (loading) return (
          
          
    <div className="space-y-6"><div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
    <Card>
       <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
          </div>
          </Card></div>
  );
  if (error) return (
    <div className="space-y-6"><PageHead title="Erreur" /><Card><div className="p-6 text-red-600 dark:text-red-400">{error}</div></Card></div>
  );
  if (!salle) return (
    <div className="space-y-6"><PageHead title="Salle introuvable" /><Card><div className="p-6 text-gray-900 dark:text-gray-400">Aucune donnée</div></Card></div>
  );

  return (
    <div className="space-y-6">
      <PageHead 
        title={salle.nom}
        subtitle="Détails de la salle"
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Salles', link: '/salles' }, { label: salle.nom, link: `/salles/${salle.id}` }]}
        actions={[]}
      />

      <Card>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-sm text-slate-500 dark:text-gray-400">Capacité</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{salle.capacite}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-gray-400">Type</div>
            <div className="text-lg font-semibold capitalize text-slate-900 dark:text-white">{salle.type.replace('_',' ')}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-gray-400">Localisation</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{salle.localisation || '-'}</div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-sm text-slate-500 dark:text-gray-400">Équipements</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{salle.equipements || '-'}</div>
          </div>
        </div>
        </Card>
      </div>
  );
};

export default SalleShow;



