import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { controleService, type Controle, type CreateControleData } from '../../services/controleService';
import api from '../../services/api';

interface Matiere {
  id: number;
  nom: string;
  code?: string;
  niveau_id?: number;
  niveau?: {
    id: number;
    nom: string;
  };
}

interface Niveau {
  id: number;
  nom: string;
}

const ControleEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();
  const navigate = useNavigate();
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [allMatieres, setAllMatieres] = useState<Matiere[]>([]);
  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateControleData>({
    libelle: '',
    debut_controle: '',
    fin_controle: '',
    matiere_id: 0,
    professeur_id: 0,
    periode_id: 0,
    instructions: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Filter matieres when allMatieres or formData.matiere_id changes
  useEffect(() => {
    if (formData.matiere_id && allMatieres.length > 0) {
      const currentMatiere = allMatieres.find(m => m.id === formData.matiere_id);
      if (currentMatiere?.niveau_id) {
        const filteredMatieres = allMatieres.filter(m => m.niveau_id === currentMatiere.niveau_id);
        setMatieres(filteredMatieres);
      }
    }
  }, [formData.matiere_id, allMatieres]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load controle
      const controleResponse = await controleService.getControle(parseInt(id!));
      if (!controleResponse.success || !controleResponse.data) {
        showError('Erreur', 'Contrôle non trouvé');
        navigate('/controles');
        return;
      }

      const controle: Controle = controleResponse.data;
      
      // Convert datetime-local format
      const debutDate = new Date(controle.debut_controle);
      const finDate = new Date(controle.fin_controle);
      const debutLocal = new Date(debutDate.getTime() - debutDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const finLocal = new Date(finDate.getTime() - finDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      setFormData({
        libelle: controle.libelle || '',
        debut_controle: debutLocal,
        fin_controle: finLocal,
        matiere_id: controle.matiere_id || 0,
        professeur_id: controle.professeur_id || 0,
        periode_id: controle.periode_id || 0,
        instructions: controle.instructions || ''
      });

      // Load reference data
      await Promise.all([
        loadNiveaux(),
        loadMatieres(),
        loadProfesseurs(),
        loadPeriodes()
      ]);

      // Filter matieres based on controle's matiere niveau
      // This will be handled by the useEffect after allMatieres is loaded
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur lors du chargement');
      navigate('/controles');
    } finally {
      setLoading(false);
    }
  };

  const loadNiveaux = async () => {
    try {
      const response = await api.get('/v1/niveaux?active=true');
      setNiveaux(response.data?.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des niveaux:', error);
    }
  };

  const loadMatieres = async () => {
    try {
      const response = await api.get('/v1/matieres?active=true&with=niveau');
      const matieresData = response.data?.data || [];
      setAllMatieres(matieresData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  const loadProfesseurs = async () => {
    try {
      const response = await api.get('/v1/professeurs?active=true');
      setProfesseurs(response.data?.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des professeurs:', error);
    }
  };

  const loadPeriodes = async () => {
    try {
      const response = await api.get('/v1/periodes?active=true');
      setPeriodes(response.data?.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des périodes:', error);
    }
  };

  const handleInputChange = (field: keyof CreateControleData | 'niveau_id', value: any) => {
    if (field === 'niveau_id') {
      // Handle niveau change - filter matieres
      if (value) {
        const niveauId = parseInt(value);
        const filteredMatieres = allMatieres.filter(matiere => 
          matiere.niveau_id === niveauId
        );
        setMatieres(filteredMatieres);
        // Reset matiere selection when niveau changes
        setFormData(prev => ({ ...prev, matiere_id: '' }));
      } else {
        setMatieres([]);
        setFormData(prev => ({ ...prev, matiere_id: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.libelle.trim()) {
      newErrors.libelle = 'Le libellé est requis';
    }
    if (!formData.debut_controle) {
      newErrors.debut_controle = 'La date de début est requise';
    }
    if (!formData.fin_controle) {
      newErrors.fin_controle = 'La date de fin est requise';
    }
    if (formData.debut_controle && formData.fin_controle && new Date(formData.debut_controle) >= new Date(formData.fin_controle)) {
      newErrors.fin_controle = 'La date de fin doit être après la date de début';
    }
    if (!formData.matiere_id || formData.matiere_id === 0) {
      newErrors.matiere_id = 'La matière est requise';
    }
    if (!formData.professeur_id || formData.professeur_id === 0) {
      newErrors.professeur_id = 'Le professeur est requis';
    }
    if (!formData.periode_id || formData.periode_id === 0) {
      newErrors.periode_id = 'La période est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!anneeActive) {
      showError('Erreur', 'Aucune année scolaire active trouvée. Veuillez d\'abord activer une année scolaire.');
      return;
    }

    try {
      setSaving(true);
      
      const dataToSend = {
        ...formData,
        annee_scolaire_id: anneeActive.id
      };
      
      const response = await controleService.updateControle(parseInt(id!), dataToSend);

      if (response.success) {
        showSuccess('Succès', 'Contrôle modifié avec succès');
        navigate(`/controles/${id}`);
      } else {
        showError('Erreur', response.message || 'Erreur lors de la modification');
      }
    } catch (error: any) {
      console.error('Error updating controle:', error);
      showError('Erreur', error?.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/controles/${id}`);
  };

  // Get niveau from matiere
  const currentNiveauId = formData.matiere_id 
    ? allMatieres.find(m => m.id === formData.matiere_id)?.niveau_id 
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Modifier le Contrôle"
        subtitle="Modifiez les informations du contrôle"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Contrôles', link: '/controles' },
          { label: 'Détails', link: `/controles/${id}` },
          { label: 'Modifier', link: `/controles/${id}/edit` }
        ]}
      />

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Modifier le contrôle
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Modifiez les informations du contrôle d'évaluation
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => handleInputChange('libelle', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.libelle ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: Devoir surveillé, Oral, TP..."
                />
                {errors.libelle && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.libelle}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niveau
                </label>
                <select
                  value={currentNiveauId || ''}
                  onChange={(e) => handleInputChange('niveau_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Sélectionnez un niveau pour filtrer les matières
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Période *
                </label>
                <select
                  value={formData.periode_id || ''}
                  onChange={(e) => handleInputChange('periode_id', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.periode_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner une période</option>
                  {periodes.map((periode) => (
                    <option key={periode.id} value={periode.id}>
                      {periode.nom} ({new Date(periode.date_debut).toLocaleDateString('fr-FR')} - {new Date(periode.date_fin).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
                {errors.periode_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.periode_id}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date de début *
                </label>
                <input
                  type="datetime-local"
                  value={formData.debut_controle}
                  onChange={(e) => handleInputChange('debut_controle', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.debut_controle ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.debut_controle && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.debut_controle}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date de fin *
                </label>
                <input
                  type="datetime-local"
                  value={formData.fin_controle}
                  onChange={(e) => handleInputChange('fin_controle', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.fin_controle ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.fin_controle && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fin_controle}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Matière *
                </label>
                <select
                  value={formData.matiere_id || ''}
                  onChange={(e) => handleInputChange('matiere_id', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.matiere_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!currentNiveauId}
                >
                  <option value="">
                    {!currentNiveauId ? 'Veuillez d\'abord sélectionner un niveau' : 'Sélectionner une matière'}
                  </option>
                  {matieres.map((matiere) => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom}
                    </option>
                  ))}
                </select>
                {errors.matiere_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.matiere_id}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Professeur *
                </label>
                <select
                  value={formData.professeur_id || ''}
                  onChange={(e) => handleInputChange('professeur_id', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.professeur_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner un professeur</option>
                  {professeurs.map((professeur) => (
                    <option key={professeur.id} value={professeur.id}>
                      {professeur.prenom} {professeur.nom}
                    </option>
                  ))}
                </select>
                {errors.professeur_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.professeur_id}</p>}
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                placeholder="Instructions pour le contrôle..."
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="px-6"
                disabled={saving}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="px-8 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Icon name="check" size="sm" className="mr-2" />
                    Modifier le contrôle
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ControleEdit;

