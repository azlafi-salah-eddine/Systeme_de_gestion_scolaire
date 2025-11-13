import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { anneeScolaireService } from '../../services/anneeScolaireService';

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

const ControlesNew: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();
  const { user, isProfesseur, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [allMatieres, setAllMatieres] = useState<Matiere[]>([]);
  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [professeurMatieres, setProfesseurMatieres] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    libelle: '',
    debut_controle: '',
    fin_controle: '',
    annee_scolaire_id: '',
    niveau_id: '',
    matiere_id: '',
    professeur_id: '',
    periode_id: '',
    instructions: '',
    active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadNiveaux();
    loadMatieres();
    loadProfesseurs();
    if (isProfesseur()) {
      loadProfesseurMatieres();
    }
  }, [user]);

  // Charger les années scolaires quand anneeActive est disponible
  useEffect(() => {
    loadAnneesScolaires();
  }, [anneeActive, user]);

  // Définir l'année scolaire active par défaut (après chargement des années scolaires)
  useEffect(() => {
    if (!formData.annee_scolaire_id) {
      // Priorité 1: Utiliser l'année active si disponible
      if (anneeActive) {
        setFormData(prev => ({ ...prev, annee_scolaire_id: anneeActive.id.toString() }));
        return;
      }
      // Priorité 2: Si une seule année disponible dans la liste, la sélectionner
      if (anneesScolaires.length === 1) {
        setFormData(prev => ({ ...prev, annee_scolaire_id: anneesScolaires[0].id.toString() }));
      }
    }
  }, [anneeActive, anneesScolaires]);

  useEffect(() => {
    if (formData.annee_scolaire_id) {
      // Réinitialiser la période avant de charger les nouvelles périodes
      setFormData(prev => ({ ...prev, periode_id: '' }));
      loadPeriodes();
    } else {
      setPeriodes([]);
      setFormData(prev => ({ ...prev, periode_id: '' }));
    }
  }, [formData.annee_scolaire_id]);

  // Sélectionner automatiquement la première période active quand les périodes sont chargées
  useEffect(() => {
    if (periodes.length > 0 && formData.annee_scolaire_id && !formData.periode_id) {
      // Trouver la première période active
      const premierePeriodeActive = periodes.find((p: any) => p.active !== false) || periodes[0];
      if (premierePeriodeActive) {
        setFormData(prev => ({ ...prev, periode_id: premierePeriodeActive.id.toString() }));
      }
    }
  }, [periodes, formData.annee_scolaire_id]);
  
  const loadProfesseurMatieres = async () => {
    try {
      const professeurId = (user as any)?.professeur_id;
      if (professeurId) {
        // Récupérer les matières via l'emploi du temps (plus fiable car garantit que c'est dans les classes du professeur)
        const timetableResponse = await api.get(`/v1/professeurs/${professeurId}/emplois-du-temps`);
        const timetableData = timetableResponse.data?.data || [];
        // Extraire les IDs des matières uniques de l'emploi du temps
        const matiereIds = [...new Set(timetableData.map((item: any) => item.matiere_id).filter((id: any) => id))];
        setProfesseurMatieres(matiereIds as number[]);
      }
    } catch (error: any) {
      // Si erreur, laisser vide - le backend vérifiera lors de la création
    }
  };

  const loadNiveaux = async () => {
    try {
      const response = await api.get('/v1/niveaux?active=true');
      setNiveaux(response.data?.data || []);
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des niveaux');
    }
  };

  const loadMatieres = async () => {
    try {
      const response = await api.get('/v1/matieres?active=true&with=niveau');
      const matieresData = response.data?.data || [];
      setAllMatieres(matieresData);
      setMatieres([]); // Start with empty matieres until niveau is selected
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des matières');
    }
  };

  const loadProfesseurs = async () => {
    try {
      const response = await api.get('/v1/professeurs?active=true');
      setProfesseurs(response.data?.data || []);
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des professeurs');
    }
  };

  const loadAnneesScolaires = async () => {
    try {
      // Pour les super admins, charger toutes les années disponibles
      if (isSuperAdmin()) {
        try {
          const anneesFiltrees = await anneeScolaireService.getWithStatut();
          setAnneesScolaires(anneesFiltrees);
        } catch (error: any) {
          // Si erreur, utiliser seulement l'année active
          if (anneeActive) {
            setAnneesScolaires([anneeActive]);
          }
        }
      } else {
        // Pour les admins/profs, utiliser seulement l'année active
        if (anneeActive) {
          setAnneesScolaires([anneeActive]);
        } else {
          setAnneesScolaires([]);
        }
      }
    } catch (error: any) {
      // En cas d'erreur, utiliser seulement l'année active
      if (anneeActive) {
        setAnneesScolaires([anneeActive]);
      } else {
        setAnneesScolaires([]);
      }
    }
  };

  const loadPeriodes = async () => {
    try {
      if (!formData.annee_scolaire_id) {
        setPeriodes([]);
        return;
      }
      
      // Charger les périodes de l'année scolaire sélectionnée
      const response = await api.get(`/v1/annees-scolaires/${formData.annee_scolaire_id}/periodes?active=true`);
      setPeriodes(response.data?.data || []);
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des périodes');
      setPeriodes([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // If annee_scolaire_id changes, reset periode
    if (field === 'annee_scolaire_id') {
      setFormData(prev => ({ ...prev, periode_id: '' }));
    }
    
    // Validate duration when dates change
    if (field === 'debut_controle' || field === 'fin_controle') {
      // Wait for the state to update, then validate
      setTimeout(() => {
        const currentFormData = { ...formData, [field]: value };
        if (currentFormData.debut_controle && currentFormData.fin_controle) {
          const debut = new Date(currentFormData.debut_controle);
          const fin = new Date(currentFormData.fin_controle);
          
          if (debut < fin) {
            const diffInMs = fin.getTime() - debut.getTime();
            const diffInHours = diffInMs / (1000 * 60 * 60);
            
            if (diffInHours > 5) {
              setErrors(prev => ({ 
                ...prev, 
                fin_controle: 'La durée du contrôle ne peut pas dépasser 5 heures' 
              }));
            } else {
              setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors.fin_controle && newErrors.fin_controle.includes('5 heures')) {
                  delete newErrors.fin_controle;
                }
                return newErrors;
              });
            }
          }
        }
      }, 0);
    }
    
    // If niveau is selected, filter matieres
    if (field === 'niveau_id') {
      if (value) {
        const niveauId = parseInt(value);
        let filteredMatieres = allMatieres.filter(matiere => 
          matiere.niveau_id === niveauId
        );
        
        // Si c'est un professeur, filtrer aussi par ses matières (celles enseignées dans ses classes)
        if (isProfesseur() && professeurMatieres.length > 0) {
          filteredMatieres = filteredMatieres.filter(matiere => 
            professeurMatieres.includes(matiere.id)
          );
        }
        
        setMatieres(filteredMatieres);
        // Reset matiere selection when niveau changes
        setFormData(prev => ({ ...prev, matiere_id: '' }));
      } else {
        setMatieres([]);
        setFormData(prev => ({ ...prev, matiere_id: '' }));
      }
    }
    
    // Si c'est un professeur et qu'une matière est sélectionnée, vérifier qu'elle est dans la liste autorisée
    if (field === 'matiere_id' && isProfesseur() && professeurMatieres.length > 0 && value) {
      const matiereId = parseInt(value);
      if (!professeurMatieres.includes(matiereId)) {
        setErrors(prev => ({ ...prev, matiere_id: 'Vous ne pouvez créer un contrôle que pour une matière que vous enseignez dans vos classes' }));
        setFormData(prev => ({ ...prev, matiere_id: '' }));
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
    if (formData.debut_controle && formData.fin_controle) {
      const debut = new Date(formData.debut_controle);
      const fin = new Date(formData.fin_controle);
      
      if (debut >= fin) {
        newErrors.fin_controle = 'La date de fin doit être après la date de début';
      } else {
        // Calculer la différence en heures
        const diffInMs = fin.getTime() - debut.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        
        // Vérifier que la durée ne dépasse pas 5 heures
        if (diffInHours > 5) {
          newErrors.fin_controle = 'La durée du contrôle ne peut pas dépasser 5 heures';
        }
      }
    }
    if (!formData.annee_scolaire_id) {
      newErrors.annee_scolaire_id = 'L\'année scolaire est requise';
    }
    if (!formData.niveau_id) {
      newErrors.niveau_id = 'Le niveau est requis';
    }
    if (!formData.matiere_id) {
      newErrors.matiere_id = 'La matière est requise';
    }
    // Si c'est un professeur, vérifier que la matière sélectionnée est dans ses matières autorisées
    if (isProfesseur() && formData.matiere_id && professeurMatieres.length > 0) {
      if (!professeurMatieres.includes(parseInt(formData.matiere_id))) {
        newErrors.matiere_id = 'Vous ne pouvez créer un contrôle que pour une matière que vous enseignez dans vos classes';
      }
    }
    if (!isProfesseur() && !formData.professeur_id) {
      newErrors.professeur_id = 'Le professeur est requis';
    }
    if (!formData.periode_id) {
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
      setLoading(true);
      
      // Si c'est un professeur, forcer le professeur_id
      let dataToSend: any = {
        ...formData,
        annee_scolaire_id: formData.annee_scolaire_id || anneeActive?.id
      };
      
      if (isProfesseur()) {
        const professeurId = (user as any)?.professeur_id;
        if (professeurId) {
          dataToSend.professeur_id = professeurId;
        }
      }
      
      const response = await api.post('/v1/controles', dataToSend);

      if (response.data?.success) {
        showSuccess('Succès', 'Contrôle créé avec succès');
        navigate('/controles');
      } else {
        showError('Erreur', response.data?.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      showError('Erreur', error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/controles');
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Nouveau Contrôle"
        subtitle="Créez un nouveau contrôle d'évaluation"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Contrôles', link: '/controles' },
          { label: 'Nouveau', link: '#' }
        ]}
      />

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Créer un nouveau contrôle
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Remplissez les informations pour créer un nouveau contrôle d'évaluation
              </p>
            </div>
            
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Année scolaire *
                </label>
                <select
                  value={formData.annee_scolaire_id}
                  onChange={(e) => handleInputChange('annee_scolaire_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.annee_scolaire_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner une année scolaire</option>
                  {anneesScolaires.map((annee) => (
                    <option key={annee.id} value={annee.id}>
                      {annee.nom}
                    </option>
                  ))}
                </select>
                {errors.annee_scolaire_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.annee_scolaire_id}</p>}
              </div>

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
                  Niveau *
                </label>
                <select
                  value={formData.niveau_id}
                  onChange={(e) => handleInputChange('niveau_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.niveau_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))}
                </select>
                {errors.niveau_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.niveau_id}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Période *
                </label>
                <select
                  value={formData.periode_id}
                  onChange={(e) => handleInputChange('periode_id', e.target.value)}
                  disabled={!formData.annee_scolaire_id}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.periode_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } ${!formData.annee_scolaire_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {!formData.annee_scolaire_id ? 'Veuillez d\'abord sélectionner une année scolaire' : 'Sélectionner une période'}
                  </option>
                  {periodes.map((periode) => (
                    <option key={periode.id} value={periode.id}>
                      {periode.nom} ({new Date(periode.date_debut).toLocaleDateString('fr-FR')} - {new Date(periode.date_fin).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
                {errors.periode_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.periode_id}</p>}
                {!formData.annee_scolaire_id && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sélectionnez d'abord une année scolaire pour voir les périodes disponibles</p>
                )}
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
                  value={formData.matiere_id}
                  onChange={(e) => handleInputChange('matiere_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                    errors.matiere_id ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!formData.niveau_id}
                >
                  <option value="">
                    {!formData.niveau_id ? 'Veuillez d\'abord sélectionner un niveau' : 'Sélectionner une matière'}
                  </option>
                  {matieres.map((matiere) => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom}
                    </option>
                  ))}
                </select>
                {errors.matiere_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.matiere_id}</p>}
                {!formData.niveau_id && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sélectionnez d'abord un niveau pour voir les matières disponibles</p>
                )}
              </div>

              {!isProfesseur() && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Professeur *
                  </label>
                  <select
                    value={formData.professeur_id}
                    onChange={(e) => handleInputChange('professeur_id', e.target.value)}
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
              )}
              {isProfesseur() && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Professeur *
                  </label>
                  <input
                    type="text"
                    value={`${user?.prenom || ''} ${user?.nom || ''}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Vous êtes automatiquement assigné comme professeur</p>
                </div>
              )}
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
                    Création...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size="sm" className="mr-2" />
                    Créer le contrôle
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

export default ControlesNew;
