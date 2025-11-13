import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PhotoUpload from '../../components/ui/PhotoUpload';
import ArabicKeyboard from '../../components/ui/ArabicKeyboard';
import Stepper from '../../components/ui/Stepper';
import { eleveService } from '../../services/eleveService';
import { parentService } from '../../services/parentService';
import { classeService } from '../../services/classeService';
import { cantineService } from '../../services/cantineService';
import niveauService from '../../services/niveauService';
import { transportService } from '../../services/transportService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';

interface EnrollmentData {
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
  
  // Step 2: Parents & Guardians
  pere_id?: number;
  mere_id?: number;
  tuteur_id?: number;
  
  // Step 3: Medical & Additional
  langues?: string[];
  groupe_sanguin?: string;
  allergies?: string;
  maladies_chroniques?: string;
  medicaments?: string;
  infos_sante?: string;
  personne_urgence?: string;
  telephone_urgence?: string;
  
  // Step 4: Class & Services
  classe_id?: number;
  cantine_id?: number;
  transport_id?: number;
}

const EleveNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
  
  // Form data
  const [formData, setFormData] = useState<EnrollmentData>({
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
    tuteur_id: undefined,
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
  
  // Parent copy from existing student
  const [useExistingParent, setUseExistingParent] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedNiveau, setSelectedNiveau] = useState<string>('');
  const [parentsCopied, setParentsCopied] = useState(false);
  const [copiedStudentName, setCopiedStudentName] = useState<string>('');
  
  const { anneeActive } = useAnneeScolaire();

  // Inline parent create forms - TOUT EN MÉMOIRE jusqu'à l'étape 4
  const [newPere, setNewPere] = useState<{ nom: string; prenom: string; email?: string; telephone?: string; adresse?: string; profession?: string }>({ nom: '', prenom: '', email: '', telephone: '', adresse: '', profession: '' });
  const [newMere, setNewMere] = useState<{ nom: string; prenom: string; email?: string; telephone?: string; adresse?: string; profession?: string }>({ nom: '', prenom: '', email: '', telephone: '', adresse: '', profession: '' });
  const [newTuteurs, setNewTuteurs] = useState<Array<{ nom: string; prenom: string; email?: string; telephone?: string; adresse?: string; profession?: string; contact_principal?: boolean }>>([]);
  const [pereReady, setPereReady] = useState(false); // Père prêt à être créé
  const [mereReady, setMereReady] = useState(false); // Mère prête à être créée
  const [tuteursReady, setTuteursReady] = useState<boolean[]>([]); // Tuteurs prêts à être créés
  
  // États pour les erreurs de validation des parents/tuteurs
  const [pereErrors, setPereErrors] = useState<Record<string, string>>({});
  const [mereErrors, setMereErrors] = useState<Record<string, string>>({});
  const [tuteurErrors, setTuteurErrors] = useState<Record<string, string>>({});
  
  // Arabic keyboard
  const [showArabicKeyboard, setShowArabicKeyboard] = useState(false);
  const [activeArabicField, setActiveArabicField] = useState<string | null>(null);
  
  useEffect(() => {
    loadOptions();
  }, []);
  
  const loadOptions = async () => {
    try {
      // Charger les classes de l'année scolaire actuelle par défaut
      const classeParams: any = { active: true };
      if (anneeActive) {
        classeParams.annee_scolaire_id = anneeActive.id;
      }
      
      const [classesRes, cantinesRes, transportsRes, studentsRes, niveauxRes] = await Promise.all([
        classeService.index(classeParams, ['niveau']), // Charger les classes de l'année actuelle
        cantineService.list(),
        transportService.list(),
        eleveService.getEleves({ active: 'true' }),
        niveauService.list()
      ]);
      
      // Filtrer les classes qui ont encore de la capacité
      const allClasses = classesRes.data || [];
      const availableClasses = allClasses.filter((classe: any) => {
        const currentStudents = classe.nombre_eleves || 0;
        const capacity = classe.capacite || 0;
        return currentStudents < capacity;
      });
      
      setClasses(availableClasses);
      setNiveaux(niveauxRes || []);
      setCantines(cantinesRes.data || []);
      setTransports(transportsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (e: any) {
      setError('Erreur lors du chargement des données: ' + (e?.message || 'Erreur inconnue'));
    }
  };
  
  // Recharger les classes quand l'année active change (seulement à l'étape 4)
  useEffect(() => {
    if (anneeActive && currentStep === 4) {
      const reloadClasses = async () => {
        try {
          const classeParams: any = { active: true, annee_scolaire_id: anneeActive.id };
          const classesRes = await classeService.index(classeParams, ['niveau']);
          const allClasses = classesRes.data || [];
          const availableClasses = allClasses.filter((classe: any) => {
            const currentStudents = classe.nombre_eleves || 0;
            const capacity = classe.capacite || 0;
            return currentStudents < capacity;
          });
          setClasses(availableClasses);
        } catch (e: any) {
          // Ignore errors silently
        }
      };
      reloadClasses();
    }
  }, [anneeActive, currentStep]);
  

  const copyParentsFromStudent = async (studentId: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      // Copy father if exists
      if (student.pere_id) {
        handleInputChange('pere_id', student.pere_id);
      }

      // Copy mother if exists  
      if (student.mere_id) {
        handleInputChange('mere_id', student.mere_id);
      }

      // Reset new parent forms since we're using existing ones
      setNewPere({ nom: '', prenom: '', email: '', telephone: '', adresse: '', profession: '' });
      setNewMere({ nom: '', prenom: '', email: '', telephone: '', adresse: '', profession: '' });
      setPereReady(false);
      setMereReady(false);

      // Close the existing parent selection UI
      setUseExistingParent(false);

      // Set copied states
      const studentName = `${student.prenom_fr || student.prenom || ''} ${student.nom_fr || student.nom || ''}`.trim();
      setParentsCopied(true);
      setCopiedStudentName(studentName || 'l\'élève sélectionné');

      showSuccess('Parents copiés', `Les parents de ${studentName || 'l\'élève sélectionné'} ont été copiés avec succès.`);
    } catch (e) {
      showError('Erreur', 'Erreur lors de la copie des parents');
    }
  };

  // Fonction pour annuler la copie des parents
  const cancelParentsCopy = () => {
    setFormData(prev => ({ ...prev, pere_id: undefined, mere_id: undefined }));
    setParentsCopied(false);
    setCopiedStudentName('');
    showSuccess('Copie annulée', 'Les parents copiés ont été supprimés');
  };
  
  const handleInputChange = async (field: keyof EnrollmentData, value: any) => {
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
    
    if (checkingDuplicates[field]) return `${baseClass} ${checkingClass}`;
    if (fieldWarnings[field]) return `${baseClass} ${warningClass}`;
    return `${baseClass} ${getFieldError(field) ? errorClass : normalClass}`;
  };

  // Fonction pour obtenir la classe CSS des champs parents/tuteurs
  const getParentFieldClassName = (errors: Record<string, string>, field: string, currentValue: string = ''): string => {
    const baseClass = "w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent";
    const errorClass = "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-500 focus:border-red-500";
    const normalClass = "border-gray-300 dark:border-gray-600";
    const validClass = "border-green-300 dark:border-green-600 focus:ring-green-500 dark:focus:ring-green-500 focus:border-green-500";
    
    if (errors[field]) return `${baseClass} ${errorClass}`;
    if (currentValue.trim().length >= 2 && (field === 'nom' || field === 'prenom')) return `${baseClass} ${validClass}`;
    return `${baseClass} ${normalClass}`;
  };

  const checkDuplicate = async (field: 'cne' | 'cin', value: string) => {
    if (!value || value.trim().length === 0) return '';
    
    // Pour le CNE, minimum 6 caractères
    if (field === 'cne' && value.trim().length < 6) return '';
    
    // Pour le CIN, minimum 4 caractères (comme défini dans validateField)
    if (field === 'cin' && value.trim().length < 4) return '';
    
    setCheckingDuplicates(prev => ({ ...prev, [field]: true }));
    
    try {
      // Check if CNE or CIN already exists
      const response = await fetch(`/api/v1/eleves/check-duplicate?${field}=${encodeURIComponent(value.trim())}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const rawText = await response.text();
        
        // Nettoyer le BOM et autres caractères invisibles
        const cleanText = rawText.replace(/^\uFEFF/, '').trim();
        
        const data = JSON.parse(cleanText);
        if (data.exists) {
          return `Ce ${field.toUpperCase()} existe déjà dans le système`;
        }
      }
    } catch (error) {
      // Erreur de validation silencieuse
      // Don't show error for network issues, just return empty
    } finally {
      setCheckingDuplicates(prev => ({ ...prev, [field]: false }));
    }
    
    return '';
  };
  
  const handleArabicKeyPress = (key: string) => {
    if (activeArabicField) {
      const currentValue = formData[activeArabicField as keyof EnrollmentData] as string;
      handleInputChange(activeArabicField as keyof EnrollmentData, currentValue + key);
    }
  };
  
  const handleArabicBackspace = () => {
    if (activeArabicField) {
      const currentValue = formData[activeArabicField as keyof EnrollmentData] as string;
      handleInputChange(activeArabicField as keyof EnrollmentData, currentValue.slice(0, -1));
    }
  };
  
  const handleArabicSpace = () => {
    if (activeArabicField) {
      const currentValue = formData[activeArabicField as keyof EnrollmentData] as string;
      handleInputChange(activeArabicField as keyof EnrollmentData, currentValue + ' ');
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
  const [checkingDuplicates, setCheckingDuplicates] = useState<Record<string, boolean>>({});

  // Validation pour les champs des parents/tuteurs
  const validateParentField = (field: string, value: string): string => {
    switch (field) {
      case 'nom':
      case 'prenom':
        if (!value || value.trim().length < 2) return 'Minimum 2 caractères requis';
        if (value.length > 50) return 'Maximum 50 caractères';
        if (/^[A-Za-zÀ-ÿ\s'-]+$/.test(value.trim()) === false) return 'Caractères invalides';
        return '';
      case 'email':
        if (!value) return '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email invalide';
        return '';
      case 'telephone':
        if (!value) return '';
        if (!/^[+]?[0-9\s\-\(\)]{8,20}$/.test(value)) return 'Numéro invalide';
        return '';
      case 'profession':
        if (!value) return '';
        if (value.length > 100) return 'Maximum 100 caractères';
        return '';
      case 'adresse':
        if (!value) return '';
        if (value.length > 200) return 'Maximum 200 caractères';
        return '';
      default:
        return '';
    }
  };

  // Fonctions pour gérer la validation des champs parents/tuteurs
  const handlePereFieldChange = (field: string, value: string) => {
    const error = validateParentField(field, value);
    setPereErrors(prev => ({
      ...prev,
      [field]: error
    }));
    setNewPere(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMereFieldChange = (field: string, value: string) => {
    const error = validateParentField(field, value);
    setMereErrors(prev => ({
      ...prev,
      [field]: error
    }));
    setNewMere(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTuteurFieldChange = (field: string, value: string, index: number = 0) => {
    const error = validateParentField(field, value);
    setTuteurErrors(prev => ({
      ...prev,
      [`${index}_${field}`]: error
    }));
    setNewTuteurs(prev => {
      const updated = [...prev];
      // S'assurer qu'il y a au moins un tuteur
      if (updated.length === 0) {
        updated.push({ nom: '', prenom: '', email: '', telephone: '', adresse: '', profession: '', contact_principal: true });
      }
      // S'assurer que l'index existe
      if (!updated[index]) {
        updated[index] = { nom: '', prenom: '', email: '', telephone: '', adresse: '', profession: '', contact_principal: true };
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Fonction pour vérifier si un parent/tuteur est valide
  const isParentValid = (errors: Record<string, string>, data: any) => {
    if (!data) return false;
    const hasNomValid = data.nom && data.nom.trim().length >= 2 && !errors.nom;
    const hasPrenomValid = data.prenom && data.prenom.trim().length >= 2 && !errors.prenom;
    return hasNomValid && hasPrenomValid;
  };

  // Fonction spécifique pour valider un tuteur
  const isTuteurValid = (index: number = 0) => {
    const tuteur = newTuteurs[index];
    if (!tuteur) return false;
    const errors = tuteurErrors;
    const hasNomValid = tuteur.nom && tuteur.nom.trim().length >= 2 && !errors[`${index}_nom`];
    const hasPrenomValid = tuteur.prenom && tuteur.prenom.trim().length >= 2 && !errors[`${index}_prenom`];
    return hasNomValid && hasPrenomValid;
  };

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
        if (!value) return 'La classe est requise';
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
          const error = validateField(field, formData[field as keyof EnrollmentData]);
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
        // Étape 2 obligatoire: au moins un parent (existant ou préparé) et le contact d'urgence complet
        const hasParent = formData.pere_id || formData.mere_id || formData.tuteur_id || pereReady || mereReady || tuteursReady.some(Boolean) || parentsCopied;
        if (!hasParent) {
          errors.parents = 'Veuillez sélectionner ou préparer au moins un père, une mère ou un tuteur.';
        }
        // Exiger nom et téléphone d'urgence
        const pe = validateField('personne_urgence', formData.personne_urgence);
        const te = validateField('telephone_urgence', formData.telephone_urgence);
        if (!formData.personne_urgence) {
          errors.personne_urgence = 'Personne d\'urgence obligatoire';
        } else if (pe) {
          errors.personne_urgence = pe;
        }
        if (!formData.telephone_urgence) {
          errors.telephone_urgence = 'Téléphone d\'urgence obligatoire';
        } else if (te) {
          errors.telephone_urgence = te;
        }
        break;

      case 3:
        // Étape 3 entièrement optionnelle - aucune validation obligatoire
        // Seule validation des formats si des champs sont remplis
        const optionalStep3 = ['langues', 'groupe_sanguin', 'medicaments', 'allergies', 'maladies_chroniques', 'infos_sante', 'personne_urgence', 'telephone_urgence'];
        optionalStep3.forEach(field => {
          const value = formData[field as keyof EnrollmentData] as any;
          if (value && value !== '') { // Seulement valider si le champ est rempli
          const error = validateField(field, value);
            if (error) {
            errors[field] = error;
            }
          }
        });
        break;

      case 4:
        // Classe est maintenant optionnelle - pas de validation requise
        break;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };
  
  const nextStep = async () => {
    const validation = validateStep(currentStep);
    
    if (validation.isValid) {
      // Si on est à l'étape 1, vérifier l'unicité du CNE et CIN avant de passer à l'étape 2
      if (currentStep === 1) {
        setLoading(true);
        let hasDuplicate = false;
        
        // Vérifier le CNE
        if (formData.cne && formData.cne.trim()) {
          const cneDuplicateError = await checkDuplicate('cne', formData.cne);
          if (cneDuplicateError) {
            setFieldErrors(prev => ({ ...prev, cne: cneDuplicateError }));
            setError(cneDuplicateError);
            showError('CNE déjà utilisé', cneDuplicateError);
            hasDuplicate = true;
          }
        }
        
        // Vérifier le CIN seulement si pas de doublon CNE
        if (!hasDuplicate && formData.cin && formData.cin.trim()) {
          const cinDuplicateError = await checkDuplicate('cin', formData.cin);
          if (cinDuplicateError) {
            setFieldErrors(prev => ({ ...prev, cin: cinDuplicateError }));
            setError(cinDuplicateError);
            showError('CIN déjà utilisé', cinDuplicateError);
            hasDuplicate = true;
          }
        }
        
        setLoading(false);
        
        // Si il y a des doublons, ne pas passer à l'étape suivante
        if (hasDuplicate) {
          return;
        }
      }
      
      // Si tout est OK, passer à l'étape suivante
      setCurrentStep(prev => Math.min(prev + 1, 4));
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
  
  const submitEnrollment = async () => {
    // Validation finale de toutes les étapes
    const step1Validation = validateStep(1);
    const step2Validation = validateStep(2);
    const step4Validation = validateStep(4);
    
    if (!step1Validation.isValid || !step2Validation.isValid || !step4Validation.isValid) {
      const allErrors = { ...step1Validation.errors, ...step2Validation.errors, ...step4Validation.errors };
      setFieldErrors(allErrors);
      const firstError = Object.values(allErrors)[0];
      setError(firstError);
      showError('Validation échouée', firstError);
      return;
    }

    // TEMPORAIRE: Désactiver submitEnrollmentOptimized pour que l'inscription normale fonctionne
    // const usingExistingParentsOnly = !(pereReady || mereReady || tuteursReady.some(Boolean)) && (formData.pere_id || formData.mere_id || formData.tuteur_id);
    
    // if (usingExistingParentsOnly) {
    //   return submitEnrollmentOptimized();
    // }
    
    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});
      
      // La validation CNE/CIN a déjà été faite à la fin de l'étape 1
      
      // ÉTAPE 1: Créer les parents/tuteurs d'abord (s'ils sont nouveaux)
      let pereId = formData.pere_id;
      let mereId = formData.mere_id;
      let tuteurId = formData.tuteur_id;
      
      // Créer le père si nécessaire (seulement si pas de parent existant)
      if (!pereId && pereReady && newPere.nom && newPere.prenom) {
        try {
          const pereRes = await parentService.create({
            nom: newPere.nom.trim(),
            prenom: newPere.prenom.trim(),
            email: newPere.email?.trim() || '',
            telephone: newPere.telephone?.trim() || '',
            adresse: newPere.adresse?.trim() || '',
            profession: newPere.profession?.trim() || '',
            type: 'pere'
          });
          pereId = (pereRes as any)?.parent?.id || (pereRes as any)?.data?.id || (pereRes as any)?.id;
        } catch (e: any) {
          throw new Error(`Erreur création père: ${e?.message || 'Erreur inconnue'}`);
        }
      }
      
      // Créer la mère si nécessaire (seulement si pas de parent existant)
      if (!mereId && mereReady && newMere.nom && newMere.prenom) {
        try {
          const mereRes = await parentService.create({
            nom: newMere.nom.trim(),
            prenom: newMere.prenom.trim(),
            email: newMere.email?.trim() || '',
            telephone: newMere.telephone?.trim() || '',
            adresse: newMere.adresse?.trim() || '',
            profession: newMere.profession?.trim() || '',
            type: 'mere'
          });
          mereId = (mereRes as any)?.parent?.id || (mereRes as any)?.data?.id || (mereRes as any)?.id;
        } catch (e: any) {
          throw new Error(`Erreur création mère: ${e?.message || 'Erreur inconnue'}`);
        }
      }
      
      // Créer le tuteur si nécessaire (seulement si pas de tuteur existant)
      if (!tuteurId && tuteursReady.some(Boolean) && newTuteurs.length > 0 && newTuteurs[0].nom && newTuteurs[0].prenom) {
        try {
          const tuteurRes = await parentService.create({
            nom: newTuteurs[0].nom.trim(),
            prenom: newTuteurs[0].prenom.trim(),
            email: newTuteurs[0].email?.trim() || '',
            telephone: newTuteurs[0].telephone?.trim() || '',
            adresse: newTuteurs[0].adresse?.trim() || '',
            profession: newTuteurs[0].profession?.trim() || '',
            type: 'tuteur'
          });
          tuteurId = (tuteurRes as any)?.parent?.id || (tuteurRes as any)?.data?.id || (tuteurRes as any)?.id;
        } catch (e: any) {
          throw new Error(`Erreur création tuteur: ${e?.message || 'Erreur inconnue'}`);
        }
      }
      
      // ÉTAPE 2: Créer l'élève avec toutes les données
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
        photo: formData.photo || undefined,
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
        classe_id: formData.classe_id || undefined,
        cantine_id: formData.cantine_id || undefined,
        transport_id: formData.transport_id || undefined,
        active: true,
      };
      
      const studentRes = await eleveService.createEleve(studentData);
      
      const studentId = (studentRes as any)?.eleve?.id || (studentRes as any)?.data?.id || (studentRes as any)?.id;
      if (!studentId) {
        throw new Error('Impossible de récupérer l\'ID de l\'élève créé');
      }
      
      // ÉTAPE 3: Associer les parents/tuteurs à l'élève
      const allParentIds = [pereId, mereId, tuteurId].filter(Boolean) as number[];
      if (allParentIds.length > 0) {
        for (const parentId of allParentIds) {
          try {
            // Déterminer la relation et le contact principal
            let relation: 'pere' | 'mere' | 'tuteur' = 'pere';
            let contactPrincipal = false;
            
            if (parentId === pereId) {
              relation = 'pere';
              contactPrincipal = true; // Père prioritairesur mère et tuteur
            } else if (parentId === mereId) {
              relation = 'mere';
              contactPrincipal = !pereId; // Mère est contact principal si pas de père
            } else if (parentId === tuteurId) {
              relation = 'tuteur';
              contactPrincipal = !pereId && !mereId; // Tuteur est contact principal si pas de père ni mère
            }
            
            await eleveService.linkParentToEleve(studentId, { 
              parent_id: parentId,
              relation,
              contact_principal: contactPrincipal
            });
          } catch (e: any) {
            showError('Erreur parent', `Erreur lors de l'assignation du responsable: ${e?.message || 'Erreur inconnue'}`);
          }
        }
      }
      
      // ÉTAPE 4: Assigner cantine, transport (classe déjà assignée lors de la création)
      // La classe est déjà assignée lors de la création de l'élève, pas besoin de la réassigner
      
      if (formData.cantine_id) {
        try {
          await cantineService.inscrireEleve(formData.cantine_id, studentId);
        } catch (e: any) {
          showError('Erreur cantine', `Erreur lors de l'inscription à la cantine: ${e?.message || 'Erreur inconnue'}`);
        }
      }
      
      if (formData.transport_id) {
        try {
          await transportService.inscrireEleve(formData.transport_id, studentId);
        } catch (e: any) {
          showError('Erreur transport', `Erreur lors de l'inscription au transport: ${e?.message || 'Erreur inconnue'}`);
        }
      }
      
      showSuccess('Inscription réussie', `L'élève ${formData.prenom_fr} ${formData.nom_fr} a été inscrit avec succès.`);
      setSuccess('Inscription réussie');
      
      setTimeout(() => {
        navigate('/eleves');
      }, 3000);
      
    } catch (e: any) {
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (e?.message) {
        if (e.message.includes('422')) {
          errorMessage = 'Données invalides. Vérifiez les informations saisies.';
        } else if (e.message.includes('409')) {
          errorMessage = 'Un élève avec ce CNE ou CIN existe déjà.';
        } else if (e.message.includes('500')) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else if (e.message.includes('Ce CNE existe déjà') || e.message.includes('Ce CIN existe déjà')) {
          errorMessage = e.message;
          if (e.message.includes('CNE')) {
            setFieldErrors(prev => ({ ...prev, cne: 'Ce CNE existe déjà dans le système' }));
          }
          if (e.message.includes('CIN')) {
            setFieldErrors(prev => ({ ...prev, cin: 'Ce CIN existe déjà dans le système' }));
          }
        } else {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
      showError('Erreur d\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
  const steps = [
    { key: 1, title: 'Renseignement d\'identité' },
    { key: 2, title: 'Informations des parents' },
    { key: 3, title: 'Infos complémentaires & médicales' },
    { key: 4, title: 'Affectation à la classe (optionnel)' },
  ];
  
  return (
    <div className="space-y-6">
      <PageHead
        title="Inscription élève"
        subtitle="Assistant d'inscription complet"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Élèves', link: '/eleves' },
          { label: 'Nouvelle inscription', link: '/eleves/new' }
        ]}
      />
      
      {error && (
        <div className="p-4 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/30">
          <div className="flex items-center gap-2">
            <Icon name="alert" className="text-red-500 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="p-4 border border-green-200 rounded-lg dark:border-green-800 bg-green-50 dark:bg-green-900/30">
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
                    className="w-full px-3 py-2 border rounded-md"
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
                  {checkingDuplicates.cne && (
                    <p className="mt-1 text-sm text-yellow-600">Vérification en cours...</p>
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
                  {checkingDuplicates.cin && (
                    <p className="mt-1 text-sm text-yellow-600">Vérification en cours...</p>
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
                          className="w-full px-3 py-2 border rounded-md"
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
                          className="w-full px-3 py-2 border rounded-md"
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
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Informations des parents et tuteurs</h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-blue-200 rounded-lg dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="useExistingParent"
                      checked={useExistingParent}
                      onChange={(e) => setUseExistingParent(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="useExistingParent" className="text-sm font-medium text-slate-700">
                      Copier les parents d'un élève existant (frère/sœur)
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    Cochez cette option si cet élève a un frère ou une sœur déjà inscrit(e) dans l'école pour copier automatiquement les informations des parents.
                  </p>
                  
                  {useExistingParent && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                          Rechercher un élève par nom et prénom
                        </label>
                        <div className="relative">
                          <Icon name="search" className="absolute text-gray-400 transform -translate-y-1/2 dark:text-gray-500 left-3 top-1/2" />
                          <input
                            type="text"
                            placeholder="Nom et prénom de l'élève (frère/sœur)..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="w-full py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent"
                          />
                      </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Recherchez par nom ou prénom de l'élève existant
                        </p>
                      </div>

                      {studentSearchQuery.trim() && (
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                          Sélectionner le frère/sœur
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const studentId = Number(e.target.value);
                            if (studentId) {
                              copyParentsFromStudent(studentId);
                                setStudentSearchQuery(''); // Clear search after selection
                            }
                          }}
                          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Choisir un élève...</option>
                            {students
                              .filter((student) => {
                                // Exclure les élèves non affectés si une classe est sélectionnée
                                if (formData.classe_id && !student.classe_id) {
                                  return false;
                                }
                                const searchLower = studentSearchQuery.toLowerCase();
                                const nomFr = (student.nom_fr || student.nom || '').toLowerCase();
                                const prenomFr = (student.prenom_fr || student.prenom || '').toLowerCase();
                                const nomAr = (student.nom_ar || '').toLowerCase();
                                const prenomAr = (student.prenom_ar || '').toLowerCase();
                                return nomFr.includes(searchLower) || 
                                       prenomFr.includes(searchLower) ||
                                       nomAr.includes(searchLower) ||
                                       prenomAr.includes(searchLower) ||
                                       `${prenomFr} ${nomFr}`.includes(searchLower) ||
                                       `${nomFr} ${prenomFr}`.includes(searchLower);
                              })
                              .map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.prenom_fr || student.prenom} {student.nom_fr || student.nom}
                              {student.cne && ` (CNE: ${student.cne})`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {students.filter((student) => {
                              // Exclure les élèves non affectés si une classe est sélectionnée
                              if (formData.classe_id && !student.classe_id) {
                                return false;
                              }
                              const searchLower = studentSearchQuery.toLowerCase();
                              const nomFr = (student.nom_fr || student.nom || '').toLowerCase();
                              const prenomFr = (student.prenom_fr || student.prenom || '').toLowerCase();
                              const nomAr = (student.nom_ar || '').toLowerCase();
                              const prenomAr = (student.prenom_ar || '').toLowerCase();
                              return nomFr.includes(searchLower) || 
                                     prenomFr.includes(searchLower) ||
                                     nomAr.includes(searchLower) ||
                                     prenomAr.includes(searchLower) ||
                                     `${prenomFr} ${nomFr}`.includes(searchLower) ||
                                     `${nomFr} ${prenomFr}`.includes(searchLower);
                            }).length} élève(s) trouvé(s)
                        </p>
                      </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Show success when parents are copied */}
                {parentsCopied && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="check" className="text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Parents copiés avec succès</p>
                        <p className="text-xs text-green-600">Parents de {copiedStudentName} ont été assignés à ce nouvel élève</p>
                      </div>
                    </div>
                        <Button
                          variant="outline"
                          size="sm"
                        onClick={cancelParentsCopy}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Icon name="x" size="sm" />
                        <span className="ml-1">Annuler</span>
                        </Button>
                      </div>
                  </div>
                )}

                {!useExistingParent && !parentsCopied && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Logique pour désactiver/activer les formulaires */}
                  {(() => {
                    // Déterminer si on est en mode "Parents biologiques" ou "Tuteurs légaux"
                    const hasParentsMode = (pereReady || mereReady || formData.pere_id || formData.mere_id);
                    const hasTutorMode = (tuteursReady.some(Boolean) || formData.tuteur_id);
                    
                    // Désactiver les parents si tuteur activé
                    const parentsDisabled = hasTutorMode && !hasParentsMode;
                    // Désactiver tuteur si parents activés  
                    const tutorDisabled = hasParentsMode && !hasTutorMode;
                    
                    return (
                      <>
                  <div className={`p-4 border rounded-lg ${parentsDisabled ? 'opacity-50 pointer-events-none bg-gray-100' : ''}`}>
                    <h4 className="mb-2 font-medium text-slate-800 dark:text-white">Père <span className="text-gray-500 dark:text-gray-400">(optionnel)</span></h4>
                    {parentsDisabled && (
                      <div className="mb-2 text-xs text-gray-500"> Formulaire désactivé car un tuteur est sélectionné</div>
                    )}
                    {formData.pere_id ? (
                      <div className="text-sm text-green-600">✓ Père existant sélectionné</div>
                    ) : (
                      <>
                        <div className="mb-3 text-sm text-gray-500">Non assigné</div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <input 
                                value={newPere.prenom} 
                                onChange={(e) => handlePereFieldChange('prenom', e.target.value)} 
                                placeholder="Prénom *" 
                                className={getParentFieldClassName(pereErrors, 'prenom', newPere.prenom)} 
                              />
                              {pereErrors.prenom && <div className="mt-1 text-xs text-red-500">{pereErrors.prenom}</div>}
                            </div>
                            <div>
                              <input 
                                value={newPere.nom} 
                                onChange={(e) => handlePereFieldChange('nom', e.target.value)} 
                                placeholder="Nom *" 
                                className={getParentFieldClassName(pereErrors, 'nom', newPere.nom)} 
                              />
                              {pereErrors.nom && <div className="mt-1 text-xs text-red-500">{pereErrors.nom}</div>}
                            </div>
                            <div>
                              <input 
                                value={newPere.telephone} 
                                onChange={(e) => handlePereFieldChange('telephone', e.target.value)} 
                                placeholder="Téléphone" 
                                className={getParentFieldClassName(pereErrors, 'telephone', newPere.telephone)} 
                              />
                              {pereErrors.telephone && <div className="mt-1 text-xs text-red-500">{pereErrors.telephone}</div>}
                            </div>
                            <div>
                              <input 
                                type="email" 
                                value={newPere.email} 
                                onChange={(e) => handlePereFieldChange('email', e.target.value)} 
                                placeholder="Email" 
                                className={getParentFieldClassName(pereErrors, 'email', newPere.email)} 
                              />
                              {pereErrors.email && <div className="mt-1 text-xs text-red-500">{pereErrors.email}</div>}
                            </div>
                            <div>
                              <input 
                                value={newPere.profession} 
                                onChange={(e) => handlePereFieldChange('profession', e.target.value)} 
                                placeholder="Profession" 
                                className={getParentFieldClassName(pereErrors, 'profession', newPere.profession)} 
                              />
                              {pereErrors.profession && <div className="mt-1 text-xs text-red-500">{pereErrors.profession}</div>}
                            </div>
                            <div>
                              <input 
                                value={newPere.adresse} 
                                onChange={(e) => handlePereFieldChange('adresse', e.target.value)} 
                                placeholder="Adresse" 
                                className={getParentFieldClassName(pereErrors, 'adresse', newPere.adresse)} 
                              />
                              {pereErrors.adresse && <div className="mt-1 text-xs text-red-500">{pereErrors.adresse}</div>}
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setPereReady(true);
                              showSuccess('Père préparé', 'Le père sera créé lors de la finalisation.');
                            }}
                            disabled={!isParentValid(pereErrors, newPere)}
                          >
                            <Icon name="check" size="sm" />
                            <span className="ml-2">Préparer le père</span>
                          </Button>
                          {pereReady && (
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPereReady(false);
                                }}
                              >
                                <Icon name="x" size="sm" />
                                <span className="ml-1">Modifier</span>
                          </Button>
                            </div>
                          )}
                          {pereReady && (
                            <div className="text-sm text-blue-600">✓ Père préparé ({newPere.prenom} {newPere.nom})</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className={`p-4 border rounded-lg ${parentsDisabled ? 'opacity-50 pointer-events-none bg-gray-100' : ''}`}>
                    <h4 className="mb-2 font-medium text-slate-800 dark:text-white">Mère <span className="text-gray-500 dark:text-gray-400">(optionnel)</span></h4>
                    {parentsDisabled && (
                      <div className="mb-2 text-xs text-gray-500"> Formulaire désactivé car un tuteur est sélectionné</div>
                    )}
                    {formData.mere_id ? (
                      <div className="text-sm text-green-600">✓ Mère existante sélectionnée</div>
                    ) : (
                      <>
                        <div className="mb-3 text-sm text-gray-500">Non assignée</div>
                      <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <input 
                                value={newMere.prenom} 
                                onChange={(e) => handleMereFieldChange('prenom', e.target.value)} 
                                placeholder="Prénom *" 
                                className={getParentFieldClassName(mereErrors, 'prenom', newMere.prenom)} 
                              />
                              {mereErrors.prenom && <div className="mt-1 text-xs text-red-500">{mereErrors.prenom}</div>}
                            </div>
                            <div>
                              <input 
                                value={newMere.nom} 
                                onChange={(e) => handleMereFieldChange('nom', e.target.value)} 
                                placeholder="Nom *" 
                                className={getParentFieldClassName(mereErrors, 'nom', newMere.nom)} 
                              />
                              {mereErrors.nom && <div className="mt-1 text-xs text-red-500">{mereErrors.nom}</div>}
                            </div>
                            <div>
                              <input 
                                value={newMere.telephone} 
                                onChange={(e) => handleMereFieldChange('telephone', e.target.value)} 
                                placeholder="Téléphone" 
                                className={getParentFieldClassName(mereErrors, 'telephone', newMere.telephone)} 
                              />
                              {mereErrors.telephone && <div className="mt-1 text-xs text-red-500">{mereErrors.telephone}</div>}
                            </div>
                            <div>
                              <input 
                                type="email" 
                                value={newMere.email} 
                                onChange={(e) => handleMereFieldChange('email', e.target.value)} 
                                placeholder="Email" 
                                className={getParentFieldClassName(mereErrors, 'email', newMere.email)} 
                              />
                              {mereErrors.email && <div className="mt-1 text-xs text-red-500">{mereErrors.email}</div>}
                            </div>
                            <div>
                              <input 
                                value={newMere.profession} 
                                onChange={(e) => handleMereFieldChange('profession', e.target.value)} 
                                placeholder="Profession" 
                                className={getParentFieldClassName(mereErrors, 'profession', newMere.profession)} 
                              />
                              {mereErrors.profession && <div className="mt-1 text-xs text-red-500">{mereErrors.profession}</div>}
                            </div>
                            <div>
                              <input 
                                value={newMere.adresse} 
                                onChange={(e) => handleMereFieldChange('adresse', e.target.value)} 
                                placeholder="Adresse" 
                                className={getParentFieldClassName(mereErrors, 'adresse', newMere.adresse)} 
                              />
                              {mereErrors.adresse && <div className="mt-1 text-xs text-red-500">{mereErrors.adresse}</div>}
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setMereReady(true);
                              showSuccess('Mère préparée', 'La mère sera créée lors de la finalisation.');
                            }}
                            disabled={!isParentValid(mereErrors, newMere)}
                          >
                            <Icon name="check" size="sm" />
                            <span className="ml-2">Préparer la mère</span>
                          </Button>
                          {mereReady && (
                            <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMereReady(false);
                          }}
                        >
                          <Icon name="x" size="sm" />
                          <span className="ml-1">Modifier</span>
                        </Button>
                      </div>
                          )}
                          {mereReady && (
                            <div className="text-sm text-blue-600">✓ Mère préparée ({newMere.prenom} {newMere.nom})</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className={`p-4 border rounded-lg ${tutorDisabled ? 'opacity-50 pointer-events-none bg-gray-100' : ''}`}>
                    <h4 className="mb-2 font-medium text-slate-800 dark:text-white">Tuteur <span className="text-gray-500 dark:text-gray-400">(optionnel)</span></h4>
                    {tutorDisabled && (
                      <div className="mb-2 text-xs text-gray-500"> Formulaire désactivé car des parents sont sélectionnés</div>
                    )}
                    {formData.tuteur_id ? (
                      <div className="text-sm text-green-600">✓ Tuteur existant sélectionné</div>
                    ) : (
                      <>
                        <div className="mb-3 text-sm text-gray-500">Non assigné</div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <input 
                                value={newTuteurs.length > 0 ? newTuteurs[0].prenom : ''} 
                                onChange={(e) => handleTuteurFieldChange('prenom', e.target.value, 0)} 
                                placeholder="Prénom *" 
                                className={getParentFieldClassName(tuteurErrors, 'prenom', newTuteurs[0]?.prenom || '')} 
                              />
                              {tuteurErrors['0_prenom'] && <div className="mt-1 text-xs text-red-500">{tuteurErrors['0_prenom']}</div>}
                            </div>
                            <div>
                              <input 
                                value={newTuteurs.length > 0 ? newTuteurs[0].nom : ''} 
                                onChange={(e) => handleTuteurFieldChange('nom', e.target.value, 0)} 
                                placeholder="Nom *" 
                                className={getParentFieldClassName(tuteurErrors, 'nom', newTuteurs[0]?.nom || '')} 
                              />
                              {tuteurErrors['0_nom'] && <div className="mt-1 text-xs text-red-500">{tuteurErrors['0_nom']}</div>}
                            </div>
                            <div>
                              <input 
                                value={newTuteurs.length > 0 ? newTuteurs[0].telephone : ''} 
                                onChange={(e) => handleTuteurFieldChange('telephone', e.target.value, 0)} 
                                placeholder="Téléphone" 
                                className={getParentFieldClassName(tuteurErrors, 'telephone', newTuteurs[0]?.telephone || '')} 
                              />
                              {tuteurErrors['0_telephone'] && <div className="mt-1 text-xs text-red-500">{tuteurErrors['0_telephone']}</div>}
                            </div>
                            <div>
                              <input 
                                type="email" 
                                value={newTuteurs.length > 0 ? newTuteurs[0].email : ''} 
                                onChange={(e) => handleTuteurFieldChange('email', e.target.value, 0)} 
                                placeholder="Email" 
                                className={getParentFieldClassName(tuteurErrors, 'email', newTuteurs[0]?.email || '')} 
                              />
                              {tuteurErrors['0_email'] && <div className="mt-1 text-xs text-red-500">{tuteurErrors['0_email']}</div>}
                            </div>
                            <div>
                              <input 
                                value={newTuteurs.length > 0 ? newTuteurs[0].profession : ''} 
                                onChange={(e) => handleTuteurFieldChange('profession', e.target.value, 0)} 
                                placeholder="Profession" 
                                className={getParentFieldClassName(tuteurErrors, 'profession', newTuteurs[0]?.profession || '')} 
                              />
                              {tuteurErrors['0_profession'] && <div className="mt-1 text-xs text-red-500">{tuteurErrors['0_profession']}</div>}
                            </div>
                            <div>
                              <input 
                                value={newTuteurs.length > 0 ? newTuteurs[0].adresse : ''} 
                                onChange={(e) => handleTuteurFieldChange('adresse', e.target.value, 0)} 
                                placeholder="Adresse" 
                                className={getParentFieldClassName(tuteurErrors, 'adresse', newTuteurs[0]?.adresse || '')} 
                              />
                              {tuteurErrors['0_adresse'] && <div className="mt-1 text-xs text-red-500">{tuteurErrors['0_adresse']}</div>}
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              if (isTuteurValid(0)) {
                                const updatedReady = [...tuteursReady];
                                updatedReady[0] = true;
                                setTuteursReady(updatedReady);
                                showSuccess('Tuteur préparé', 'Le tuteur sera créé lors de la finalisation.');
                              }
                            }}
                            disabled={!isTuteurValid(0)}
                          >
                            <Icon name="check" size="sm" />
                            <span className="ml-2">Préparer le tuteur</span>
                          </Button>
                          {newTuteurs.length > 0 && tuteursReady[0] && (
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updatedReady = [...tuteursReady];
                                  updatedReady[0] = false;
                                  setTuteursReady(updatedReady);
                                }}
                              >
                                <Icon name="x" size="sm" />
                                <span className="ml-1">Modifier</span>
                          </Button>
                            </div>
                          )}
                          {newTuteurs.length > 0 && tuteursReady[0] && (
                            <div className="text-sm text-blue-600">✓ Tuteur préparé ({newTuteurs[0].prenom} {newTuteurs[0].nom})</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  </>
                    );
                  })()}
                  </div>
                )}

                {/* Messages d'information sur le mode sélectionné */}
                {!useExistingParent && !parentsCopied && (
                  <div className="mt-4 space-y-2">
                    {(() => {
                      const hasParentsMode = (pereReady || mereReady || formData.pere_id || formData.mere_id);
                      const hasTutorMode = (tuteursReady.some(Boolean) || formData.tuteur_id);
                      
                      
                      if (!hasParentsMode && !hasTutorMode) {
                        return (
                          <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                            <div className="flex items-center gap-2">
                              <Icon name="alert" className="text-orange-500" />
                              <span className="text-sm text-orange-800">
                                 Veuillez sélectionner au moins un responsable légal (père, mère ou tuteur)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}

                  </div>
                )}
                  
                {/* Contact d'urgence section */}
                <div className="p-4 mt-6 border border-yellow-200 rounded-lg dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30">
                  <h4 className="mb-4 font-semibold text-md text-slate-800 dark:text-white">Contact d'urgence</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Nom du contact d'urgence</label>
                      <input
                        type="text"
                        value={formData.personne_urgence || ''}
                        onChange={(e) => handleInputChange('personne_urgence', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Nom et prénom du contact"
                      />
                          </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Téléphone d'urgence</label>
                      <input
                        type="tel"
                        value={formData.telephone_urgence || ''}
                        onChange={(e) => handleInputChange('telephone_urgence', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Numéro de téléphone"
                      />
                        </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Personne à contacter en cas d'urgence (peut être différente des parents)</p>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Informations complémentaires et santé</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toutes ces informations sont <strong className="dark:text-white">optionnelles</strong> - vous pouvez passer cette étape sans rien remplir</p>

              {/* Informations complémentaires */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                <h4 className="mb-4 font-semibold text-md text-slate-800 dark:text-white">Informations Complémentaires</h4>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-medium text-slate-700">Quelle(s) langue(s) à la maison ?</div>
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
                            className="accent-primary-600"
                          />
                          {L}
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
                            <input type="radio" name="cours_particuliers" className="accent-primary-600" onChange={() => handleInputChange('infos_sante', `${formData.infos_sante || ''}\nCours particuliers: ${v}`.trim())} /> {v}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Votre enfant est-il aidé dans son travail scolaire ?</label>
                      <div className="flex items-center gap-6 text-sm">
                        {['Non','Oui'].map(v => (
                          <label key={v} className="inline-flex items-center gap-2">
                            <input type="radio" name="aide_scolaire" className="accent-primary-600" onChange={() => handleInputChange('infos_sante', `${formData.infos_sante || ''}\nAide scolaire: ${v}`.trim())} /> {v}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations médicales */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
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
                      <div className="mb-2 text-sm">{q}</div>
                      <div className="flex items-center gap-6 text-sm">
                        {['Non','Oui'].map(v => (
                          <label key={v} className="inline-flex items-center gap-2">
                            <input type="radio" name={`mq_${idx}`} className="accent-primary-600" onChange={() => handleInputChange('infos_sante', `${formData.infos_sante || ''}\n${q}: ${v}`.trim())} /> {v}
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
          
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Classe et services</h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Niveau </label>
                  <select
                    value={selectedNiveau}
                    onChange={(e) => {
                      const niveauNom = e.target.value;
                      setSelectedNiveau(niveauNom);
                      // reset classe if it doesn't belong to the chosen niveau
                      const belongs = (classes || []).some((c: any) => {
                        const niveauNomClasse = typeof c.niveau === 'object' && c.niveau ? c.niveau.nom : c.niveau;
                        return niveauNomClasse === niveauNom && c.id === formData.classe_id;
                      });
                      if (!belongs) {
                        handleInputChange('classe_id', '');
                      }
                    }}
                    className={getFieldClassName('classe_id')}
                  >
                    <option value="">Sélectionner un niveau</option>
                    {niveaux.map((n: any) => (
                      <option key={n.id || n.nom} value={n.nom}>{n.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Classe </label>
                  <select
                    value={formData.classe_id || ''}
                    onChange={(e) => handleInputChange('classe_id', Number(e.target.value))}
                    className={getFieldClassName('classe_id')}
                  >
                    <option value="">Sélectionner une classe</option>
                    {(classes || [])
                      .filter((c: any) => {
                        if (!selectedNiveau) return true;
                        const niveauNomClasse = typeof c.niveau === 'object' && c.niveau ? c.niveau.nom : c.niveau;
                        return niveauNomClasse === selectedNiveau;
                      })
                      .map((classe) => (
                        <option key={classe.id} value={classe.id}>
                          {classe.nom_complet || classe.nom}
                        </option>
                      ))}
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
                    className="w-full px-3 py-2 border rounded-md"
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
                    className="w-full px-3 py-2 border rounded-md"
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
        
        {currentStep < 4 ? (
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
            onClick={submitEnrollment}
            disabled={loading || !validateStep(4)}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                <span className="ml-2">Inscription en cours...</span>
              </>
            ) : (
              <>
                <Icon name="check" size="sm" />
                <span className="ml-2">Finaliser l'inscription</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EleveNew;

