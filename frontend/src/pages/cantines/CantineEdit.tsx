import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cantineService } from '../../services/cantineService';
import type { Cantine } from '../../types/eleve';

const CantineEdit: React.FC = () => {
  const { id } = useParams();
  const cantineId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [capacite, setCapacite] = useState<string>('');
  const [localisation, setLocalisation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const c: Cantine = res.data as any;
      setNom(c.nom || '');
      setCapacite(String(c.capacite ?? ''));
      setLocalisation(c.localisation || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return setError('Le nom est requis');
    const capNum = Number(capacite);
    if (Number.isNaN(capNum) || capNum < 0) return setError('Capacité invalide');
    if (!localisation.trim()) return setError('Localisation requise');
    try {
      setSaving(true);
      setError(null);
      await cantineService.update(cantineId, {
        nom: nom.trim(),
        capacite: capNum,
        localisation: localisation.trim(),
      } as any);
      navigate(`/cantines/${cantineId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier la cantine" 
        subtitle="Mettre à jour les informations"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Cantines', link: '/cantines' },
          { label: 'Modifier', link: `/cantines/${cantineId}/edit` },
        ]}
      />

      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-600">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input 
                  type="text"
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacité</label>
                <input 
                  type="number" min="0" step="1"
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={capacite}
                  onChange={(e) => setCapacite(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Localisation</label>
              <input 
                type="text"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default CantineEdit;


