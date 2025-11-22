// Base interfaces first
export interface Role {
  id: number;
  nom: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  name: string;
  email: string;
  phone?: string;
  email_verified_at?: string;
  role_id?: number;
  role?: Role;
  created_at: string;
  updated_at: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: string | { id: number; nom: string };
  annee_scolaire?: string;
  section?: string;
  capacite?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ParentEleve {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  profession?: string;
  type?: 'pere' | 'mere' | 'tuteur';
  relation?: string;
  contact_principal?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Discipline {
  id: number;
  nom: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  eleve_id: number;
  discipline_id: number;
  professeur_id: number;
  note: number;
  coefficient: number;
  type: string;
  date: string;
  commentaire?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  discipline?: Discipline;
  professeur?: Professeur;
}

export interface Absence {
  id: number;
  eleve_id: number;
  date: string;
  heure_debut?: string;
  heure_fin?: string;
  motif?: string;
  justifiee: boolean;
  created_at: string;
  updated_at: string;
}

export interface EleveListResponse {
  success: boolean;
  data: Eleve[];
  message?: string;
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface Paiement {
  id: number;
  eleve_id: number;
  montant: number;
  type: string;
  date_paiement: string;
  mois?: string;
  annee?: number;
  statut: string;
  mode_paiement?: string;
  reference?: string;
  commentaire?: string;
  created_at: string;
  updated_at: string;
}

// Main Eleve interface after all dependencies are defined
export interface Eleve {
  id: number;
  nom?: string; // legacy
  prenom?: string; // legacy
  nom_fr?: string;
  prenom_fr?: string;
  nom_ar?: string;
  prenom_ar?: string;
  date_naissance: string;
  lieu_naissance_fr?: string;
  lieu_naissance_ar?: string;
  sexe?: 'M' | 'F';
  matricule?: string;
  cne?: string;
  cin?: string;
  photo?: string;
  adresse?: string;
  ancienne_ecole?: string;
  type_ecole?: string;
  statut_ecole?: string;
  nationalite?: string;
  langues?: string[];
  infos_sante?: string;
  groupe_sanguin?: string;
  allergies?: string;
  maladies_chroniques?: string;
  medicaments?: string;
  personne_urgence?: string;
  telephone_urgence?: string;
  classe_id?: number;
  cantine_id?: number | null;
  transport_id?: number | null;
  date_inscription?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  classe?: Classe;
  cantine?: Cantine;
  transport?: Transport;
  parents?: ParentEleve[];
  notes?: Note[];
  absences?: Absence[];
  paiements?: Paiement[];
  
  // Données des responsables légaux (pour l'affichage)
  pere?: {
    nom: string;
    prenom: string;
    telephone: string;
    profession: string;
    email: string;
  };
  mere?: {
    nom: string;
    prenom: string;
    telephone: string;
    profession: string;
    email: string;
  };
  tuteur?: {
    nom: string;
    prenom: string;
    telephone: string;
    profession: string;
    email: string;
    relation: string;
  };
  
  // Données des services (pour l'affichage)
  transport_info?: {
    souscrit: boolean;
    ligne: string;
    chauffeur: string;
    telephone_chauffeur: string;
    heure_depart: string;
    heure_retour: string;
  };
  cantine_info?: {
    souscrit: boolean;
    nom: string;
    regime: string;
    allergies_alimentaires: string;
    repas_speciaux: string;
  };
  
  // Computed attributes
  age?: number;
  nom_complet?: string;
}

// Form data types
export interface EleveFormData {
  nom_fr?: string;
  prenom_fr?: string;
  nom_ar?: string;
  prenom_ar?: string;
  date_naissance: string;
  lieu_naissance_fr?: string;
  lieu_naissance_ar?: string;
  sexe?: 'M' | 'F';
  matricule?: string;
  cne?: string;
  cin?: string;
  photo?: string;
  adresse?: string;
  ancienne_ecole?: string;
  nationalite?: string;
  langues?: string[];
  infos_sante?: string;
  groupe_sanguin?: string;
  allergies?: string;
  personne_urgence?: string;
  classe_id?: number;
  date_inscription?: string;
  active: boolean;
}

export interface Transport {
  id: number;
  ligne: string;
  matricule?: string;
  capacite: number;
  chauffeur_id?: number;
  accompagnateur_id?: number;
  created_at: string;
  updated_at: string;
  // Relations
  chauffeur?: Chauffeur;
  accompagnateur?: Accompagnateur;
  eleves?: Pick<Eleve, 'id' | 'nom' | 'prenom' | 'nom_fr' | 'prenom_fr' | 'matricule'>[];
}

export interface Chauffeur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  permis: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Accompagnateur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cantine {
  id: number;
  nom: string;
  capacite: number;
  localisation: string;
  created_at?: string;
  updated_at?: string;
  // relations (optional when included)
  menus?: MenuItem[];
  eleves?: Pick<Eleve, 'id' | 'nom' | 'prenom' | 'nom_fr' | 'prenom_fr' | 'matricule'>[];
}

export interface MenuItem {
  id: number;
  cantine_id: number;
  jour: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
  plat_principal: string;
  entree?: string;
  dessert?: string;
  boisson?: string;
  date_menu?: string;
  cantine?: Cantine;
}

// API response types
export interface EleveListResponse {
  data: Eleve[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface EleveResponse {
  eleve: Eleve;
}

export interface EleveCreateResponse {
  message: string;
  eleve: Eleve;
}

export interface EleveUpdateResponse {
  message: string;
  eleve: Eleve;
}

export interface EleveDeleteResponse {
  message: string;
}
