import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const AdminEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admins/${id}`);
        setUser(res.data?.data);
      } catch (e: any) {
        const errorMessage = e?.response?.data?.message || 'Erreur de chargement';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const handleTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Ne garder que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    setUser({ ...user, telephone: numericValue });
    if (fieldErrors.telephone) {
      setFieldErrors({ ...fieldErrors, telephone: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!user.nom?.trim()) {
      errors.nom = 'Le nom est obligatoire.';
    }
    if (!user.prenom?.trim()) {
      errors.prenom = 'Le prénom est obligatoire.';
    }
    // L'email n'est pas validé car il est en lecture seule et ne peut pas être modifié
    if (!user.telephone?.trim()) {
      errors.telephone = 'Le téléphone est obligatoire.';
    } else if (!/^[0-9]+$/.test(user.telephone)) {
      errors.telephone = 'Le téléphone doit contenir uniquement des chiffres.';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire avant de soumettre
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setFieldErrors({});
      await api.put(`/admins/${id}`, {
        nom: user.nom,
        prenom: user.prenom,
        // L'email n'est pas envoyé car il ne peut pas être modifié
        telephone: user.telephone,
      });
      showSuccess('Succès', 'Administrateur modifié avec succès');
      navigate(`/settings/admins/${id}`);
    } catch (e: any) {
      const responseData = e?.response?.data;
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      // Gérer les erreurs de validation
      if (responseData?.errors) {
        const errors: Record<string, string> = {};
        Object.keys(responseData.errors).forEach((key) => {
          errors[key] = Array.isArray(responseData.errors[key]) 
            ? responseData.errors[key][0] 
            : responseData.errors[key];
        });
        setFieldErrors(errors);
        
        // Message principal depuis les erreurs
        const firstError = Object.values(errors)[0];
        errorMessage = firstError || responseData?.message || errorMessage;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier Administrateur" 
        subtitle="Mettre à jour les informations" 
        breadcrumb={[
          { label: 'Paramètres', link: '#' }, 
          { label: 'Administrateurs', link: '/settings/admins' },
          { label: user?.nom && user?.prenom ? `${user.nom} ${user.prenom}` : user?.nom || user?.prenom || 'Modifier', link: '#' }
        ]} 
      />
      <Card>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 mb-4 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          ) : (
            user && (
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom *
                  </label>
                  <input 
                    className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500 ${fieldErrors.nom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Nom" 
                    value={user.nom || ''} 
                    onChange={(e) => {
                      setUser({ ...user, nom: e.target.value });
                      if (fieldErrors.nom) setFieldErrors({ ...fieldErrors, nom: '' });
                    }} 
                    required
                  />
                  {fieldErrors.nom && <p className="mt-1 text-xs text-red-500">{fieldErrors.nom}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prénom *
                  </label>
                  <input 
                    className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500 ${fieldErrors.prenom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Prénom" 
                    value={user.prenom || ''} 
                    onChange={(e) => {
                      setUser({ ...user, prenom: e.target.value });
                      if (fieldErrors.prenom) setFieldErrors({ ...fieldErrors, prenom: '' });
                    }} 
                    required
                  />
                  {fieldErrors.prenom && <p className="mt-1 text-xs text-red-500">{fieldErrors.prenom}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Généré automatiquement)</span>
                  </label>
                  <input 
                    className="w-full border rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                    placeholder="Email" 
                    type="email" 
                    value={user.email || ''} 
                    readOnly
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">L'email est généré automatiquement et ne peut pas être modifié.</p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone *</label>
                  <input 
                    type="tel"
                    className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500 ${fieldErrors.telephone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="0612345678" 
                    value={user.telephone || ''} 
                    onChange={handleTelephoneChange}
                    maxLength={20}
                    required
                  />
                  {fieldErrors.telephone && <p className="mt-1 text-xs text-red-500">{fieldErrors.telephone}</p>}
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                  <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
                </div>
              </form>
            )
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminEdit;


