import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const AdminNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    type: 'admin' as 'admin',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null);

  const handleTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Ne garder que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    setForm({ ...form, telephone: numericValue });
    if (fieldErrors.telephone) {
      setFieldErrors({ ...fieldErrors, telephone: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!form.nom.trim()) {
      errors.nom = 'Le nom est obligatoire.';
    }
    if (!form.prenom.trim()) {
      errors.prenom = 'Le prénom est obligatoire.';
    }
    if (!form.telephone.trim()) {
      errors.telephone = 'Le téléphone est obligatoire.';
    } else if (!/^[0-9]+$/.test(form.telephone)) {
      errors.telephone = 'Le téléphone doit contenir uniquement des chiffres.';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire avant de soumettre
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setFieldErrors({});
      setCreatedCredentials(null);
      const res = await api.post('/admins', form);
      showSuccess('Succès', 'Administrateur créé avec succès');
      
      // Afficher les identifiants générés
      if (res.data.credentials) {
        setCreatedCredentials(res.data.credentials);
      }
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate('/settings/admins');
      }, 3000);
    } catch (e: any) {
      const responseData = e?.response?.data;
      let errorMessage = 'Erreur lors de la création';
      
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
      showError('Erreur', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead title="Nouvel Administrateur" subtitle="Créer un nouvel administrateur" breadcrumb={[{ label: 'Paramètres', link: '#' }, { label: 'Administrateurs', link: '/settings/admins' }, { label: 'Nouveau', link: '/settings/admins/new' }]} />
      <Card>
        <div className="p-6">
          {error && <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{error}</div>}
          
          <div className="p-3 mb-4 text-sm text-blue-700 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
            <p>L'email et le mot de passe seront générés automatiquement.</p>
          </div>
          
          {createdCredentials && (
            <div className="p-4 mb-4 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/30 dark:border-green-800">
              <h3 className="mb-2 font-semibold text-green-800 dark:text-green-200">Administrateur créé avec succès!</h3>
              <p className="mb-2 text-sm text-green-700 dark:text-green-300">Identifiants générés:</p>
              <div className="p-3 bg-white border border-green-200 rounded dark:bg-gray-800 dark:border-green-700">
                <p className="text-sm text-gray-900 dark:text-white"><span className="font-medium">Email:</span> {createdCredentials.email}</p>
                <p className="text-sm text-gray-900 dark:text-white"><span className="font-medium">Mot de passe:</span> {createdCredentials.password}</p>
              </div>
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">Notez ces identifiants. Redirection dans 3 secondes...</p>
            </div>
          )}
          
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
              <input 
                className={`border rounded px-3 py-2 w-full ${fieldErrors.nom ? 'border-red-500' : 'border-gray-300'}`} 
                placeholder="Nom" 
                value={form.nom} 
                onChange={(e) => {
                  setForm({ ...form, nom: e.target.value });
                  if (fieldErrors.nom) setFieldErrors({ ...fieldErrors, nom: '' });
                }} 
                required
              />
              {fieldErrors.nom && <p className="mt-1 text-xs text-red-500">{fieldErrors.nom}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Prénom *</label>
              <input 
                className={`border rounded px-3 py-2 w-full ${fieldErrors.prenom ? 'border-red-500' : 'border-gray-300'}`} 
                placeholder="Prénom" 
                value={form.prenom} 
                onChange={(e) => {
                  setForm({ ...form, prenom: e.target.value });
                  if (fieldErrors.prenom) setFieldErrors({ ...fieldErrors, prenom: '' });
                }} 
                required
              />
              {fieldErrors.prenom && <p className="mt-1 text-xs text-red-500">{fieldErrors.prenom}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone *</label>
              <input 
                type="tel"
                className={`border rounded px-3 py-2 w-full ${fieldErrors.telephone ? 'border-red-500' : 'border-gray-300'}`} 
                placeholder="0612345678" 
                value={form.telephone} 
                onChange={handleTelephoneChange}
                maxLength={20}
                required
              />
              {fieldErrors.telephone && <p className="mt-1 text-xs text-red-500">{fieldErrors.telephone}</p>}
            </div>
        
            <div className="flex items-center gap-2 pt-2 md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Création...' : 'Créer'}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/settings/admins')}>Annuler</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AdminNew;


