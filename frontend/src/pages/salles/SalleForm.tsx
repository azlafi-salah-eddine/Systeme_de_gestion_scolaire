import React, { useEffect, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { salleService, type Salle } from '../../services/salleService';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

type Mode = 'create' | 'edit';

const types: Salle['type'][] = ['classe','laboratoire','bibliotheque','salle_informatique','salle_art','gymnase','cantine','bureau'];

const SalleForm: React.FC<{ mode: Mode }> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ nom: string; capacite: number; type: Salle['type']; localisation?: string; equipements?: string }>({
    nom: '', capacite: 30, type: 'classe', localisation: '', equipements: '',
  });

  useEffect(() => {
    if (mode === 'edit' && id) {
      (async () => {
        try {
          setLoading(true);
          const res = await salleService.show(Number(id));
          const s = res.data;
          
          // Vérifier si la salle est supprimée
          if (!s.active) {
            setError('Cette salle a été supprimée et ne peut pas être modifiée. Veuillez la restaurer d\'abord.');
            return;
          }
          
          setForm({ nom: s.nom, capacite: s.capacite, type: s.type, localisation: s.localisation, equipements: s.equipements });
        } catch (e: any) {
          setError(e.message || 'Erreur de chargement');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as any;
    setForm(prev => ({ ...prev, [name]: name === 'capacite' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (mode === 'create') {
        await salleService.create({ ...form, active: true } as any);
        showSuccess('Salle créée', 'La salle a été créée avec succès.');
      } else if (id) {
        await salleService.update(Number(id), form as any);
        showSuccess('Salle mise à jour', 'La salle a été mise à jour avec succès.');
      }
      navigate('/salles');
    } catch (e: any) {
      const message = e.message || 'Erreur d\'enregistrement';
      setError(message);
      showError('Erreur d\'enregistrement', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title={mode === 'create' ? 'Nouvelle salle' : 'Modifier la salle'} 
        subtitle={mode === 'create' ? 'Créer une nouvelle salle' : 'Mettre à jour la salle'} 
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Salles', link: '/salles' }, 
          { label: mode === 'create' ? 'Nouvelle' : 'Modifier', link: mode === 'create' ? '/salles/new' : `/salles/${id}/edit` }
        ]} 
      />
      {error && <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30"><div className="text-red-600 dark:text-red-400">{error}</div></div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="nom">Nom *</label>
                <input id="nom" name="nom" value={form.nom} onChange={handleChange} required className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="capacite">Capacité *</label>
                <input id="capacite" name="capacite" type="number" min={1} max={200} value={form.capacite} onChange={handleChange} required className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="type">Type *</label>
                <select id="type" name="type" value={form.type} onChange={handleChange} required className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm">
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="localisation">Localisation</label>
                <input id="localisation" name="localisation" value={form.localisation || ''} onChange={handleChange} className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="equipements">Équipements</label>
                <textarea id="equipements" name="equipements" value={form.equipements || ''} onChange={handleChange} className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm" />
              </div>
            </div>
          </div>
        </Card>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate('/salles')}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={saving} loading={saving}>
            {mode === 'create' ? 'Créer la salle' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SalleForm;



