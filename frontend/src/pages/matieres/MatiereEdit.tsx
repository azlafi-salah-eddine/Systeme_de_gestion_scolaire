import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import matiereService from '../../services/matiereService';
import { useNotification } from '../../contexts/NotificationContext';

const MatiereEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<any>({ nom: '', code: '', coleur: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await matiereService.show(Number(id));
        const data = res.data || res;
        setForm({
          nom: data.nom || '',
          code: data.code || '',
          coleur: data.couleur || '',
          coefficient: data.coefficient || 0,
          description: data.description || '',
        });
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateField = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await matiereService.update(Number(id), {
        nom: form.nom,
        code: form.code,
        coleur: form.coleur,
        coefficient: form.coefficient,
        description: form.description,
        active: true,
      });
      showSuccess('Matière mise à jour', 'La matière a été mise à jour avec succès.');
      navigate('/matieres');
    } catch (err: any) {
      const message = err.message || 'Erreur de mise à jour';
      setError(message);
      showError('Erreur de mise à jour', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead title="Modifier matière" subtitle="Mettre à jour la matière" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Matières', link: '/matieres' }, { label: 'Modifier', link: `/matieres/${id}/edit` }]} />
      <Card>
        <form className="p-6 space-y-6" onSubmit={onSubmit}>
          {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Matière</label>
              <input value={form.nom || ''} onChange={e => updateField('nom', e.target.value)} className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Code</label>
              <input value={form.code || ''} onChange={e => updateField('code', e.target.value)} className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Coefficient</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                value={form.coefficient || ''} 
                onChange={e => updateField('coefficient', parseFloat(e.target.value) || 0)} 
                className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Couleur</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.coleur || '#3b82f6'} onChange={e => updateField('coleur', e.target.value)} className="h-10 w-14 p-0 border dark:border-gray-600 rounded" />
                <input value={form.coleur || ''} onChange={e => updateField('coleur', e.target.value)} className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" placeholder="#RRGGBB" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.description || ''} onChange={e => updateField('description', e.target.value)} className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/matieres')}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MatiereEdit;


