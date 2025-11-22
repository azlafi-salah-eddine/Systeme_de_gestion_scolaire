import React, { useState, useEffect } from 'react';
import PageHead from '../components/ui/PageHead';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { accountService } from '../services/accountService';
import type { UserProfile } from '../services/accountService';
import { Icon } from '../components';

const Account: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [hasChanges, setHasChanges] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileRes = await accountService.getProfile();
      
      setProfile(profileRes.data);
      setProfileForm({
        nom: profileRes.data.nom || profileRes.data.nom_complet?.split(' ')[0] || '',
        prenom: profileRes.data.prenom || profileRes.data.nom_complet?.split(' ').slice(1).join(' ') || '',
        email: profileRes.data.email,
        telephone: profileRes.data.telephone || ''
      });
      setHasChanges(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validation côté client (email n'est plus nécessaire car en lecture seule)

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Envoyer les champs profil (sans l'email, car il ne peut pas être modifié)
      const response = await accountService.updateProfile({
        nom: profileForm.nom,
        prenom: profileForm.prenom,
        email: profile?.email || profileForm.email,
        telephone: profileForm.telephone || undefined
      });
      
      if (response.success) {
        setSuccess('Profil mis à jour avec succès');
        setHasChanges(false);
        await loadData(); // Reload data
      } else {
        setError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (e: any) {
      
      // Gestion des erreurs de validation du backend
      if (e.response?.data?.errors) {
        const errors = e.response.data.errors;
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(e.response?.data?.message || e.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await accountService.updatePassword(passwordForm);
      setSuccess('Mot de passe mis à jour avec succès');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Mon Compte" 
          subtitle="Gestion de votre compte utilisateur"
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Mon Compte', link: '/account' }
          ]}
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title="Mon Compte" 
        subtitle="Gestion de votre compte utilisateur"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Mon Compte', link: '/account' }
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profil', icon: 'user' },
            { id: 'password', label: 'Mot de passe', icon: 'lock' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <Icon name="error" className="text-red-400 mr-3" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <Icon name="success" className="text-green-400 mr-3" />
            <div className="text-sm text-green-700">{success}</div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Header avec avatar et informations principales */}
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                    <span className="text-2xl font-bold text-white">
                      {(profile?.nom || profile?.prenom) ? 
                        (profile.nom ? profile.nom[0] : profile.prenom?.[0] || 'U').toUpperCase() : 
                        (profile?.email?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Informations principales */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {profile?.nom && profile?.prenom ? `${profile.nom} ${profile.prenom}` : 
                     profile?.nom || profile?.prenom || profile?.name || profile?.nom_complet || 'Utilisateur'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{profile?.email}</p>
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-400 shadow-sm">
                      <Icon name="shield" size="sm" className="mr-1" />
                      {(() => {
                        const role = profile?.role?.nom;
                        switch (role) {
                          case 'super_admin': return 'Super Administrateur';
                          case 'admin': return 'Administrateur';
                          case 'parent': return 'Parent';
                          case 'prof': return 'Professeur';
                          case 'professeur': return 'Professeur';
                          case 'eleve': return 'Élève';
                          case 'student': return 'Élève';
                          case 'user': return 'Utilisateur';
                          default: return role || 'Sans rôle';
                        }
                      })()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Indicateur de modifications */}
                {hasChanges && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 shadow-sm">
                      <Icon name="edit" size="sm" className="mr-1" />
                      Modifications en cours
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Formulaire de modification */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Modifier les informations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mettez à jour votre nom, prénom, email et téléphone</p>
                </div>
                <div className="flex items-center text-sm text-gray-500"></div>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      className="block w-full pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg shadow-sm focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500 transition-colors"
                      placeholder="Votre nom"
                      value={profileForm.nom}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, nom: e.target.value });
                        setHasChanges(true);
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      className="block w-full pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg shadow-sm focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500 transition-colors"
                      placeholder="Votre prénom"
                      value={profileForm.prenom}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, prenom: e.target.value });
                        setHasChanges(true);
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email (lecture seule) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="mail" size="sm" className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg shadow-sm cursor-not-allowed"
                      placeholder="votre@email.com"
                      value={profileForm.email}
                      readOnly
                      disabled
                      title="L'email de connexion ne peut pas être modifié"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    L'email de connexion est généré automatiquement et ne peut pas être modifié
                  </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      className="block w-full pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg shadow-sm focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500 transition-colors"
                      placeholder="06 12 34 56 78"
                      value={profileForm.telephone}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, telephone: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    // Reset form to original values
                    if (profile) {
                      setProfileForm({
                        nom: profile.nom || profile.nom_complet?.split(' ')[0] || '',
                        prenom: profile.prenom || profile.nom_complet?.split(' ').slice(1).join(' ') || '',
                        email: profile.email,
                        telephone: profile.telephone || ''
                      });
                    }
                    setError(null);
                    setSuccess(null);
                    setHasChanges(false);
                  }}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={saving || !hasChanges}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Changer le mot de passe</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel *</label>
                <input
                  type="password"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe *</label>
                  <input
                    type="password"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500"
                    value={passwordForm.new_password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

    </div>
  );
};

export default Account;