import React, { useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { professeurService } from '../../services/professeurService';
import type { ProfesseurPayload } from '../../services/professeurService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

const ProfesseurNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<ProfesseurPayload>({ nom: '', prenom: '', email: '', telephone: '', active: true });
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

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setFieldErrors({});
      setCreatedCredentials(null);
      
      // Validation stricte des champs requis côté backend (email généré automatiquement)
      if (!form.nom || !form.prenom || !form.diplome || form.anciennete === undefined || form.anciennete === null || form.anciennete < 0 || !form.telephone || !form.adresse || !form.date_embauche || form.salaire === undefined || form.salaire === null || form.salaire < 0) {
        setError('Veuillez remplir tous les champs requis (nom, prénom, diplôme, ancienneté, téléphone, adresse, date d\'embauche, salaire).');
        setSaving(false);
        return;
      }
      
      const res = await professeurService.create(form as any);
      
      // Afficher les identifiants générés
      if ((res.data as any).credentials) {
        setCreatedCredentials((res.data as any).credentials);
      }
      
      showSuccess('Créé', 'Le professeur a été créé avec succès.');
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate(`/professeurs/${res.data.id}`);
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
      } else {
        errorMessage = e?.message || errorMessage;
      }
      
      setError(errorMessage);
      showError('Erreur', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead title="Nouveau professeur" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Professeurs', link: '/professeurs' }, { label: 'Nouveau', link: '/professeurs/new' }]} />
      <Card>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{error}</div>}
          
          <div className="p-3 text-sm text-blue-700 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
            <p>L'email de connexion et le mot de passe seront générés automatiquement.</p>
           
          </div>
          
          {createdCredentials && (
            <div className="p-4 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/30 dark:border-green-800">
              <h3 className="mb-2 font-semibold text-green-800 dark:text-green-200">Professeur créé avec succès!</h3>
              <p className="mb-2 text-sm text-green-700 dark:text-green-300">Identifiants de connexion générés:</p>
              <div className="p-3 bg-white border border-green-200 rounded dark:bg-gray-800 dark:border-green-700">
                <p className="text-sm text-gray-900 dark:text-white"><span className="font-medium">Email de connexion:</span> {createdCredentials.email}</p>
                <p className="text-sm text-gray-900 dark:text-white"><span className="font-medium">Mot de passe:</span> {createdCredentials.password}</p>
              </div>
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">Notez ces identifiants de connexion. Redirection dans 3 secondes...</p>
            </div>
          )}
          
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={save}>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Prénom *</label>
              <input 
                value={form.prenom || ''} 
                onChange={e => {
                  setForm(f => ({ ...f, prenom: e.target.value }));
                  if (fieldErrors.prenom) setFieldErrors({ ...fieldErrors, prenom: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.prenom ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.prenom && <p className="mt-1 text-xs text-red-500">{fieldErrors.prenom}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Nom *</label>
              <input 
                value={form.nom || ''} 
                onChange={e => {
                  setForm(f => ({ ...f, nom: e.target.value }));
                  if (fieldErrors.nom) setFieldErrors({ ...fieldErrors, nom: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.nom ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.nom && <p className="mt-1 text-xs text-red-500">{fieldErrors.nom}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Email de contact</label>
              <input 
                type="email"
                value={form.email || ''} 
                onChange={e => {
                  setForm(f => ({ ...f, email: e.target.value }));
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="email@exemple.com (optionnel)"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Téléphone *</label>
              <input 
                type="tel"
                value={form.telephone || ''} 
                onChange={handleTelephoneChange}
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.telephone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0612345678"
                maxLength={20}
                required
              />
              {fieldErrors.telephone && <p className="mt-1 text-xs text-red-500">{fieldErrors.telephone}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 text-xs text-slate-600">Adresse *</label>
              <input 
                value={form.adresse || ''} 
                onChange={e => {
                  setForm(f => ({ ...f, adresse: e.target.value }));
                  if (fieldErrors.adresse) setFieldErrors({ ...fieldErrors, adresse: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.adresse ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.adresse && <p className="mt-1 text-xs text-red-500">{fieldErrors.adresse}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Diplôme *</label>
              <input 
                value={form.diplome || ''} 
                onChange={e => {
                  setForm(f => ({ ...f, diplome: e.target.value }));
                  if (fieldErrors.diplome) setFieldErrors({ ...fieldErrors, diplome: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.diplome ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.diplome && <p className="mt-1 text-xs text-red-500">{fieldErrors.diplome}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Ancienneté (années) *</label>
              <input 
                type="number" 
                min="0"
                value={form.anciennete ?? ''} 
                onChange={e => {
                  setForm(f => ({ ...f, anciennete: Number(e.target.value) }));
                  if (fieldErrors.anciennete) setFieldErrors({ ...fieldErrors, anciennete: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.anciennete ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.anciennete && <p className="mt-1 text-xs text-red-500">{fieldErrors.anciennete}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Date d'embauche *</label>
              <input 
                type="date" 
                value={form.date_embauche || ''} 
                onChange={e => {
                  const selectedDate = e.target.value;
                  const today = new Date().toISOString().split('T')[0];
                  // Ne permettre que les dates d'aujourd'hui ou avant
                  if (selectedDate <= today) {
                    setForm(f => ({ ...f, date_embauche: selectedDate }));
                    if (fieldErrors.date_embauche) setFieldErrors({ ...fieldErrors, date_embauche: '' });
                  }
                }} 
                max={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.date_embauche ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.date_embauche && <p className="mt-1 text-xs text-red-500">{fieldErrors.date_embauche}</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs text-slate-600">Salaire *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={form.salaire ?? ''} 
                onChange={e => {
                  setForm(f => ({ ...f, salaire: Number(e.target.value) }));
                  if (fieldErrors.salaire) setFieldErrors({ ...fieldErrors, salaire: '' });
                }} 
                className={`w-full border rounded px-3 py-2 text-sm ${fieldErrors.salaire ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {fieldErrors.salaire && <p className="mt-1 text-xs text-red-500">{fieldErrors.salaire}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2 md:col-span-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/professeurs')}>
                <Icon name="close" />
                <span className="ml-2">Annuler</span>
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                <Icon name="check" />
                <span className="ml-2">{saving ? 'Création...' : 'Enregistrer'}</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ProfesseurNew;
