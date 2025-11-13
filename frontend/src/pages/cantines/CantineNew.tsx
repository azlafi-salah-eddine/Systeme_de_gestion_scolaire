import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cantineService } from '../../services/cantineService';
import { useNotification } from '../../contexts/NotificationContext';

const CantineNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [nom, setNom] = useState('');
  const [capacite, setCapacite] = useState<string>('');
  const [localisation, setLocalisation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return setError('Le nom est requis');
    const capNum = Number(capacite);
    if (Number.isNaN(capNum) || capNum < 0) return setError('Capacité invalide');
    if (!localisation.trim()) return setError('Localisation requise');
    try {
      setLoading(true);
      setError(null);
      await cantineService.create({
        nom: nom.trim(),
        capacite: capNum,
        localisation: localisation.trim(),
      });
      showSuccess('Cantine créée', `La cantine "${nom.trim()}" a été ajoutée avec succès.`);
      navigate('/cantines');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de création';
      setError(message);
      showError('Échec de création', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Nouvelle cantine" 
        subtitle="Créer une nouvelle cantine"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Cantines', link: '/cantines' },
          { label: 'Nouveau', link: '/cantines/new' },
        ]}
      />

      <Card>
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
            <Button type="button" variant="secondary" onClick={() => navigate('/cantines')}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Créer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CantineNew;


