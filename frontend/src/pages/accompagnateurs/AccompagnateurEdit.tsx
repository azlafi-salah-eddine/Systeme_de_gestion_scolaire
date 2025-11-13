import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { transportService } from '../../services/transportService';
import type { Accompagnateur } from '../../types/eleve';
import { useNotification } from '../../contexts/NotificationContext';

const AccompagnateurEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      void loadAccompagnateur();
    }
  }, [id]);

  const loadAccompagnateur = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transportService.showAccompagnateur(parseInt(id!));
      const accompagnateur: Accompagnateur = res.data as any;
      setNom(accompagnateur.nom || '');
      setPrenom(accompagnateur.prenom || '');
      setTelephone(accompagnateur.telephone || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return setError('Le nom est requis');
    if (!prenom.trim()) return setError('Le prénom est requis');
    if (!telephone.trim()) return setError('Le téléphone est requis');
    
    try {
      setSaving(true);
      setError(null);
      await transportService.updateAccompagnateur(parseInt(id!), {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
      });
      showSuccess('Accompagnateur modifié', `${prenom} ${nom} a été mis à jour avec succès.`);
      navigate(`/accompagnateurs/${id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de mise à jour';
      setError(message);
      showError('Échec de modification', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier accompagnateur" 
        subtitle="Mettre à jour les informations"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Transports', link: '/transports' },
          { label: 'Accompagnateurs', link: '/accompagnateurs' },
          { label: 'Modifier', link: `/accompagnateurs/${id}/edit` }
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
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default AccompagnateurEdit;