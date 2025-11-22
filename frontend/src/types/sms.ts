// Types for SMS/Messages functionality

export interface SmsNotification {
  id: number;
  destinataire_type: 'eleve' | 'parent' | 'classe' | 'niveau' | 'tous' | 'personnalise';
  destinataire_id?: number | null;
  telephone?: string | null;
  message: string;
  statut: 'en_attente' | 'envoye' | 'livre' | 'echoue';
  date_envoi: string;
  date_livraison?: string | null;
  type?: 'absence' | 'note' | 'paiement' | 'activite' | 'general';
  urgent?: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  destinataire_info?: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    classe_nom?: string;
  };
}

export interface SmsSendRequest {
  destinataire_type: 'eleve' | 'parent' | 'classe' | 'niveau' | 'tous' | 'personnalise';
  destinataire_id?: number | null;
  message: string;
  numeros_personnalises?: string[];
}

export interface SmsHistoryResponse {
  success: boolean;
  data: SmsNotification[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface SmsSendResponse {
  success: boolean;
  message: string;
  data: SmsNotification;
}

export interface SmsHistoryFilters {
  destinataire_type?: string;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface RecipientOption {
  type: 'eleve' | 'parent' | 'classe' | 'niveau' | 'tous' | 'personnalise';
  label: string;
  id?: number;
  count?: number;
  description?: string;
}

export interface SmsStatistics {
  total: number;
  envoyes: number;
  en_attente: number;
  echoues: number;
  taux_succes: number;
}
