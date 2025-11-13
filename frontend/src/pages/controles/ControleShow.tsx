import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { controleService, type Controle } from '../../services/controleService';
import { useNotification } from '../../contexts/NotificationContext';

const ControleShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [controle, setControle] = useState<Controle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadControle = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const response = await controleService.getControle(parseInt(id));
        if (response.success) {
          setControle(response.data);
        } else {
          setError(response.message || 'Erreur lors du chargement du contrôle');
          showError('Erreur', response.message || 'Erreur lors du chargement du contrôle');
        }
      } catch (error: any) {
        const errorMsg = error?.message || 'Erreur lors du chargement du contrôle';
        setError(errorMsg);
        showError('Erreur', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadControle();
  }, [id, showError]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (debut: string, fin: string) => {
    const start = new Date(debut);
    const end = new Date(fin);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 0) return '—';
    
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  if (error || !controle) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Contrôle" 
          subtitle="Détails du contrôle"
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Contrôles', link: '/controles' },
            { label: 'Détails', link: `/controles/${id}` }
          ]} 
        />
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error || 'Contrôle non trouvé'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title={controle.libelle}
        subtitle={`${formatDate(controle.debut_controle)}`}
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Contrôles', link: '/controles' },
          { label: 'Détails', link: `/controles/${id}` }
        ]}
        actions={[
          { 
            label: 'Modifier', 
            icon: 'edit', 
            onClick: () => navigate(`/controles/${id}/edit`), 
            variant: 'secondary' 
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Informations du contrôle</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Libellé</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white font-medium">{controle.libelle}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Matière</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {controle.matiere?.nom || 'Non spécifiée'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Date de début</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatDateTime(controle.debut_controle)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Date de fin</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatDateTime(controle.fin_controle)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Durée</dt>
                  <dd className="mt-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {calculateDuration(controle.debut_controle, controle.fin_controle)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Professeur</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {controle.professeur ? `${controle.professeur.prenom} ${controle.professeur.nom}` : 'Non assigné'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Période</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {controle.periode?.nom || 'Non spécifiée'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Statut</dt>
                  <dd className="mt-1">
                    {controle.active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                        Inactif
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Instructions */}
          {controle.instructions && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Instructions</h3>
                <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{controle.instructions}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Informations de la matière */}
          {controle.matiere && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Matière</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nom</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{controle.matiere.nom}</dd>
                  </div>
                  {controle.matiere.code && (
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Code</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{controle.matiere.code}</dd>
                    </div>
                  )}
                  {controle.matiere.niveau && (
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Niveau</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{controle.matiere.niveau.nom}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </Card>
          )}

          {/* Informations du professeur */}
          {controle.professeur && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Professeur</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nom complet</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">
                      {controle.professeur.prenom} {controle.professeur.nom}
                    </dd>
                  </div>
                  {controle.professeur.email && (
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Email</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{controle.professeur.email}</dd>
                    </div>
                  )}
                  {controle.professeur.telephone && (
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Téléphone</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{controle.professeur.telephone}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </Card>
          )}

          {/* Informations de la période */}
          {controle.periode && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Période</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nom</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">{controle.periode.nom}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Date de début</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">
                      {new Date(controle.periode.date_debut).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Date de fin</dt>
                    <dd className="text-sm text-slate-900 dark:text-white">
                      {new Date(controle.periode.date_fin).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/controles/${id}/edit`)}
                  className="w-full"
                >
                  <Icon name="edit" />
                  <span className="ml-2">Modifier</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/controles')}
                  className="w-full"
                >
                  <Icon name="arrow-left" />
                  <span className="ml-2">Retour à la liste</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Informations système */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Informations système</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Créé le</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">
                    {new Date(controle.created_at).toLocaleString('fr-FR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Modifié le</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">
                    {new Date(controle.updated_at).toLocaleString('fr-FR')}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ControleShow;

