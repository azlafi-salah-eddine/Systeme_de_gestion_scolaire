import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import matiereService from '../../services/matiereService';

const MatiereShow: React.FC = () => {
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
        const res = await fetch(`/api/v1/matieres/${id}`, { headers: { 'Accept': 'application/json' }, credentials: 'include' });
        const text = await res.text();
        const clean = text.replace(/^\uFEFF/, '');
        const json = JSON.parse(clean);
        setData(json.data || json);
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHead title="Détails matière" subtitle="Aperçu de la matière" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Matières', link: '/matieres' }, { label: 'Détails', link: `/matieres/${id}` }]} />

      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : !data ? (
          <div className="p-6 text-slate-500">Introuvable</div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500">Nom</div>
                <div className="font-medium">{data.nom}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Code</div>
                <div className="font-medium">{data.code}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Coefficient</div>
                <div className="font-medium">{data.coefficient || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Niveau</div>
                <div className="font-medium">{data.niveau?.nom || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Couleur</div>
                <div className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: data.couleur }} />
                  <span className="text-xs text-gray-500">{data.couleur || '—'}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-slate-500">Description</div>
                <div className="font-medium">{data.description || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MatiereShow;


