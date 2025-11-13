import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import matiereService from '../../services/matiereService';
import niveauService from '../../services/niveauService';
import { useNotification } from '../../contexts/NotificationContext';
import type { NiveauItem } from '../../services/niveauService';

const MatiereNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState({
    nom: '',
    code: '',
    coleur: '#3b82f6',
    description: '',
    coefficient: 1,
    niveau_id: null as number | null,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [loadingNiveaux, setLoadingNiveaux] = useState(true);

  const updateField = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const loadNiveaux = async () => {
    try {
      setLoadingNiveaux(true);
      const data = await niveauService.list();
      setNiveaux(data.filter((n: any) => n.active !== false));
    } catch (err: any) {
      showError('Erreur de chargement', `Impossible de charger les niveaux: ${err.message}`);
    } finally {
      setLoadingNiveaux(false);
    }
  };

  useEffect(() => {
    loadNiveaux();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.niveau_id) {
      setError('Veuillez sélectionner un niveau');
      showError('Erreur de validation', 'Veuillez sélectionner un niveau');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await matiereService.create({
        nom: form.nom,
        code: form.code,
        coleur: form.coleur,
        description: form.description,
        coefficient: form.coefficient,
        niveau_id: form.niveau_id,
        active: true,
      });
      showSuccess('Matière créée', 'La matière a été créée avec succès.');
      navigate('/matieres');
    } catch (err: any) {
      let message = err.message || 'Erreur de création';
      
      // Extraire les messages d'erreur de validation si disponibles
      if (err.message && err.message.includes('|')) {
        const errors = err.message.split(' | ');
        message = errors.join('\n');
      }
      
      setError(message);
      showError('Erreur de création', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Nouvelle matière" 
        subtitle="Créer une nouvelle matière" 
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Matières', link: '/matieres' }, 
          { label: 'Nouvelle', link: '/matieres/new' }
        ]} 
      />
      <Card>
        <form className="p-6 space-y-6" onSubmit={onSubmit}>
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200 font-medium mb-1">Erreur de validation</div>
              <div className="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">{error}</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nom *</label>
              <input 
                value={form.nom || ''} 
                onChange={e => updateField('nom', e.target.value)} 
                className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Code *</label>
              <input 
                value={form.code || ''} 
                onChange={e => updateField('code', e.target.value)} 
                className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Niveau *</label>
              <select 
                value={form.niveau_id || ''} 
                onChange={e => updateField('niveau_id', e.target.value ? parseInt(e.target.value) : null)} 
                className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
                required
                disabled={loadingNiveaux}
              >
                <option value="">Sélectionner un niveau</option>
                {niveaux.map(niveau => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
              {loadingNiveaux && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chargement des niveaux...</p>
              )}
              {!loadingNiveaux && niveaux.length === 0 && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                  Aucun niveau disponible. Veuillez d'abord créer des niveaux ou vérifier que les seeders ont été exécutés.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Coefficient</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                value={form.coefficient || 1} 
                onChange={e => updateField('coefficient', parseFloat(e.target.value) || 1)} 
                className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Couleur</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={form.coleur || '#3b82f6'} 
                  onChange={e => updateField('coleur', e.target.value)} 
                  className="h-10 w-14 p-0 border dark:border-gray-600 rounded" 
                />
                <input 
                  value={form.coleur || ''} 
                  onChange={e => updateField('coleur', e.target.value)} 
                  className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
                  placeholder="#RRGGBB" 
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Description</label>
              <textarea 
                value={form.description || ''} 
                onChange={e => updateField('description', e.target.value)} 
                className="block w-full rounded-md border-slate-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500" 
                rows={3} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/matieres')}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={loading || niveaux.length === 0}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MatiereNew;
