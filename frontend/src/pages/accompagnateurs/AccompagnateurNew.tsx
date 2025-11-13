import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { transportService } from '../../services/transportService';
import { useNotification } from '../../contexts/NotificationContext';

const AccompagnateurNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return setError('Le nom est requis');
    if (!prenom.trim()) return setError('Le prénom est requis');
    if (!telephone.trim()) return setError('Le téléphone est requis');
    
    try {
      setLoading(true);
      setError(null);
      await transportService.createAccompagnateur({
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
      });
      showSuccess('Accompagnateur créé', `${prenom} ${nom} a été ajouté avec succès.`);
      navigate('/accompagnateurs');
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
        title="Nouvel accompagnateur" 
        subtitle="Créer un nouvel accompagnateur"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Transports', link: '/transports' },
          { label: 'Accompagnateurs', link: '/accompagnateurs' },
          { label: 'Nouveau', link: '/accompagnateurs/new' }
        ]}
      />

      <Card>
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input 
                type="text"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom de famille"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
              <input 
                type="text"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
            <input 
              type="tel"
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: +212 6 12 34 56 78"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/accompagnateurs')}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Créer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AccompagnateurNew;