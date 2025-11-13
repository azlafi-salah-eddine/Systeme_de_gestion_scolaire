import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import niveauService from '../../services/niveauService';
import { useNotification } from '../../contexts/NotificationContext';
import type { NiveauItem } from '../../services/niveauService';

const NiveauForm: React.FC<{ mode: 'create' | 'edit' }>= ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<NiveauItem>>({ nom: '', description: '', bareme: 20.00 });
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      (async () => {
        try {
          setLoading(true);
          const data = await niveauService.show(Number(id));
          setForm({ nom: data.nom, description: data.description, bareme: data.bareme || 20.00 });
        } catch (e: any) {
          setError(e.message || 'Erreur de chargement');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, id]);

  const updateField = (k: keyof NiveauItem, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (mode === 'create') {
        await niveauService.create(form);
        showSuccess('Niveau créé', 'Le niveau a été créé avec succès.');
      } else if (id) {
        await niveauService.update(Number(id), form);
        showSuccess('Niveau mis à jour', 'Le niveau a été mis à jour avec succès.');
      }
      navigate('/niveaux');
    } catch (e: any) {
      const message = e.message || 'Erreur';
      setError(message);
      showError('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title={mode === 'create' ? 'Nouveau niveau' : 'Modifier niveau'} 
        subtitle={mode === 'create' ? 'Créer un niveau' : 'Mettre à jour le niveau'}
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Classes', link: '/classes' }, { label: 'Niveaux', link: '/niveaux' }, { label: mode === 'create' ? 'Nouveau' : 'Modifier', link: mode === 'create' ? '/niveaux/new' : `/niveaux/${id}/edit` }]} 
      />
      <Card>
        <form className="p-6 space-y-6" onSubmit={onSubmit}>
          {error && <div className="text-red-600">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input value={form.nom || ''} onChange={e => updateField('nom', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barème</label>
              <input 
                type="number" 
                step="0.01" 
                min="0.1" 
                max="100" 
                value={form.bareme || 20.00} 
                onChange={e => updateField('bareme', parseFloat(e.target.value) || 20.00)} 
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
                required 
              />
              <p className="mt-1 text-xs text-slate-500">Note maximale pour ce niveau (ex: 20.00, 10.00)</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={form.description || ''} onChange={e => updateField('description', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/niveaux')}>Annuler</Button>
            <Button type="submit" variant="success" disabled={loading}>{loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Enregistrer')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NiveauForm;


