import type { 
  SmsNotification, 
  SmsSendRequest, 
  SmsHistoryResponse, 
  SmsSendResponse,
  SmsHistoryFilters,
  SmsStatistics
} from '../types/sms';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class SmsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (response.status === 422 && errorData.errors) {
            const fields = Object.values(errorData.errors).flat() as string[];
            errorMessage = fields.length ? `Validation: ${fields.join(' | ')}` : errorData.message || errorMessage;
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          // Ignore JSON parsing errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Une erreur est survenue lors de la requête');
    }
  }

  /**
   * Envoyer un SMS
   */
  async send(data: SmsSendRequest): Promise<SmsSendResponse> {
    return this.request<SmsSendResponse>('/v1/sms/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Récupérer l'historique des SMS avec filtres
   */
  async getHistory(filters?: SmsHistoryFilters): Promise<SmsHistoryResponse> {
    const params = new URLSearchParams();
    
    if (filters?.destinataire_type) params.append('destinataire_type', filters.destinataire_type);
    if (filters?.statut) params.append('statut', filters.statut);
    if (filters?.date_debut) params.append('date_debut', filters.date_debut);
    if (filters?.date_fin) params.append('date_fin', filters.date_fin);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/v1/sms/history?${queryString}` : '/v1/sms/history';
    
    return this.request<SmsHistoryResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Calculer les statistiques depuis les données
   */
  calculateStatistics(messages: SmsNotification[]): SmsStatistics {
    const total = messages.length;
    const envoyes = messages.filter(m => m.statut === 'envoye' || m.statut === 'livre').length;
    const en_attente = messages.filter(m => m.statut === 'en_attente').length;
    const echoues = messages.filter(m => m.statut === 'echoue').length;
    const taux_succes = total > 0 ? (envoyes / total) * 100 : 0;

    return {
      total,
      envoyes,
      en_attente,
      echoues,
      taux_succes,
    };
  }

  /**
   * Format date pour affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Format short date
   */
  formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Get status color classes
   */
  getStatutColor(statut: string): string {
    const colors = {
      envoye: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      livre: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      en_attente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      echoue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  /**
   * Get status label
   */
  getStatutLabel(statut: string): string {
    const labels = {
      envoye: 'Envoyé',
      livre: 'Livré',
      en_attente: 'En attente',
      echoue: 'Échoué',
    };
    return labels[statut as keyof typeof labels] || statut;
  }

  /**
   * Get recipient type label
   */
  getDestinataireTypeLabel(type: string): string {
    const labels = {
      eleve: 'Élève',
      parent: 'Parent',
      classe: 'Classe',
      niveau: 'Niveau',
      tous: 'Tous',
      personnalise: 'Personnalisé',
    };
    return labels[type as keyof typeof labels] || type;
  }

  /**
   * Calculate SMS segments (160 chars per segment)
   */
  calculateSegments(message: string): number {
    if (!message) return 0;
    return Math.ceil(message.length / 160);
  }

  /**
   * Get character count info
   */
  getCharacterInfo(message: string): { length: number; segments: number; remaining: number } {
    const length = message.length;
    const segments = this.calculateSegments(message);
    const remaining = segments * 160 - length;
    
    return { length, segments, remaining };
  }
}

export const smsService = new SmsService();
