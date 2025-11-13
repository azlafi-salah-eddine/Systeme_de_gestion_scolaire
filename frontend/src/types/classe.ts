// Types pour les classes - Version complète avec toutes les nouvelles fonctionnalités

export interface AnneeScolaire {
  id: number;
  nom: string;
  annee_debut: number;
  annee_fin: number;
  date_debut: string;
  date_fin: string;
  active: boolean;
  description?: string;
  nom_formate: string;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  classes?: Classe[];
  eleves?: Eleve[];
  paiements?: Paiement[];
  notes?: Note[];
  
  // Statistiques (calculées à la volée)
  statistiques?: {
    nombre_classes: number;
    nombre_eleves: number;
    nombre_paiements: number;
    nombre_notes: number;
  };
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
  
  // Relations optionnelles
  classes?: Classe[];
  matieres?: Matiere[];
}

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
  nationalite?: string;
  langues?: string[];
  infos_sante?: string;
  groupe_sanguin?: string;
  allergies?: string;
  personne_urgence?: string;
  classe_id?: number;
  date_inscription: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  classe?: Classe;
  parent?: ParentEleve;
  parents?: ParentEleve[];
  notes?: Note[];
  absences?: Absence[];
  paiements?: Paiement[];
  
  // Computed attributes
  age?: number;
  nom_complet?: string;
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  professeurs?: Professeur[];
  classes?: Classe[];
}

export interface EmploiDuTemps {
  id: number;
  classe_id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  matiere_id: number;
  professeur_id: number;
  salle_id?: number;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  classe?: Classe;
  matiere?: Matiere;
  professeur?: Professeur;
}

export interface Note {
  id: number;
  eleve_id: number;
  matiere_id: number;
  classe_id: number;
  annee_scolaire_id: number;
  note: number;
  coefficient: number;
  type_evaluation: string;
  date_evaluation: string;
  commentaire?: string;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  eleve?: Eleve;
  matiere?: Matiere;
  classe?: Classe;
  annee_scolaire?: AnneeScolaire;
}

export interface Absence {
  id: number;
  eleve_id: number;
  classe_id: number;
  date: string;
  heure_debut?: string;
  heure_fin?: string;
  motif?: string;
  justifiee: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  eleve?: Eleve;
  classe?: Classe;
}

export interface Paiement {
  id: number;
  eleve_id: number;
  annee_scolaire_id: number;
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
  
  // Relations optionnelles
  eleve?: Eleve;
  annee_scolaire?: AnneeScolaire;
}

export interface ParentEleve {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  profession?: string;
  relation?: string;
  contact_principal?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  section: string;
  annee_scolaire: string; // Legacy field
  annee_scolaire_id?: number;
  capacite: number;
  salle_id?: number;
  professeur_principal_id?: number;
  active: boolean;
  nom_complet: string;
  nom_court: string;
  nombre_eleves: number;
  taux_occupation: number;
  est_complete: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  annee_scolaire_detail?: AnneeScolaire;
  professeur_principal?: Professeur;
  eleves?: Eleve[];
  professeurs?: Professeur[];
  matieres?: Matiere[];
  emplois_du_temps?: EmploiDuTemps[];
  notes?: Note[];
  absences?: Absence[];
  
  // Statistiques (calculées à la volée)
  statistiques?: ClasseStatistiques;
}

export interface ClasseStatistiques {
  nombre_eleves: number;
  capacite: number;
  taux_occupation: number;
  est_complete: boolean;
  nombre_professeurs: number;
  nombre_matieres: number;
  moyenne_generale?: number;
  nombre_absences?: number;
  taux_absentisme?: number;
}

// Types pour les requêtes
export interface ClasseCreatePayload {
  nom: string;
  niveau: string;
  annee_scolaire_id: number;
  section: string;
  capacite: number;
  salle_id?: number;
  professeur_principal_id?: number;
  active?: boolean;
}

export interface ClasseUpdatePayload extends Partial<ClasseCreatePayload> {}

export interface ClasseFilters {
  search?: string;
  annee_scolaire_id?: number;
  niveau?: string;
  active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Types pour les réponses API
export interface ClasseResponse {
  success: boolean;
  data: Classe;
  message?: string;
}

export interface ClassesResponse {
  success: boolean;
  data: Classe[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ClasseStatistiquesResponse {
  success: boolean;
  data: ClasseStatistiques;
}

// Types pour les actions sur les classes
export interface InscrireElevePayload {
  eleve_id: number;
}

export interface AssignerProfesseurPayload {
  professeur_id: number;
  matiere_id: number;
}

export interface AssignerProfesseurPrincipalPayload {
  professeur_id: number;
}

export interface DupliquerClassesPayload {
  annee_scolaire_destination_id: number;
  niveaux?: string[];
  inclure_eleves?: boolean;
  inclure_professeurs?: boolean;
}

// Types pour les réponses des actions
export interface InscrireEleveResponse {
  success: boolean;
  message: string;
  data?: Eleve;
}

export interface DesinscrireEleveResponse {
  success: boolean;
  message: string;
}

export interface AssignerProfesseurResponse {
  success: boolean;
  message: string;
}

export interface RetirerProfesseurResponse {
  success: boolean;
  message: string;
}

export interface AssignerProfesseurPrincipalResponse extends ClasseResponse {}

export interface RetirerProfesseurPrincipalResponse extends ClasseResponse {}

export interface ToggleActiveResponse extends ClasseResponse {}

// Types pour la gestion par année scolaire
export interface ClassesParAnneeScolaireResponse {
  success: boolean;
  data: Classe[];
  meta: {
    annee_scolaire: AnneeScolaire;
    total_classes: number;
    total_eleves: number;
  };
}

export interface ClassesDetailleesResponse {
  success: boolean;
  data: Classe[];
  meta: {
    annee_scolaire: AnneeScolaire;
    statistiques: {
      total_classes: number;
      total_eleves: number;
      classes_actives: number;
      classes_completes: number;
      taux_occupation_moyen: number;
      par_niveau: Record<string, {
        nombre_classes: number;
        nombre_eleves: number;
        taux_occupation_moyen: number;
      }>;
    };
  };
}

export interface DupliquerClassesResponse {
  success: boolean;
  message: string;
  data: Classe[];
  meta: {
    annee_source: AnneeScolaire;
    annee_destination: AnneeScolaire;
    nombre_classes_dupliquees: number;
  };
}

export interface StatistiquesAnneeScolaireResponse {
  success: boolean;
  data: {
    annee_scolaire: AnneeScolaire;
    resume: {
      total_classes: number;
      classes_actives: number;
      total_eleves: number;
      capacite_totale: number;
      taux_occupation_moyen: number;
      classes_completes: number;
    };
    par_niveau: Array<{
      niveau: string;
      nombre_classes: number;
      classes_actives: number;
      total_eleves: number;
      capacite_totale: number;
      taux_occupation_moyen: number;
      classes_completes: number;
    }>;
    par_section: Array<{
      section: string;
      nombre_classes: number;
      total_eleves: number;
      taux_occupation_moyen: number;
    }>;
    professeurs: {
      total_professeurs_uniques: number;
      professeurs_principaux: number;
    };
  };
}

export interface ArchiverClassesResponse {
  success: boolean;
  message: string;
  meta: {
    annee_scolaire: AnneeScolaire;
    nombre_classes_archivees: number;
  };
}

export interface ReactiverClassesResponse {
  success: boolean;
  message: string;
  meta: {
    annee_scolaire: AnneeScolaire;
    nombre_classes_reactives: number;
  };
}

// Types pour les formulaires
export interface ClasseFormData {
  nom: string;
  niveau: string;
  annee_scolaire_id: number;
  section: string;
  capacite: number;
  salle_id?: number;
  professeur_principal_id?: number;
  active: boolean;
}

// Types pour les options de sélection
export interface ClasseOption {
  value: number;
  label: string;
  niveau: string;
  section: string;
  annee_scolaire: string;
  capacite: number;
  nombre_eleves: number;
  est_complete: boolean;
}

export interface NiveauOption {
  value: string;
  label: string;
}

export interface SectionOption {
  value: string;
  label: string;
}
