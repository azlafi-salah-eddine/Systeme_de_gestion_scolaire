import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PermissionGate from '../../components/PermissionGate';
import { transportService } from '../../services/transportService';
import { useNotification } from '../../contexts/NotificationContext';
import type { Accompagnateur } from '../../types/eleve';

const AccompagnateurShow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accompagnateur, setAccompagnateur] = useState<Accompagnateur | null>(null);

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
      setAccompagnateur(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accompagnateur || !confirm('Supprimer cet accompagnateur ?')) return;
    try {
      await transportService.removeAccompagnateur(accompagnateur.id);
      showSuccess('Accompagnateur masqué', 'L\'accompagnateur a été masqué (soft delete). Vous pouvez le restaurer depuis Enregistrements supprimés.');
      navigate('/accompagnateurs');
    } catch (e) {
      showError('Erreur de suppression', e instanceof Error ? e.message : 'Erreur de suppression');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Accompagnateur" 
          subtitle="Chargement..."
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Transports', link: '/transports' },
            { label: 'Accompagnateurs', link: '/accompagnateurs' },
            { label: 'Détails', link: `/accompagnateurs/${id}` }
          ]}
        />
        <Card>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !accompagnateur) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Erreur" 
          subtitle={error || 'Accompagnateur introuvable'}
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Transports', link: '/transports' },
            { label: 'Accompagnateurs', link: '/accompagnateurs' },
            { label: 'Détails', link: `/accompagnateurs/${id}` }
          ]}
        />
        <Card>
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            {error || 'Accompagnateur introuvable'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title={`${accompagnateur.prenom} ${accompagnateur.nom}`} 
        subtitle="Détails de l'accompagnateur"
      />

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informations personnelles</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nom complet</dt>
              <dd className="text-slate-900 dark:text-white">{accompagnateur.prenom} {accompagnateur.nom}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Téléphone</dt>
              <dd className="text-slate-900 dark:text-white">{accompagnateur.telephone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Créé le</dt>
              <dd className="text-slate-900 dark:text-white">{new Date(accompagnateur.created_at).toLocaleDateString('fr-FR')}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  );
};

export default AccompagnateurShow;
