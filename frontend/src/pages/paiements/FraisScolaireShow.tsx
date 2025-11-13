import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { fraisScolaireService } from '../../services/fraisScolaireService';
import type { FraisScolaire } from '../../types/paiements';
import { useNotification } from '../../contexts/NotificationContext';

const FraisScolaireShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  const [frais, setFrais] = useState<FraisScolaire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadFraisScolaire();
    }
  }, [id]);

  const loadFraisScolaire = async () => {
    try {
      setLoading(true);
      const response = await fraisScolaireService.getFraisScolaire(parseInt(id!));
      if (response.success) {
        setFrais(response.data);
      }
    } catch (error: any) {
      showError('Erreur lors du chargement du frais scolaire');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  if (!frais) {
    return (
      <div className="text-center py-12">
        <Icon name="alert-circle" size="lg" className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Frais scolaire non trouvé</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Le frais scolaire demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/frais-scolaires')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={frais.nom}
        subtitle="Détails du frais scolaire"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Paiements Élèves', link: '/paiements-eleves' },
          { label: 'Frais Scolaires', link: '/frais-scolaires' },
          { label: frais.nom, link: '#' }
        ]}
        actions={[
          {
            icon: 'edit',
            label: 'Modifier',
            onClick: () => navigate(`/frais-scolaires/${frais.id}/edit`),
            variant: 'outline'
          }
        ]}
      />

      {/* Informations générales */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations générales</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${fraisScolaireService.getTypeColor(frais.type)}`}>
                  {fraisScolaireService.getTypeLabel(frais.type)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Montant mensuel</dt>
              <dd className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(frais.montant_mensuel).toLocaleString('fr-FR')} MAD
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Niveau</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {frais.niveau?.nom || 'Général (tous les niveaux)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Obligatoire</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  frais.obligatoire 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                }`}>
                  {frais.obligatoire ? 'Oui' : 'Non'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(frais.created_at).toLocaleDateString('fr-FR')}
              </dd>
            </div>
          </dl>
          {frais.description && (
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {frais.description}
              </dd>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FraisScolaireShow;
