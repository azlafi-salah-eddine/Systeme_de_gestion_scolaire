import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { classeService, type Classe, type ClasseUpdatePayload } from '../../services/classeService';
import { anneeScolaireService, type AnneeScolaire } from '../../services/anneeScolaireService';
import { useAuth } from '../../contexts/AuthContext';
import niveauService, { type NiveauItem } from '../../services/niveauService';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useNotification } from '../../contexts/NotificationContext';

const ClasseEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const { anneeActive, refreshAnneeActive } = useAnneeScolaire();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);

  const [formData, setFormData] = useState<ClasseUpdatePayload>({
    nom: '',
    niveau_id: 0,
    annee_scolaire_id: 0,
    section: '',
    capacite: 30,
    active: true
  });

  useEffect(() => {
    if (id) {
      void loadAll();
    }
  }, [id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      await refreshAnneeActive().catch(() => undefined);
      const [annees, classeRes, nivs] = await Promise.all([
        anneeScolaireService.getAll(),
        classeService.show(parseInt(id!)),
        niveauService.list(),
      ]);
      setAnneesScolaires(annees);
      setNiveaux(nivs);
      setClasse(classeRes.data);
      setFormData({
        nom: classeRes.data.nom,
        niveau_id: typeof classeRes.data.niveau === 'object' && classeRes.data.niveau ? classeRes.data.niveau.id : classeRes.data.niveau_id || 0,
        annee_scolaire_id: classeRes.data.annee_scolaire_id || 0,
        section: classeRes.data.section,
        capacite: classeRes.data.capacite,
        active: classeRes.data.active
      });
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      return {
        ...prev,
        [name]: type === 'number' ? (value === '' ? prev[name as keyof typeof prev] : parseInt(value) || 0) : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      } as any;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (anneeActive && formData.annee_scolaire_id && formData.annee_scolaire_id !== anneeActive.id) {
      setError("Vous ne pouvez modifier que les classes de l'année scolaire active.");
      return;
    }
    if (!formData.nom || !formData.niveau_id || formData.niveau_id === 0 || !formData.section || !formData.annee_scolaire_id) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await classeService.update(parseInt(id!), formData);
      showSuccess('Classe mise à jour', 'La classe a été mise à jour avec succès.');
      navigate('/classes');
    } catch (e: any) {
      const message = e.message || 'Erreur lors de la modification de la classe';
      setError(message);
      showError('Erreur', message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate('/classes');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
          </div>
      </div>
    );
  }

  if (error && !classe) {
    return (
      <div className="space-y-6">
        <PageHead title="Erreur" />
        <div className="p-4 border border-red-200 rounded-md bg-red-50">{error}</div>
      </div>
    );
  }

  if (!classe) {
    return (
      <div className="space-y-6">
        <PageHead title="Classe non trouvée" />
        <div className="py-12 text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Classe non trouvée</h3>
          <div className="mt-6">
            <button onClick={() => navigate('/classes')} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Retour aux classes</button>
          </div>
        </div>
      </div>
    );
  }

  const disabledForYear = !!(anneeActive && classe.annee_scolaire_id && classe.annee_scolaire_id !== anneeActive.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHead 
        title={`Modifier ${classe.nom_complet}`}
        subtitle="Modification de la classe"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Classes', link: '/classes' },
          { label: classe.nom_complet, link: `/classes/${id}` },
          { label: 'Modifier', link: `/classes/${id}/edit` }
        ]}
      />

      {disabledForYear && (
        <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.516 11.59c.75 1.335-.213 2.986-1.742 2.986H3.483c-1.53 0-2.492-1.65-1.743-2.985L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Classe hors de l'année active</h3>
              <div className="mt-2 text-sm text-yellow-700">Cette classe n'appartient pas à l'année scolaire active. Les modifications sont désactivées.</div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom de la classe *</label>
              <input type="text" name="nom" id="nom" value={formData.nom} onChange={handleInputChange} required disabled={disabledForYear} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Ex: 6ème A" />
            </div>
            <div>
              <label htmlFor="niveau_id" className="block text-sm font-medium text-gray-700">Niveau *</label>
              <select name="niveau_id" id="niveau_id" value={formData.niveau_id} onChange={handleInputChange} required disabled={disabledForYear} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value={0}>Sélectionner un niveau</option>
                {niveaux.filter((n: any) => n.active !== false).map(n => (
                  <option key={n.id} value={n.id}>{n.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section *</label>
              <input type="text" name="section" id="section" value={formData.section} onChange={handleInputChange} required disabled={disabledForYear} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Ex: A, B, C" />
            </div>
            <div>
              <label htmlFor="annee_scolaire_id" className="block text-sm font-medium text-gray-700">Année Scolaire *</label>
              <select name="annee_scolaire_id" id="annee_scolaire_id" value={formData.annee_scolaire_id} onChange={handleInputChange} required disabled className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value={0}>Sélectionner une année scolaire</option>
                {anneesScolaires.map(annee => (
                  <option key={annee.id} value={annee.id}>{annee.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="capacite" className="block text-sm font-medium text-gray-700">Capacité *</label>
              <input type="number" name="capacite" id="capacite" value={formData.capacite} onChange={handleInputChange} required min="1" max="50" disabled={disabledForYear} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              <p className="mt-1 text-sm text-gray-500">Nombre maximum d'élèves (1-50)</p>
              {formData.capacite && classe && formData.capacite < classe.nombre_eleves && (
                <p className="mt-1 text-sm text-red-600">⚠️ La nouvelle capacité est inférieure au nombre d'élèves actuels</p>
              )}
            </div>
          </div>
        </div>

      </Card>
      <div className="flex justify-end space-x-3">
          <Button type="button" onClick={handleCancel} variant="secondary">Annuler</Button>
          <Button type="submit" disabled={saving || disabledForYear} variant="primary" >{saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}</Button>
        </div>
    </form>
  );
};

export default ClasseEdit;

