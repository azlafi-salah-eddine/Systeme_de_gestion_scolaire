import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { fraisScolaireService } from '../../services/fraisScolaireService';
import niveauService from '../../services/niveauService';
import { anneeScolaireService } from '../../services/anneeScolaireService';
import type { FraisScolaireFormData, FraisScolaire } from '../../types/paiements';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';

const FraisScolaireForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FraisScolaireFormData>({
    type: 'scolarite',
    nom: '',
    description: '',
    montant_mensuel: 0,
    niveau_id: undefined,
    obligatoire: true
  });

  const [options, setOptions] = useState({
    niveaux: [] as any[],
    anneesScolaires: [] as any[]
  });

  useEffect(() => {
    loadOptions();
    if (isEdit) {
      loadFraisScolaire();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      
      const [niveauxRes, anneesRes] = await Promise.all([
        niveauService.getNiveaux(),
        anneeScolaireService.getAll()
      ]);
      
      setOptions({
        niveaux: niveauxRes.data || [],
        anneesScolaires: anneesRes || []
      });
    } catch (error) {
      showError('Erreur lors du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadFraisScolaire = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fraisScolaireService.getFraisScolaire(parseInt(id));
      if (response.success) {
        const frais = response.data;
        setFormData({
          type: frais.type,
          nom: frais.nom,
          description: frais.description || '',
          montant_mensuel: frais.montant_mensuel,
          niveau_id: frais.niveau_id,
          obligatoire: frais.obligatoire
        });
      }
    } catch (error) {
      showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value === '' ? undefined : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (formData.montant_mensuel <= 0) newErrors.montant_mensuel = 'Le montant doit être supérieur à 0';
    if (!formData.type) newErrors.type = 'Le type est requis';
    if (!formData.niveau_id) newErrors.niveau_id = 'Le niveau est obligatoire';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await fraisScolaireService.updateFraisScolaire(parseInt(id!), formData);
        showSuccess('Frais scolaire mis à jour avec succès');
      } else {
        await fraisScolaireService.createFraisScolaire(formData);
        showSuccess('Frais scolaire créé avec succès');
      }
      
      navigate('/frais-scolaires');
    } catch (error: any) {
      console.error('Error details:', error);
      
      // Parse error response if it's a string
      let errorData = error.response?.data;
      if (typeof errorData === 'string') {
        try {
          const cleaned = errorData.replace(/^\uFEFF/, '').trim();
          if (cleaned.startsWith('{')) {
            errorData = JSON.parse(cleaned);
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
      }
      
      const errorMessage = errorData?.message || error.message || 'Une erreur est survenue';
      
      if (errorMessage) {
        showError('Erreur', errorMessage);
      }
      
      // Afficher aussi les erreurs de validation spécifiques
      if (errorData?.errors) {
        const validationErrors = errorData.errors;
        Object.keys(validationErrors).forEach(key => {
          if (validationErrors[key]) {
            const errorValue = Array.isArray(validationErrors[key]) 
              ? validationErrors[key][0] 
              : validationErrors[key];
            setErrors(prev => ({ ...prev, [key]: errorValue }));
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={isEdit ? 'Modifier Frais Scolaire' : 'Nouveau Frais Scolaire'}
        subtitle={isEdit ? 'Modifier les informations du frais scolaire' : 'Créer un nouveau frais scolaire'}
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Paiements Élèves', link: '/paiements-eleves' },
          { label: 'Frais Scolaires', link: '/frais-scolaires' },
          { label: isEdit ? 'Modifier' : 'Nouveau', link: '#' }
        ]}
      />

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEdit ? 'Modifier le frais scolaire' : 'Créer un nouveau frais scolaire'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEdit ? 'Modifiez les informations du frais scolaire' : 'Remplissez les informations pour créer un nouveau frais scolaire'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Type */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type de frais *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.type ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="scolarite">Scolarité</option>
                  <option value="cantine">Cantine</option>
                  <option value="transport">Transport</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type}</p>}
              </div>

              {/* Nom */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.nom ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: Frais de scolarité mensuel"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nom}</p>}
              </div>

              {/* Montant mensuel */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Montant mensuel (MAD) *
                </label>
                <input
                  type="number"
                  name="montant_mensuel"
                  value={formData.montant_mensuel}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.montant_mensuel ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
                {errors.montant_mensuel && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.montant_mensuel}</p>}
              </div>

              {/* Niveau */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niveau *
                </label>
                <select
                  name="niveau_id"
                  value={formData.niveau_id || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.niveau_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner un niveau</option>
                  {options.niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))}
                </select>
                {errors.niveau_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.niveau_id}</p>}
              </div>

              {/* Classe removed: pricing now at niveau/global only */}
            </div>

            {/* Obligatoire */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="obligatoire"
                checked={formData.obligatoire}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Frais obligatoire
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Description du frais scolaire..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/frais-scolaires')}
                className="px-6"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="px-8 text-white bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    {isEdit ? 'Mise à jour...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Icon name="plus" size="sm" className="mr-2" />
                    {isEdit ? 'Mettre à jour' : 'Créer le frais scolaire'}
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

export default FraisScolaireForm;
