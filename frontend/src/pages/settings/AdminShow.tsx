import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const AdminShow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [confirmResetState, setConfirmResetState] = useState({
    isOpen: false,
    loading: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admins/${id}`);
        setUser(res.data?.data);
      } catch (e: any) {
        const errorMessage = e?.response?.data?.message || 'Erreur de chargement';
        setError(errorMessage);
        showError('Erreur', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHead 
        title="Détails Administrateur" 
        subtitle="Informations complètes de l'administrateur" 
        breadcrumb={[
          { label: 'Paramètres', link: '#' }, 
          { label: 'Administrateurs', link: '/settings/admins' },
          { label: user?.nom && user?.prenom ? `${user.nom} ${user.prenom}` : user?.nom || user?.prenom || user?.nom_complet || user?.name || 'Détails', link: '#' }
        ]}
        actions={[
          { 
            label: 'Éditer', 
            link: `/settings/admins/${id}/edit`, 
            variant: 'primary',
            hidden: user?.role?.type === 'super_admin' && user?.id !== currentUser?.id
          }
        ]}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <Icon name="alert" className="h-5 w-5 text-red-400 dark:text-red-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erreur</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Card>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </Card>
      ) : user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <Icon name="user" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.nom && user.prenom ? `${user.nom} ${user.prenom}` : user.nom || user.prenom || user.nom_complet || user.name || 'Sans nom'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    <div className="mt-2">
                      {user.role && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.role.type === 'super_admin'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {user.role.type === 'super_admin' ? 'Super Admin' : 'Admin'}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs opacity-75">(Vous)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations personnelles</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{user.nom || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Prénom</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{user.prenom || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{user.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{user.telephone || '-'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations système</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rôle principal</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {user.role ? (
                            user.role.type === 'super_admin' ? 'Super Administrateur' : 'Administrateur'
                          ) : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Créé le</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière modification</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {user.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : '-'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </Card>

            {/* Informations de connexion */}
            <Card className="mt-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Icon name="lock" className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Informations de connexion
                  </h3>
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                  >
                    <Icon name={showCredentials ? "eye-off" : "eye"} className="w-4 h-4" />
                    {showCredentials ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                
                {showCredentials && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email de connexion</dt>
                        <dd className="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                          {user.email || '-'}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mot de passe</dt>
                        <dd className="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                          {user.temp_password || 'Non disponible'}
                        </dd>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <Icon name="info" className="w-3 h-3 inline mr-1" />
                        Ces identifiants ont été générés automatiquement lors de la création du compte.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmResetState({ isOpen: true, loading: false })}
                          disabled={confirmResetState.loading}
                        className="w-full"
                      >
                        <Icon name="refresh" className="w-4 h-4 mr-2" />
                        Réinitialiser le mot de passe
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  {!(user.role?.type === 'super_admin' && user.id !== currentUser?.id) && (
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => navigate(`/settings/admins/${id}/edit`)}
                    >
                      <Icon name="edit" className="w-4 h-4 mr-2" />
                      Éditer le profil
                    </Button>
                  )}
                  {user.role?.type === 'super_admin' && user.id !== currentUser?.id && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                      <p className="font-medium mb-1">Super Administrateur</p>
                      <p className="text-xs">Les super administrateurs ne peuvent pas être modifiés.</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => navigate('/settings/admins')}
                  >
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    Retour à la liste
                  </Button>

                  {user.id !== currentUser?.id && user.role?.type !== 'super_admin' && (
                    <Button 
                      variant="danger" 
                      className="w-full"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer "${user.nom && user.prenom ? `${user.nom} ${user.prenom}` : user.nom || user.prenom || user.nom_complet || user.name || user.email}" ?`)) {
                          // TODO: Implémenter la suppression
                        }
                      }}
                    >
                      <Icon name="trash" className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                  {user.role?.type === 'super_admin' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
                      <p className="font-medium mb-1">Protection</p>
                      <p className="text-xs">Les super administrateurs ne peuvent pas être supprimés.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Confirmation Modal pour Reset Password */}
      <ConfirmationModal
        isOpen={confirmResetState.isOpen}
        onClose={() => setConfirmResetState({ isOpen: false, loading: false })}
        onConfirm={async () => {
          try {
            setConfirmResetState(prev => ({ ...prev, loading: true }));
            setError(null);
            const res = await api.post(`/admins/${id}/reset-password`);
            if (res.data.success) {
              showSuccess('Succès', 'Mot de passe réinitialisé avec succès');
              // Recharger les données de l'utilisateur
              const userRes = await api.get(`/admins/${id}`);
              setUser(userRes.data?.data);
              setShowCredentials(true); // Afficher les identifiants pour voir le nouveau mot de passe
              setConfirmResetState({ isOpen: false, loading: false });
            }
          } catch (e: any) {
            const errorMessage = e?.response?.data?.message || 'Erreur lors de la réinitialisation';
            setError(errorMessage);
            showError('Erreur', errorMessage);
            setConfirmResetState(prev => ({ ...prev, loading: false }));
          }
        }}
        title="Réinitialiser le mot de passe"
        message="Êtes-vous sûr de vouloir réinitialiser le mot de passe ? Un nouveau mot de passe sera généré automatiquement."
        confirmText="Oui, réinitialiser"
        cancelText="Annuler"
        type="warning"
        loading={confirmResetState.loading}
      />
    </div>
  );
};

export default AdminShow;


