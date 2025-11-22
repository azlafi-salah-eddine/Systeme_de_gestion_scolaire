import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PhotoUpload from '../../components/ui/PhotoUpload';
import ArabicKeyboard from '../../components/ui/ArabicKeyboard';
import Stepper from '../../components/ui/Stepper';
import { eleveService } from '../../services/eleveService';
import { classeService } from '../../services/classeService';
import { cantineService } from '../../services/cantineService';
import niveauService from '../../services/niveauService';
import { transportService } from '../../services/transportService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';

interface EleveData {
  // Step 1: Identity
  nom_fr: string;
  prenom_fr: string;
  nom_ar: string;
  prenom_ar: string;
  date_naissance: string;
  lieu_naissance_fr: string;
  lieu_naissance_ar: string;
  sexe: 'M' | 'F';
  cne: string;
  cin: string;
  photo: string;
  adresse: string;
  nationalite: string;
  ancienne_ecole?: string;
  type_ecole?: string;
  statut_ecole?: string;

  // Step 2: Medical & Additional
  langues?: string[];
  groupe_sanguin?: string;
  allergies?: string;
  maladies_chroniques?: string;
  medicaments?: string;
  infos_sante?: string;
  personne_urgence?: string;
  telephone_urgence?: string;

  // Step 3: Class & Services
  classe_id?: number;
  cantine_id?: number;
  transport_id?: number;
}

const EleveEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
  const [originalPhotoPath, setOriginalPhotoPath] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState<EleveData>({
    nom_fr: '',
    prenom_fr: '',
    nom_ar: '',
    prenom_ar: '',
    date_naissance: '',
    lieu_naissance_fr: '',
    lieu_naissance_ar: '',
    sexe: 'M',
    cne: '',
    cin: '',
    photo: '',
    adresse: '',
    nationalite: 'Marocaine',
    ancienne_ecole: '',
    type_ecole: '',
    statut_ecole: '',
    langues: [],
    groupe_sanguin: '',
    allergies: '',
    maladies_chroniques: '',
    medicaments: '',
    infos_sante: '',
    personne_urgence: '',
    telephone_urgence: '',
  });

  // Options for dropdowns
  const [classes, setClasses] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [cantines, setCantines] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<string>('');

  // Arabic keyboard
  const [showArabicKeyboard, setShowArabicKeyboard] = useState(false);
  const [activeArabicField, setActiveArabicField] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setInitialLoading(true);
      loadEleveData();
    }
    loadOptions();
  }, [id]);
  
  const loadEleveData = async () => {
    if (!id) {
      console.error('Aucun ID fourni');
      setError('Aucun ID d\'élève fourni');
      return;
    }
    
    try {
      const eleveRes = await eleveService.getEleve(parseInt(id));
      
      if (!eleveRes || !eleveRes.eleve) {
        setError('Réponse API invalide');
        return;
      }
      
      const eleve = eleveRes.eleve;
      
      if (eleve) {
        // Fonction pour convertir la date ISO en format yyyy-MM-dd
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        // Fonction pour convertir le chemin de fichier en URL complète
        const getPhotoUrl = (photoPath: string) => {
          if (!photoPath) return '';
          if (photoPath.startsWith('data:')) return photoPath; // Déjà en base64
          if (photoPath.startsWith('http')) return photoPath; // Déjà une URL complète
          // Convertir le chemin relatif en URL complète (sans /api)
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          return `${baseUrl.replace('/api', '')}/storage/${photoPath}`;
        };

        // Stocker le chemin original de la photo
        setOriginalPhotoPath(eleve.photo || '');

      setFormData({
          nom_fr: eleve.nom_fr || '',
          prenom_fr: eleve.prenom_fr || '',
          nom_ar: eleve.nom_ar || '',
          prenom_ar: eleve.prenom_ar || '',
          date_naissance: formatDateForInput(eleve.date_naissance) || '',
          lieu_naissance_fr: eleve.lieu_naissance_fr || '',
          lieu_naissance_ar: eleve.lieu_naissance_ar || '',
          sexe: eleve.sexe || 'M',
          cne: eleve.cne || '',
          cin: eleve.cin || '',
          photo: getPhotoUrl(eleve.photo || ''),
          adresse: eleve.adresse || '',
          nationalite: eleve.nationalite || 'Marocaine',
          ancienne_ecole: eleve.ancienne_ecole || '',
          type_ecole: eleve.type_ecole || '',
          statut_ecole: eleve.statut_ecole || '',
          langues: eleve.langues || [],
          groupe_sanguin: eleve.groupe_sanguin || '',
          allergies: eleve.allergies || '',
          maladies_chroniques: eleve.maladies_chroniques || '',
          medicaments: eleve.medicaments || '',
          infos_sante: eleve.infos_sante || '',
          personne_urgence: eleve.personne_urgence || '',
          telephone_urgence: eleve.telephone_urgence || '',
          classe_id: eleve.classe_id || undefined,
          cantine_id: eleve.cantine_id || undefined,
          transport_id: eleve.transport_id || undefined,
        });
        
        // Set selected niveau based on classe (si l'élève a une classe)
        if (eleve.classe && eleve.classe.niveau) {
          const rawNiveau = eleve.classe?.niveau;
          const niveauValue = rawNiveau && typeof rawNiveau === 'object' ? (rawNiveau as any).nom : String(rawNiveau || '');
          setSelectedNiveau(niveauValue);
        } else {
          // Si l'élève n'a pas de classe, réinitialiser le niveau
          setSelectedNiveau('');
        }
      }
    } catch (e: any) {
      setError('Erreur lors du chargement des données de l\'élève: ' + (e?.message || 'Erreur inconnue'));
      showError('Erreur', 'Impossible de charger les données de l\'élève: ' + (e?.message || 'Erreur inconnue'));
    } finally {
      setInitialLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      // Charger les classes de l'année scolaire actuelle par défaut
      const classeParams: any = { active: true };
      if (anneeActive) {
        classeParams.annee_scolaire_id = anneeActive.id;
      }
      
      const [classesRes, cantinesRes, transportsRes, niveauxRes] = await Promise.all([
        classeService.index(classeParams, ['niveau']), // Charger les classes de l'année actuelle
        cantineService.list(),
        transportService.list(),
        niveauService.list()
      ]);

      setClasses(classesRes.data || []);
      setNiveaux(niveauxRes || []);
      setCantines(cantinesRes.data || []);
      setTransports(transportsRes.data || []);
    } catch (e: any) {
      setError('Erreur lors du chargement des données: ' + (e?.message || 'Erreur inconnue'));
    }
  };


  
  const handleInputChange = async (field: keyof EleveData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validation en temps réel
    const error = validateField(field, value);

    // Supprimer les warnings précédents quand l'utilisateur modifie le champ
    if (field === 'cne' || field === 'cin') {
      setFieldWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[field];
        return newWarnings;
      });
    }

    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Effacer l'erreur générale si le champ est corrigé
    if (error === '' && fieldErrors[field]) {
      setError(null);
    }
  };

  const getFieldError = (field: string): string => {
    return fieldErrors[field] || '';
  };

  const getFieldWarning = (field: string): string => {
    return fieldWarnings[field] || '';
  };

  const getFieldClassName = (field: string): string => {
    const baseClass = "w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent";
    const errorClass = "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-500 focus:border-red-500";
    const normalClass = "border-gray-300 dark:border-gray-600";
    const checkingClass = "border-yellow-300 dark:border-yellow-600 focus:ring-yellow-500 dark:focus:ring-yellow-500 focus:border-yellow-500";
    const warningClass = "border-orange-300 dark:border-orange-600 focus:ring-orange-500 dark:focus:ring-orange-500 focus:border-orange-500";

    if (fieldWarnings[field]) return `${baseClass} ${warningClass}`;
    return `${baseClass} ${getFieldError(field) ? errorClass : normalClass}`;
  };



  const handleArabicKeyPress = (key: string) => {
    if (activeArabicField) {
      const currentValue = formData[activeArabicField as keyof EleveData] as string;
      handleInputChange(activeArabicField as keyof EleveData, currentValue + key);
    }
  };

  const handleArabicBackspace = () => {
    if (activeArabicField) {
      const currentValue = formData[activeArabicField as keyof EleveData] as string;
      handleInputChange(activeArabicField as keyof EleveData, currentValue.slice(0, -1));
    }
  };

  const handleArabicSpace = () => {
    if (activeArabicField) {
      const currentValue = formData[activeArabicField as keyof EleveData] as string;
      handleInputChange(activeArabicField as keyof EleveData, currentValue + ' ');
    }
  };

  const openArabicKeyboard = (field: string) => {
    setActiveArabicField(field);
    setShowArabicKeyboard(true);
  };

  const closeArabicKeyboard = () => {
    setShowArabicKeyboard(false);
    setActiveArabicField(null);
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});


  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'nom_fr':
        if (!value || value.trim().length < 2) return 'Le nom français est requis (minimum 2 caractères)';
        if (value.length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
        break;
      case 'prenom_fr':
        if (!value || value.trim().length < 2) return 'Le prénom français est requis (minimum 2 caractères)';
        if (value.length > 100) return 'Le prénom ne peut pas dépasser 100 caractères';
        break;
      case 'nom_ar':
        if (!value || value.trim().length < 2) return 'Le nom arabe est requis (minimum 2 caractères)';
        if (value.length > 100) return 'Le nom arabe ne peut pas dépasser 100 caractères';
        // Check for Arabic characters only
        if (value && !/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/.test(value)) {
          return 'Le nom arabe doit contenir uniquement des caractères arabes';
        }
        break;
      case 'prenom_ar':
        if (!value || value.trim().length < 2) return 'Le prénom arabe est requis (minimum 2 caractères)';
        if (value.length > 100) return 'Le prénom arabe ne peut pas dépasser 100 caractères';
        // Check for Arabic characters only
        if (value && !/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/.test(value)) {
          return 'Le prénom arabe doit contenir uniquement des caractères arabes';
        }
        break;
      case 'date_naissance':
        if (!value) return 'La date de naissance est requise';
        const birthDate = new Date(value);
        const today = new Date();
        if (birthDate >= today) return 'La date de naissance doit être antérieure à aujourd\'hui';
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 3 || age > 25) return 'L\'âge doit être entre 3 et 25 ans';
        break;
      case 'sexe':
        if (!value) return 'Le sexe est requis';
        break;
      case 'lieu_naissance_fr':
        if (!value || value.trim().length < 2) return 'Le lieu de naissance français est requis (minimum 2 caractères)';
        if (value.length > 150) return 'Le lieu de naissance ne peut pas dépasser 150 caractères';
        break;
      case 'lieu_naissance_ar':
        if (!value || value.trim().length < 2) return 'Le lieu de naissance arabe est requis (minimum 2 caractères)';
        if (value.length > 150) return 'Le lieu de naissance arabe ne peut pas dépasser 150 caractères';
        // Check for Arabic characters only
        if (value && !/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/.test(value)) {
          return 'Le lieu de naissance arabe doit contenir uniquement des caractères arabes';
        }
        break;
      case 'adresse':
        if (!value || value.trim().length < 5) return 'L\'adresse est requise (minimum 5 caractères)';
        if (value.length > 500) return 'L\'adresse ne peut pas dépasser 500 caractères';
        break;
      case 'nationalite':
        if (!value || value === '') return 'La nationalité est requise';
        break;
      case 'ancienne_ecole':
        if (!value || value.trim().length < 2) return 'Le nom de l\'ancienne école est requis (minimum 2 caractères)';
        if (value.length > 255) return 'Le nom de l\'ancienne école ne peut pas dépasser 255 caractères';
        break;
      case 'cne':
        // Check if CNE is required based on age
        const isCNERequired = () => {
          if (!formData.date_naissance) return true; // Required by default if no birth date
          const birthDate = new Date(formData.date_naissance);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          return age > 7; // Required for students over 7 years old
        };

        if (isCNERequired()) {
          if (!value || value.trim().length < 10) return 'Le CNE est requis pour les élèves de plus de 7 ans (format: P123456789)';
          if (value.length > 10) return 'Le CNE doit contenir exactement 10 caractères';
          if (!/^[A-Z]\d{9}$/.test(value)) return 'Le CNE doit commencer par une lettre suivie de 9 chiffres (ex: P123456789)';
        } else if (value && value.trim()) {
          // If CNE is provided for younger students, validate format
          if (value.length > 10) return 'Le CNE doit contenir exactement 10 caractères';
          if (!/^[A-Z]\d{9}$/.test(value)) return 'Le CNE doit commencer par une lettre suivie de 9 chiffres (ex: P123456789)';
        }
        break;
      case 'cin':
        if (value && value.trim()) {
          if (value.trim().length < 4) return 'Le CIN doit contenir au minimum 4 caractères';
          if (value.length > 20) return 'Le CIN ne peut pas dépasser 20 caractères';
          if (!/^[A-Z]{2}\d{2,}$/.test(value)) return 'Le CIN doit commencer par 2 lettres suivies d\'au moins 2 chiffres (ex: AB12, AB123456)';
        }
        break;
      case 'groupe_sanguin':
        if (value && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(value)) {
          return 'Groupe sanguin invalide';
        }
        break;
      case 'langues':
        if (!Array.isArray(value) || value.length === 0) return 'Veuillez sélectionner au moins une langue';
        break;
      case 'allergies':
        if (value && value.length > 500) return 'Les allergies ne peuvent pas dépasser 500 caractères';
        break;
      case 'maladies_chroniques':
        if (value && value.length > 500) return 'Les maladies chroniques ne peuvent pas dépasser 500 caractères';
        break;
      case 'medicaments':
        if (value && value.length > 500) return 'Les médicaments ne peuvent pas dépasser 500 caractères';
        break;
      case 'infos_sante':
        if (value && value.length > 1000) return 'Les informations de santé ne peuvent pas dépasser 1000 caractères';
        break;
      case 'personne_urgence':
        if (value && value.length > 255) return 'Le nom de la personne d\'urgence ne peut pas dépasser 255 caractères';
        break;
      case 'telephone_urgence':
        if (value && !/^[0-9+\-\s()]{10,20}$/.test(value)) return 'Format de téléphone d\'urgence invalide';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format d\'email invalide';
        break;
      case 'telephone':
        if (value && !/^[0-9+\-\s()]{10,20}$/.test(value)) return 'Format de téléphone invalide';
        break;
      case 'type_ecole':
        if (!value) return 'Type d\'école obligatoire';
        if (!['creche','ecole'].includes(String(value))) return 'Type d\'école doit être "creche" ou "ecole"';
        break;
      case 'statut_ecole':
        if (!value) return 'Statut de l\'école obligatoire';
        if (!['publique','privee'].includes(String(value))) return 'Statut de l\'école doit être "publique" ou "privee"';
        break;
      case 'classe_id':
        // Classe est maintenant optionnelle - pas de validation requise
        break;
    }
    return '';
  };

  const validateStep = (step: number): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Tous les champs sont obligatoires sauf photo, CIN et CNE (alignés au backend)
        const requiredFields1 = [
          'nom_fr', 'prenom_fr', 'nom_ar', 'prenom_ar', 'date_naissance', 'sexe',
          'lieu_naissance_fr', 'lieu_naissance_ar', 'adresse', 'nationalite',
          'ancienne_ecole', 'type_ecole', 'statut_ecole'
        ];
        requiredFields1.forEach(field => {
          const error = validateField(field, formData[field as keyof EleveData]);
          if (error) errors[field] = error;
        });

        // Validation optionnelle pour la photo
        if (formData.photo) {
          const photoError = validateField('photo', formData.photo);
          if (photoError) errors.photo = photoError;
        }

        // Validation optionnelle pour le CIN
        if (formData.cin && formData.cin.trim()) {
          const cinError = validateField('cin', formData.cin);
          if (cinError) errors.cin = cinError;
        }

        // Validation du CNE basée sur l'âge
        const cneError = validateField('cne', formData.cne);
        if (cneError) errors.cne = cneError;
        break;

      case 2:
        // Étape 2 entièrement optionnelle - aucune validation obligatoire
        // Seule validation des formats si des champs sont remplis
        const optionalStep2 = ['langues', 'groupe_sanguin', 'medicaments', 'allergies', 'maladies_chroniques', 'infos_sante', 'personne_urgence', 'telephone_urgence'];
        optionalStep2.forEach(field => {
          const value = formData[field as keyof EleveData] as any;
          if (value && value !== '') { // Seulement valider si le champ est rempli
            const error = validateField(field, value);
            if (error) {
              errors[field] = error;
            }
          }
        });
        break;

      case 3:
        // Classe est maintenant optionnelle - pas de validation requise
        break;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const nextStep = async () => {
    const validation = validateStep(currentStep);

    if (validation.isValid) {

      // Si tout est OK, passer à l'étape suivante
        setCurrentStep(prev => Math.min(prev + 1, 3));
      setError(null);
      setFieldErrors({});
      setFieldWarnings({});
      showSuccess('Étape validée', 'Vous pouvez passer à l\'étape suivante');
    } else {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      showError('Erreur de validation', firstError);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const submitEdit = async () => {
    if (!id) return;
    
    // Validation finale de toutes les étapes
    const step1Validation = validateStep(1);
    const step2Validation = validateStep(2);
    const step3Validation = validateStep(3);

    if (!step1Validation.isValid || !step2Validation.isValid || !step3Validation.isValid) {
      const allErrors = { ...step1Validation.errors, ...step2Validation.errors, ...step3Validation.errors };
      setFieldErrors(allErrors);
      const firstError = Object.values(allErrors)[0];
      setError(firstError);
      showError('Validation échouée', firstError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});

      // Préparer les données de l'élève
      const studentData = {
        nom_fr: formData.nom_fr.trim(),
        prenom_fr: formData.prenom_fr.trim(),
        nom_ar: formData.nom_ar?.trim() || undefined,
        prenom_ar: formData.prenom_ar?.trim() || undefined,
        date_naissance: formData.date_naissance,
        lieu_naissance_fr: formData.lieu_naissance_fr?.trim() || undefined,
        lieu_naissance_ar: formData.lieu_naissance_ar?.trim() || undefined,
        sexe: formData.sexe as 'M' | 'F',
        cne: formData.cne?.trim() || undefined,
        cin: formData.cin?.trim() || undefined,
        photo: formData.photo?.startsWith('data:') ? formData.photo : originalPhotoPath,
        adresse: formData.adresse?.trim() || undefined,
        nationalite: formData.nationalite?.trim() || 'Marocaine',
        ancienne_ecole: formData.ancienne_ecole?.trim() || undefined,
        type_ecole: formData.type_ecole || undefined,
        statut_ecole: formData.statut_ecole || undefined,

        // Informations médicales
        groupe_sanguin: formData.groupe_sanguin || undefined,
        allergies: formData.allergies?.trim() || undefined,
        maladies_chroniques: formData.maladies_chroniques?.trim() || undefined,
        medicaments: formData.medicaments?.trim() || undefined,
        infos_sante: formData.infos_sante?.trim() || undefined,
        personne_urgence: formData.personne_urgence?.trim() || undefined,
        telephone_urgence: formData.telephone_urgence?.trim() || undefined,
        langues: formData.langues || [],

        // Affectations
        classe_id: formData.classe_id ? formData.classe_id : null,
        cantine_id: formData.cantine_id ? formData.cantine_id : null,
        transport_id: formData.transport_id ? formData.transport_id : null,
      };
      
      // Mettre à jour l'élève
      await eleveService.updateEleve(parseInt(id), studentData);

      showSuccess('Modification réussie', `L'élève ${formData.prenom_fr} ${formData.nom_fr} a été modifié avec succès.`);
      setSuccess('Modification réussie');

      setTimeout(() => {
        navigate('/eleves');
      }, 2000);

    } catch (e: any) {
      let errorMessage = 'Erreur lors de la modification';

      if (e?.message) {
        if (e.message.includes('422')) {
          errorMessage = 'Données invalides. Vérifiez les informations saisies.';
        } else if (e.message.includes('500')) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          errorMessage = e.message;
        }
      }

      setError(errorMessage);
      showError('Erreur de modification', errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const steps = [
    { key: 1, title: 'Renseignement d\'identité' },
    { key: 2, title: 'Infos complémentaires & médicales' },
    { key: 3, title: 'Affectation à la classe (optionnel)' },
  ];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Modification élève"
        subtitle="Modifier les informations de l'élève"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Élèves', link: '/eleves' },
          { label: 'Modifier', link: `/eleves/edit/${id}` }
        ]}
      />

      {error && (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30">
          <div className="flex items-center gap-2">
            <Icon name="alert" className="text-red-500 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30">
          <div className="flex items-center gap-2">
            <Icon name="check" className="text-green-500 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <Card>
        <Stepper
          steps={steps}
          current={currentStep}
          onStepClick={undefined}
        />
      </Card>

      {/* Step Content */}
      <Card>
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Informations personnelles</h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <PhotoUpload
                    label="Photo de l'élève"
                    value={formData.photo}
                    maxBytes={1024 * 1024}
                    allowedFormats={['image/jpeg', 'image/jpg', 'image/png']}
                    onChange={(base64) => handleInputChange('photo', base64)}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Prénom (Français) *</label>
                  <input
                    type="text"
                    value={formData.prenom_fr}
                    onChange={(e) => handleInputChange('prenom_fr', e.target.value)}
                    className={getFieldClassName('prenom_fr')}
                    placeholder="Prénom en français"
                  />
                  {getFieldError('prenom_fr') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('prenom_fr')}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Nom (Français) *</label>
                  <input
                    type="text"
                    value={formData.nom_fr}
                    onChange={(e) => handleInputChange('nom_fr', e.target.value)}
                    className={getFieldClassName('nom_fr')}
                    placeholder="Nom en français"
                  />
                  {getFieldError('nom_fr') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('nom_fr')}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Prénom (Arabe) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.prenom_ar}
                      onChange={(e) => handleInputChange('prenom_ar', e.target.value)}
                      className={getFieldClassName('prenom_ar')}
                      placeholder="الاسم الأول"
                    />
                    <button
                      type="button"
                      onClick={() => openArabicKeyboard('prenom_ar')}
                      className="absolute p-1 transform -translate-y-1/2 rounded right-2 top-1/2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Icon name="keyboard" size="sm" className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  {getFieldError('prenom_ar') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('prenom_ar')}</p>
                  )}
                  {activeArabicField === 'prenom_ar' && (
                    <ArabicKeyboard
                      isVisible={showArabicKeyboard}
                      onKeyPress={handleArabicKeyPress}
                      onBackspace={handleArabicBackspace}
                      onSpace={handleArabicSpace}
                      onClose={closeArabicKeyboard}
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Nom (Arabe) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.nom_ar}
                      onChange={(e) => handleInputChange('nom_ar', e.target.value)}
                      className={getFieldClassName('nom_ar')}
                      placeholder="الاسم العائلي"
                    />
                    <button
                      type="button"
                      onClick={() => openArabicKeyboard('nom_ar')}
                      className="absolute p-1 transform -translate-y-1/2 rounded right-2 top-1/2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Icon name="keyboard" size="sm" className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  {getFieldError('nom_ar') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('nom_ar')}</p>
                  )}
                  {activeArabicField === 'nom_ar' && (
                    <ArabicKeyboard
                      isVisible={showArabicKeyboard}
                      onKeyPress={handleArabicKeyPress}
                      onBackspace={handleArabicBackspace}
                      onSpace={handleArabicSpace}
                      onClose={closeArabicKeyboard}
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Date de naissance *</label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                    className={getFieldClassName('date_naissance')}
                  />
                  {getFieldError('date_naissance') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('date_naissance')}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Sexe *</label>
                  <select
                    value={formData.sexe}
                    onChange={(e) => handleInputChange('sexe', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                    CNE
                    {(() => {
                      if (!formData.date_naissance) return ' *';
                      const birthDate = new Date(formData.date_naissance);
                      const today = new Date();
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return age > 7 ? ' *' : ' (optionnel)';
                    })()}
                  </label>
                  <input
                    type="text"
                    value={formData.cne}
                    onChange={(e) => handleInputChange('cne', e.target.value)}
                    className={getFieldClassName('cne')}
                    placeholder="P123456789"
                  />
                  {getFieldError('cne') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('cne')}</p>
                  )}
                  {getFieldWarning('cne') && (
                    <p className="mt-1 text-sm text-orange-600">⚠️ {getFieldWarning('cne')}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
                      if (!formData.date_naissance) return 'Format: 1 lettre + 9 chiffres (ex: P123456789)';
                      const birthDate = new Date(formData.date_naissance);
                      const today = new Date();
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return age > 7
                        ? 'Format: 1 lettre + 9 chiffres (ex: P123456789) - Obligatoire pour les élèves de plus de 7 ans'
                        : 'Format: 1 lettre + 9 chiffres (ex: P123456789) - Optionnel pour les élèves de crèche (3-7 ans)';
                    })()}
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">CIN</label>
                  <input
                    type="text"
                    value={formData.cin}
                    onChange={(e) => handleInputChange('cin', e.target.value)}
                    className={getFieldClassName('cin')}
                    placeholder="AB12 ou AB123456"
                  />
                  {getFieldError('cin') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('cin')}</p>
                  )}
                  {getFieldWarning('cin') && (
                    <p className="mt-1 text-sm text-orange-600">⚠️ {getFieldWarning('cin')}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optionnel - Format: 2 lettres + chiffres (ex: AB12, AB123456)</p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Lieu de naissance (Français) *</label>
                  <input
                    type="text"
                    value={formData.lieu_naissance_fr}
                    onChange={(e) => handleInputChange('lieu_naissance_fr', e.target.value)}
                    className={getFieldClassName('lieu_naissance_fr')}
                    placeholder="Ville de naissance"
                  />
                  {getFieldError('lieu_naissance_fr') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('lieu_naissance_fr')}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Lieu de naissance (Arabe) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.lieu_naissance_ar}
                      onChange={(e) => handleInputChange('lieu_naissance_ar', e.target.value)}
                      className={getFieldClassName('lieu_naissance_ar')}
                      placeholder="مدينة الولادة"
                    />
                    <button
                      type="button"
                      onClick={() => openArabicKeyboard('lieu_naissance_ar')}
                      className="absolute p-1 transform -translate-y-1/2 rounded right-2 top-1/2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Icon name="keyboard" size="sm" className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  {getFieldError('lieu_naissance_ar') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('lieu_naissance_ar')}</p>
                  )}
                  {activeArabicField === 'lieu_naissance_ar' && (
                    <ArabicKeyboard
                      isVisible={showArabicKeyboard}
                      onKeyPress={handleArabicKeyPress}
                      onBackspace={handleArabicBackspace}
                      onSpace={handleArabicSpace}
                      onClose={closeArabicKeyboard}
                    />
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Nationalité *</label>
                  <select
                    value={formData.nationalite}
                    onChange={(e) => handleInputChange('nationalite', e.target.value)}
                    className={getFieldClassName('nationalite')}
                  >
                    <option value="">Sélectionner une nationalité</option>

                    {/* A */}
                    <option value="Afghane">Afghane</option>
                    <option value="Albanaise">Albanaise</option>
                    <option value="Algérienne">Algérienne</option>
                    <option value="Allemande">Allemande</option>
                    <option value="Américaine">Américaine</option>
                    <option value="Andorrane">Andorrane</option>
                    <option value="Angolaise">Angolaise</option>
                    <option value="Argentine">Argentine</option>
                    <option value="Arménienne">Arménienne</option>
                    <option value="Australienne">Australienne</option>
                    <option value="Autrichienne">Autrichienne</option>
                    <option value="Azerbaïdjanaise">Azerbaïdjanaise</option>

                    {/* B */}
                    <option value="Bahaméenne">Bahaméenne</option>
                    <option value="Bahreïnie">Bahreïnie</option>
                    <option value="Bangladeshie">Bangladeshie</option>
                    <option value="Barbadienne">Barbadienne</option>
                    <option value="Belge">Belge</option>
                    <option value="Bélizienne">Bélizienne</option>
                    <option value="Béninoise">Béninoise</option>
                    <option value="Bhoutanaise">Bhoutanaise</option>
                    <option value="Biélorusse">Biélorusse</option>
                    <option value="Birmane">Birmane</option>
                    <option value="Bolivienne">Bolivienne</option>
                    <option value="Bosniaque">Bosniaque</option>
                    <option value="Botswanaise">Botswanaise</option>
                    <option value="Brésilienne">Brésilienne</option>
                    <option value="Britannique">Britannique</option>
                    <option value="Bruneienne">Bruneienne</option>
                    <option value="Bulgare">Bulgare</option>
                    <option value="Burkinabé">Burkinabé</option>
                    <option value="Burundaise">Burundaise</option>

                    {/* C */}
                    <option value="Cambodgienne">Cambodgienne</option>
                    <option value="Camerounaise">Camerounaise</option>
                    <option value="Canadienne">Canadienne</option>
                    <option value="Cap-Verdienne">Cap-Verdienne</option>
                    <option value="Centrafricaine">Centrafricaine</option>
                    <option value="Chilienne">Chilienne</option>
                    <option value="Chinoise">Chinoise</option>
                    <option value="Chypriote">Chypriote</option>
                    <option value="Colombienne">Colombienne</option>
                    <option value="Comorienne">Comorienne</option>
                    <option value="Congolaise">Congolaise</option>
                    <option value="Congolaise (RDC)">Congolaise (RDC)</option>
                    <option value="Coréenne">Coréenne</option>
                    <option value="Costaricaine">Costaricaine</option>
                    <option value="Croate">Croate</option>
                    <option value="Cubaine">Cubaine</option>

                    {/* D */}
                    <option value="Danoise">Danoise</option>
                    <option value="Djiboutienne">Djiboutienne</option>
                    <option value="Dominicaine">Dominicaine</option>

                    {/* E */}
                    <option value="Égyptienne">Égyptienne</option>
                    <option value="Émiratie">Émiratie</option>
                    <option value="Équatorienne">Équatorienne</option>
                    <option value="Érythréenne">Érythréenne</option>
                    <option value="Espagnole">Espagnole</option>
                    <option value="Estonienne">Estonienne</option>
                    <option value="Éthiopienne">Éthiopienne</option>

                    {/* F */}
                    <option value="Fidjienne">Fidjienne</option>
                    <option value="Finlandaise">Finlandaise</option>
                    <option value="Française">Française</option>

                    {/* G */}
                    <option value="Gabonaise">Gabonaise</option>
                    <option value="Gambienne">Gambienne</option>
                    <option value="Géorgienne">Géorgienne</option>
                    <option value="Ghanéenne">Ghanéenne</option>
                    <option value="Grecque">Grecque</option>
                    <option value="Grenadienne">Grenadienne</option>
                    <option value="Guatémaltèque">Guatémaltèque</option>
                    <option value="Guinéenne">Guinéenne</option>
                    <option value="Guinéenne-Bissau">Guinéenne-Bissau</option>
                    <option value="Guinéenne Équatoriale">Guinéenne Équatoriale</option>
                    <option value="Guyanaise">Guyanaise</option>

                    {/* H */}
                    <option value="Haïtienne">Haïtienne</option>
                    <option value="Hondurienne">Hondurienne</option>
                    <option value="Hongroise">Hongroise</option>

                    {/* I */}
                    <option value="Indienne">Indienne</option>
                    <option value="Indonésienne">Indonésienne</option>
                    <option value="Irakienne">Irakienne</option>
                    <option value="Iranienne">Iranienne</option>
                    <option value="Irlandaise">Irlandaise</option>
                    <option value="Islandaise">Islandaise</option>
                    <option value="Israélienne">Israélienne</option>
                    <option value="Italienne">Italienne</option>
                    <option value="Ivoirienne">Ivoirienne</option>

                    {/* J */}
                    <option value="Jamaïcaine">Jamaïcaine</option>
                    <option value="Japonaise">Japonaise</option>
                    <option value="Jordanienne">Jordanienne</option>

                    {/* K */}
                    <option value="Kazakhe">Kazakhe</option>
                    <option value="Kenyane">Kenyane</option>
                    <option value="Kirghize">Kirghize</option>
                    <option value="Kiribatienne">Kiribatienne</option>
                    <option value="Kosovare">Kosovare</option>
                    <option value="Koweïtienne">Koweïtienne</option>

                    {/* L */}
                    <option value="Laotienne">Laotienne</option>
                    <option value="Lesothane">Lesothane</option>
                    <option value="Lettonne">Lettonne</option>
                    <option value="Libanienne">Libanienne</option>
                    <option value="Libérienne">Libérienne</option>
                    <option value="Libyenne">Libyenne</option>
                    <option value="Liechtensteinoise">Liechtensteinoise</option>
                    <option value="Lituanienne">Lituanienne</option>
                    <option value="Luxembourgeoise">Luxembourgeoise</option>

                    {/* M */}
                    <option value="Macédonienne">Macédonienne</option>
                    <option value="Malgache">Malgache</option>
                    <option value="Malaisienne">Malaisienne</option>
                    <option value="Malawite">Malawite</option>
                    <option value="Maldivienne">Maldivienne</option>
                    <option value="Malgache">Malgache</option>
                    <option value="Mali">Mali</option>
                    <option value="Marocaine">Marocaine</option>
                    <option value="Maltese">Maltese</option>
                    <option value="Marshallienne">Marshallienne</option>
                    <option value="Mauricienne">Mauricienne</option>
                    <option value="Mauritanienne">Mauritanienne</option>
                    <option value="Mexicaine">Mexicaine</option>
                    <option value="Micronésienne">Micronésienne</option>
                    <option value="Moldave">Moldave</option>
                    <option value="Monégasque">Monégasque</option>
                    <option value="Mongole">Mongole</option>
                    <option value="Monténégrine">Monténégrine</option>
                    <option value="Mozambicaine">Mozambicaine</option>

                    {/* N */}
                    <option value="Namibienne">Namibienne</option>
                    <option value="Nauruane">Nauruane</option>
                    <option value="Népalaise">Népalaise</option>
                    <option value="Néerlandaise">Néerlandaise</option>
                    <option value="Néo-Zélandaise">Néo-Zélandaise</option>
                    <option value="Nicaraguayenne">Nicaraguayenne</option>
                    <option value="Nigérienne">Nigérienne</option>
                    <option value="Nigeriane">Nigeriane</option>
                    <option value="Norvégienne">Norvégienne</option>

                    {/* O */}
                    <option value="Omanaise">Omanaise</option>
                    <option value="Ougandaise">Ougandaise</option>
                    <option value="Ouzbèke">Ouzbèke</option>

                    {/* P */}
                    <option value="Pakistanaise">Pakistanaise</option>
                    <option value="Palauane">Palauane</option>
                    <option value="Palestinienne">Palestinienne</option>
                    <option value="Panaméenne">Panaméenne</option>
                    <option value="Papouasienne">Papouasienne</option>
                    <option value="Paraguayenne">Paraguayenne</option>
                    <option value="Péruvienne">Péruvienne</option>
                    <option value="Philippine">Philippine</option>
                    <option value="Polonaise">Polonaise</option>
                    <option value="Portoricaine">Portoricaine</option>
                    <option value="Portugaise">Portugaise</option>

                    {/* Q */}
                    <option value="Qatarie">Qatarie</option>

                    {/* R */}
                    <option value="Rouge">Rouge</option>
                    <option value="Rwandaise">Rwandaise</option>
                    <option value="Roumaine">Roumaine</option>
                    <option value="Russe">Russe</option>

                    {/* S */}
                    <option value="Saoudienne">Saoudienne</option>
                    <option value="Sénégalaise">Sénégalaise</option>
                    <option value="Serbe">Serbe</option>
                    <option value="Seychelloise">Seychelloise</option>
                    <option value="Sierra-Léonaise">Sierra-Léonaise</option>
                    <option value="Singapourienne">Singapourienne</option>
                    <option value="Slovaque">Slovaque</option>
                    <option value="Slovène">Slovène</option>
                    <option value="Somalienne">Somalienne</option>
                    <option value="Soudanaise">Soudanaise</option>
                    <option value="Soudanaise du Sud">Soudanaise du Sud</option>
                    <option value="Sri-Lankaise">Sri-Lankaise</option>
                    <option value="Sud-Africaine">Sud-Africaine</option>
                    <option value="Suédoise">Suédoise</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Surinamaise">Surinamaise</option>
                    <option value="Swazie">Swazie</option>
                    <option value="Syrienne">Syrienne</option>

                    {/* T */}
                    <option value="Tadjike">Tadjike</option>
                    <option value="Tanzanienne">Tanzanienne</option>
                    <option value="Tchadienne">Tchadienne</option>
                    <option value="Tchèque">Tchèque</option>
                    <option value="Thaïlandaise">Thaïlandaise</option>
                    <option value="Timoraise">Timoraise</option>
                    <option value="Togolaise">Togolaise</option>
                    <option value="Tongienne">Tongienne</option>
                    <option value="Trinidadienne">Trinidadienne</option>
                    <option value="Tunisienne">Tunisienne</option>
                    <option value="Turkmène">Turkmène</option>
                    <option value="Turque">Turque</option>
                    <option value="Tuvaluane">Tuvaluane</option>

                    {/* U */}
                    <option value="Ukrainienne">Ukrainienne</option>
                    <option value="Uruguayenne">Uruguayenne</option>

                    {/* V */}
                    <option value="Vanuataise">Vanuataise</option>
                    <option value="Vénézuélienne">Vénézuélienne</option>
                    <option value="Vietnamienne">Vietnamienne</option>

                    {/* Y */}
                    <option value="Yéménite">Yéménite</option>

                    {/* Z */}
                    <option value="Zambienne">Zambienne</option>
                    <option value="Zimbabwéenne">Zimbabwéenne</option>

                    {/* Autre */}
                    <option value="Autre">Autre</option>
                  </select>
                  {getFieldError('nationalite') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('nationalite')}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Adresse *</label>
                  <textarea
                    value={formData.adresse}
                    onChange={(e) => handleInputChange('adresse', e.target.value)}
                    className={getFieldClassName('adresse')}
                    rows={3}
                    placeholder="Adresse complète"
                  />
                  {getFieldError('adresse') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('adresse')}</p>
                  )}
                </div>

                {/* Ancienne école section */}
                <div className="md:col-span-2">
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="mb-4 font-semibold text-md text-slate-800 dark:text-white">Ancienne école</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Nom de l'école *</label>
                        <input
                          type="text"
                          value={formData.ancienne_ecole || ''}
                          onChange={(e) => handleInputChange('ancienne_ecole', e.target.value)}
                          className={getFieldClassName('ancienne_ecole')}
                          placeholder="Nom de l'ancienne école"
                        />
                        {getFieldError('ancienne_ecole') && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('ancienne_ecole')}</p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Type d'école</label>
                        <select
                          value={formData.type_ecole || ''}
                          onChange={(e) => handleInputChange('type_ecole', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner le type</option>
                          <option value="creche">Créche</option>
                          <option value="ecole">Ecole</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Statut de l'école</label>
                        <select
                          value={formData.statut_ecole || ''}
                          onChange={(e) => handleInputChange('statut_ecole', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner le statut</option>
                          <option value="privee">Privée</option>
                          <option value="publique">Publique</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Informations complémentaires et santé</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toutes ces informations sont <strong className="dark:text-white">optionnelles</strong> - vous pouvez passer cette étape sans rien remplir</p>

              {/* Informations complémentaires */}
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="mb-4 font-semibold text-md text-slate-800 dark:text-white">Informations Complémentaires</h4>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Quelle(s) langue(s) à la maison ?</div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {['Arabe','Francais','Anglais','Amazigh','Autre'].map(L => (
                        <label key={L} className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Array.isArray(formData.langues) && (formData.langues as string[]).includes(L)}
                            onChange={(e) => {
                              const set = new Set<string>(Array.isArray(formData.langues) ? (formData.langues as string[]) : []);
                              if (e.target.checked) set.add(L); else set.delete(L);
                              handleInputChange('langues', Array.from(set));
                            }}
                            className="accent-primary-600 dark:accent-primary-500"
                          />
                          <span className="dark:text-gray-300">{L}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Votre enfant suit-il des cours particuliers ?</label>
                      <div className="flex items-center gap-6 text-sm">
                        {['Non','Oui'].map(v => (
                          <label key={v} className="inline-flex items-center gap-2">
                            <input type="radio" name="cours_particuliers" className="accent-primary-600 dark:accent-primary-500" onChange={() => handleInputChange('infos_sante', `${formData.infos_sante || ''}\nCours particuliers: ${v}`.trim())} /> <span className="dark:text-gray-300">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Votre enfant est-il aidé dans son travail scolaire ?</label>
                      <div className="flex items-center gap-6 text-sm">
                        {['Non','Oui'].map(v => (
                          <label key={v} className="inline-flex items-center gap-2">
                            <input type="radio" name="aide_scolaire" className="accent-primary-600 dark:accent-primary-500" onChange={() => handleInputChange('infos_sante', `${formData.infos_sante || ''}\nAide scolaire: ${v}`.trim())} /> <span className="dark:text-gray-300">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations médicales */}
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="mb-4 font-semibold text-md text-slate-800 dark:text-white">Informations médicales</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Groupe sanguin</label>
                    <select
                      value={formData.groupe_sanguin || ''}
                      onChange={(e) => handleInputChange('groupe_sanguin', e.target.value)}
                      className={getFieldClassName('groupe_sanguin')}
                    >
                      <option value="">Sélectionner</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {getFieldError('groupe_sanguin') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('groupe_sanguin')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Médicaments réguliers</label>
                    <select
                      value={formData.medicaments || ''}
                      onChange={(e) => handleInputChange('medicaments', e.target.value)}
                      className={getFieldClassName('medicaments')}
                    >
                      <option value="">Sélectionner une option</option>
                      <option value="Aucun">Aucun</option>
                      <option value="Médicaments quotidiens">Médicaments quotidiens</option>
                      <option value="Traitement ponctuel">Traitement ponctuel</option>
                      <option value="Vitamines">Vitamines</option>
                      <option value="Suppléments">Suppléments</option>
                      <option value="Autres">Autres</option>
                    </select>
                    {getFieldError('medicaments') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('medicaments')}</p>
                    )}
                  </div>

                  {/* Yes/No medical questions */}
                  {[
                    'Depuis sa naissance, votre enfant a-t-il eu des problèmes de santé?',
                    'Votre enfant a-t-il subi une opération?',
                    'Votre enfant prend-il des médicaments de manière chronique?',
                    'Présente-t-il des problèmes de vue?',
                    'Présente-t-il des problèmes d\'audition?',
                    'Calendrier de vaccination à jour?'
                  ].map((q, idx) => (
                    <div key={idx} className="md:col-span-2">
                      <div className="mb-2 text-sm dark:text-gray-300">{q}</div>
                      <div className="flex items-center gap-6 text-sm">
                        {['Non','Oui'].map(v => (
                          <label key={v} className="inline-flex items-center gap-2">
                            <input type="radio" name={`mq_${idx}`} className="accent-primary-600 dark:accent-primary-500" onChange={() => handleInputChange('infos_sante', `${formData.infos_sante || ''}\n${q}: ${v}`.trim())} /> <span className="dark:text-gray-300">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Allergies</label>
                    <select
                      value={formData.allergies || ''}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      className={getFieldClassName('allergies')}
                    >
                      <option value="">Sélectionner une option</option>
                      <option value="Aucune">Aucune</option>
                      <option value="Allergies alimentaires">Allergies alimentaires</option>
                      <option value="Allergies médicamenteuses">Allergies médicamenteuses</option>
                      <option value="Allergies environnementales">Allergies environnementales</option>
                      <option value="Allergies cutanées">Allergies cutanées</option>
                      <option value="Allergies respiratoires">Allergies respiratoires</option>
                      <option value="Autres">Autres</option>
                    </select>
                    {getFieldError('allergies') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('allergies')}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Maladies chroniques *</label>
                    <select
                      value={formData.maladies_chroniques || ''}
                      onChange={(e) => handleInputChange('maladies_chroniques', e.target.value)}
                      className={getFieldClassName('maladies_chroniques')}
                    >
                      <option value="">Sélectionner une option</option>
                      <option value="Aucune">Aucune</option>
                      <option value="Diabète">Diabète</option>
                      <option value="Asthme">Asthme</option>
                      <option value="Épilepsie">Épilepsie</option>
                      <option value="Troubles cardiaques">Troubles cardiaques</option>
                      <option value="Hypertension">Hypertension</option>
                      <option value="Troubles thyroïdiens">Troubles thyroïdiens</option>
                      <option value="Autres">Autres</option>
                    </select>
                    {getFieldError('maladies_chroniques') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('maladies_chroniques')}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Remarques particulières</label>
                    <textarea
                      value={formData.infos_sante || ''}
                      onChange={(e) => handleInputChange('infos_sante', e.target.value)}
                      className={getFieldClassName('infos_sante')}
                      rows={3}
                      placeholder="Autres informations médicales, restrictions, besoins spéciaux..."
                    />
                    {getFieldError('infos_sante') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('infos_sante')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Classe et services</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tous les champs de cette étape sont <strong className="dark:text-white">optionnels</strong> - vous pouvez sauvegarder sans affecter l'élève à une classe</p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Niveau (optionnel)</label>
                  <select
                    value={selectedNiveau}
                    onChange={(e) => {
                      const niveauNom = e.target.value;
                      setSelectedNiveau(niveauNom);
                      // reset classe if it doesn't belong to the chosen niveau
                      if (niveauNom && formData.classe_id) {
                        const belongs = (classes || []).some((c: any) => {
                          const niveauNomClasse = typeof c.niveau === 'object' && c.niveau ? c.niveau.nom : c.niveau;
                          return niveauNomClasse === niveauNom && c.id === formData.classe_id;
                        });
                        if (!belongs) {
                          handleInputChange('classe_id', '');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un niveau (optionnel)</option>
                    {niveaux.map((n: any) => (
                      <option key={n.id || n.nom} value={n.nom}>{n.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Classe (optionnel)</label>
                  <select
                    value={formData.classe_id ? formData.classe_id.toString() : ''}
                    onChange={(e) => {
                      const classeId = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      handleInputChange('classe_id', classeId);
                    }}
                    className={getFieldClassName('classe_id')}
                  >
                    <option value="">Sélectionner une classe (optionnel)</option>
                    {(() => {
                      const filteredClasses = (classes || []).filter((c: any) => {
                        if (!selectedNiveau) return true;
                        const niveauNomClasse = typeof c.niveau === 'object' && c.niveau ? c.niveau.nom : c.niveau;
                        return niveauNomClasse === selectedNiveau;
                      });
                      return filteredClasses.map((classe) => (
                        <option key={classe.id} value={classe.id}>
                          {classe.nom_complet || classe.nom}
                        </option>
                      ));
                    })()}
                  </select>
                  {getFieldError('classe_id') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('classe_id')}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Cantine (optionnel)</label>
                  <select
                    value={formData.cantine_id || ''}
                    onChange={(e) => handleInputChange('cantine_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Aucune cantine</option>
                    {cantines.map((cantine) => (
                      <option key={cantine.id} value={cantine.id}>
                        {cantine.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Transport (optionnel)</label>
                  <select
                    value={formData.transport_id || ''}
                    onChange={(e) => handleInputChange('transport_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Aucun transport</option>
                    {transports.map((transport) => (
                      <option key={transport.id} value={transport.id}>
                        {transport.ligne}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <Icon name="arrow-left" size="sm" />
          <span className="ml-2">Précédent</span>
        </Button>

         {currentStep < 3 ? (
          <Button
            variant="primary"
            onClick={nextStep}
            disabled={!validateStep(currentStep) || loading}
          >
            {loading && currentStep === 1 ? (
              <>
                <span>Vérification...</span>
                <div className="w-4 h-4 ml-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
              </>
            ) : (
              <>
                <span>Suivant</span>
                <Icon name="chevron-right" size="sm" className="ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={submitEdit}
             disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                <span className="ml-2">Modification en cours...</span>
              </>
            ) : (
              <>
                <Icon name="check" size="sm" />
                <span className="ml-2">Sauvegarder les modifications</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EleveEdit;

