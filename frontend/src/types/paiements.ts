export interface FraisScolaire {
  id: number;
  type: 'scolarite' | 'cantine' | 'transport';
  nom: string;
  description?: string;
  montant_mensuel: number;
  niveau_id?: number;
  annee_scolaire_id: number;
  obligatoire: boolean;
  active: boolean;
  niveau?: {
    id: number;
    nom: string;
  };
  annee_scolaire?: {
    id: number;
    nom: string;
  };
  type_label: string;
}

export interface FraisScolaireFormData {
  type: 'scolarite' | 'cantine' | 'transport';
  nom: string;
  description?: string;
  montant_mensuel: number;
  niveau_id?: number;
  obligatoire?: boolean;
}

export interface FraisScolaireResponse {
  success: boolean;
  data: FraisScolaire[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface StatistiquesFraisResponse {
  success: boolean;
  data: {
    total_frais: number;
    total_paiements: number;
    montant_total_du: number;
    montant_total_paye: number;
    montant_total_restant: number;
    paiements_regles: number;
    paiements_en_retard: number;
  };
}

export interface PaiementEleve {
  id: number;
  eleve_id: number;
  frais_scolaire_id: number;
  mois: string;
  montant_du: number;
  montant_paye: number;
  montant_restant: number;
  statut: 'en_attente' | 'partiel' | 'regle' | 'en_retard';
  date_echeance?: string;
  annee_scolaire_id: number;
  active: boolean;
  eleve?: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
    nom_fr?: string;
    prenom_fr?: string;
    matricule?: string;
    classe?: {
      id: number;
      nom: string;
      niveau?: {
        id: number;
        nom: string;
      };
    };
  };
  frais_scolaire?: {
    id: number;
    type: string;
    nom: string;
    type_label: string;
  };
  annee_scolaire?: {
    id: number;
    nom: string;
  };
  historique_paiements?: HistoriquePaiement[];
  statut_label: string;
}

export interface HistoriquePaiement {
  id: number;
  paiement_eleve_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  reference?: string;
  notes?: string;
  utilisateur_id?: number;
  annee_scolaire_id: number;
  mode_paiement_label: string;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

export interface PaiementEleveFormData {
  montant: number;
  mode_paiement: 'especes' | 'virement' | 'cheque';
  reference?: string;
  notes?: string;
}

export interface PaiementEleveResponse {
  success: boolean;
  data: PaiementEleve[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface PaiementsEleveResponse {
  success: boolean;
  data: {
    eleve: {
      id: number;
      nom: string;
      prenom: string;
      nom_complet: string;
      classe?: {
        id: number;
        nom: string;
        niveau?: {
          id: number;
          nom: string;
        };
      };
    };
    paiements: PaiementEleve[];
    totaux: {
      total_du: number;
      total_paye: number;
      total_restant: number;
      paiements_regles: number;
      paiements_en_retard: number;
    };
  };
}

export interface StatistiquesPaiementsResponse {
  success: boolean;
  data: {
    total_paiements: number;
    montant_total_du: number;
    montant_total_paye: number;
    montant_total_restant: number;
    par_statut: {
      en_attente: number;
      partiel: number;
      regle: number;
      en_retard: number;
    };
    par_type: {
      scolarite: number;
      cantine: number;
      transport: number;
    };
  };
}
