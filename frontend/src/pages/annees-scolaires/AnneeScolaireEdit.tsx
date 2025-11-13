import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { anneeScolaireService, type AnneeScolaire } from '../../services/anneeScolaireService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';

const AnneeScolaireEdit: React.FC = () => {
  const { id } = useParams();
  const anneeScolaireId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { anneesScolaires, refreshAnneesScolaires } = useAnneeScolaire();

  const [annee_debut, setAnneeDebut] = useState<string>('');
  const [annee_fin, setAnneeFin] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!anneeScolaireId) return;
    void loadAnneeScolaire();
  }, [anneeScolaireId]);

  const loadAnneeScolaire = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await anneeScolaireService.getById(anneeScolaireId);
      // Extraire les années depuis nom ou date_debut/date_fin
      if (res.annee_debut && res.annee_fin) {
      setAnneeDebut(String(res.annee_debut));
      setAnneeFin(String(res.annee_fin));
      } else if (res.nom && res.nom.match(/^(\d{4})-(\d{4})$/)) {
        const matches = res.nom.match(/^(\d{4})-(\d{4})$/);
        if (matches) {
          setAnneeDebut(matches[1]);
          setAnneeFin(matches[2]);
        }
      } else if (res.date_debut && res.date_fin) {
        const dateDebut = new Date(res.date_debut);
        const dateFin = new Date(res.date_fin);
        setAnneeDebut(String(dateDebut.getFullYear()));
        setAnneeFin(String(dateFin.getFullYear()));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de validation améliorée avec vérification d'unicité (sauf l'année courante)
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Validation année de début
    if (!annee_debut.trim()) {
      errors.annee_debut = 'L\'année de début est requise';
    } else {
      const anneeDebutNum = Number(annee_debut);
      if (Number.isNaN(anneeDebutNum) || !Number.isInteger(anneeDebutNum)) {
        errors.annee_debut = 'L\'année de début doit être un nombre entier valide';
      } else if (anneeDebutNum < 2000 || anneeDebutNum > 2100) {
        errors.annee_debut = 'L\'année de début doit être entre 2000 et 2100';
      } else {
        // Vérifier l'unicité (par nom format: "2024-2025") - exclure l'année courante
        const nomExpected = `${anneeDebutNum}-${anneeDebutNum + 1}`;
        const exists = anneesScolaires.some(annee => annee.nom === nomExpected && annee.id !== anneeScolaireId);
        if (exists) {
          errors.annee_debut = 'Cette année scolaire existe déjà';
        }
      }
    }
    
    // Validation année de fin
    if (!annee_fin.trim()) {
      errors.annee_fin = 'L\'année de fin est requise';
    } else {
      const anneeFinNum = Number(annee_fin);
      if (Number.isNaN(anneeFinNum) || !Number.isInteger(anneeFinNum)) {
        errors.annee_fin = 'L\'année de fin doit être un nombre entier valide';
      } else if (anneeFinNum < 2000 || anneeFinNum > 2100) {
        errors.annee_fin = 'L\'année de fin doit être entre 2000 et 2100';
      } else if (anneeFinNum !== Number(annee_debut) + 1) {
        errors.annee_fin = 'L\'année de fin doit être exactement l\'année suivante (ex: 2024 → 2025)';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nettoyer les erreurs précédentes
    setError(null);
    setValidationErrors({});
    
    // Validation
    if (!validateForm()) {
      showError('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setSaving(true);
    const anneeDebutNum = Number(annee_debut);
    const anneeFinNum = Number(annee_fin);
    
      await anneeScolaireService.update(anneeScolaireId, {
        nom: `${anneeDebutNum}-${anneeFinNum}`,
        date_debut: `${anneeDebutNum}-09-01`,
        date_fin: `${anneeFinNum}-06-30`,
        description: `Année scolaire ${anneeDebutNum}/${anneeFinNum}`,
      });
      
      showSuccess('Mise à jour réussie', `L'année scolaire ${anneeDebutNum}/${anneeFinNum} a été mise à jour avec succès.`);
      
      await refreshAnneesScolaires();
      
      setTimeout(() => {
        navigate(`/annees-scolaires/${anneeScolaireId}`);
      }, 1500);
    } catch (e: any) {
      // Gestion spécifique de l'erreur 422 (validation)
      if (e.response?.status === 422) {
        const raw = e.response?.data;
        let backendMessage = '';
        try {
          if (raw && typeof raw === 'string') {
            const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
            backendMessage = parsed?.message || '';
          } else if (raw && typeof raw === 'object') {
            backendMessage = raw?.message || '';
          }
        } catch {}

        const errors = (typeof raw === 'object' ? raw?.errors : undefined);
        if (errors) {
          // Traiter les erreurs de validation du backend
          const backendErrors: {[key: string]: string} = {};
          if (errors.annee_debut) {
            backendErrors.annee_debut = Array.isArray(errors.annee_debut) 
              ? errors.annee_debut[0] 
              : errors.annee_debut;
          }
          if (errors.annee_fin) {
            backendErrors.annee_fin = Array.isArray(errors.annee_fin) 
              ? errors.annee_fin[0] 
              : errors.annee_fin;
          }
          setValidationErrors(backendErrors);
          showError('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
          return;
        }

        const msg = backendMessage || e.message || 'Erreur lors de la mise à jour.';
        setError(msg);
        showError('Erreur de mise à jour', msg);
        return;
      }
      
      const errorMessage = e.response?.data?.message || e.message || 'Erreur lors de la mise à jour de l\'année scolaire';
      setError(errorMessage);
      showError('Erreur de mise à jour', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier l'année scolaire" 
        subtitle="Mettre à jour les informations de l'année scolaire"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Années Scolaires', link: '/annees-scolaires' },
          { label: 'Modifier', link: `/annees-scolaires/${anneeScolaireId}/edit` },
        ]}
      />

      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30">
                <div className="flex">
                  <Icon name="alert" className="w-5 h-5 text-red-400 dark:text-red-500" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erreur</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                  Année de Début *
                </label>
                <input 
                  type="number"
                  min="2000"
                  max="2100"
                  className={`block w-full px-3 py-2 rounded-md border shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500 ${
                    validationErrors.annee_debut ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-gray-600'
                  }`}
                  value={annee_debut}
                  onChange={(e) => {
                    setAnneeDebut(e.target.value);
                    // Auto-calculer l'année de fin
                    const anneeDebutNum = Number(e.target.value);
                    if (!Number.isNaN(anneeDebutNum) && anneeDebutNum >= 2000) {
                      setAnneeFin(String(anneeDebutNum + 1));
                    }
                    // Nettoyer les erreurs de validation
                    if (validationErrors.annee_debut) {
                      setValidationErrors(prev => ({ ...prev, annee_debut: '' }));
                    }
                    if (validationErrors.annee_fin) {
                      setValidationErrors(prev => ({ ...prev, annee_fin: '' }));
                    }
                  }}
                  required
                  placeholder="2024"
                />
                {validationErrors.annee_debut && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.annee_debut}
                </p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                  Année de Fin *
                </label>
                <input 
                  type="number"
                  min="2001"
                  max="2100"
                  className={`block w-full px-3 py-2 rounded-md border shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500 ${
                    validationErrors.annee_fin ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-gray-600'
                  }`}
                  value={annee_fin}
                  onChange={(e) => {
                    setAnneeFin(e.target.value);
                    if (validationErrors.annee_fin) {
                      setValidationErrors(prev => ({ ...prev, annee_fin: '' }));
                    }
                  }}
                  required
                  placeholder="2025"
                />
                {validationErrors.annee_fin && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.annee_fin}
                </p>
                )}
              </div>
            </div>

            {/* Aperçu */}
            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <h3 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-200">Aperçu</h3>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                {annee_debut && annee_fin ? `${annee_debut}/${annee_fin}` : 'XXXX/YYYY'}
              </p>
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <Icon name="info" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Système de périodes : Semestre</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Les périodes <strong>1er Semestre</strong> et <strong>2ème Semestre</strong> sont déjà créées pour cette année scolaire.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={async () => {
                  await refreshAnneesScolaires();
                  navigate(`/annees-scolaires/${anneeScolaireId}`);
                }}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={saving}
                className="flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Icon name="save" size="sm" />
                    <span>Enregistrer</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default AnneeScolaireEdit;
