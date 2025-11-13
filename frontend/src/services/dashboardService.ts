import api from './api';

export interface DashboardStatistics {
  eleves: number;
  classes: number;
  professeurs: number;
  parents: number;
  matieres: number;
  niveaux: number;
  cantines: number;
  menus: number;
  transports: number;
  chauffeurs: number;
  accompagnateurs: number;
  salles: number;
  activites: number;
  paiements: number;
  controles: number;
  periodes: number;
  notes: number;
  absences: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStatistics;
  annee_scolaire?: {
    id: number;
    nom: string;
    active: boolean;
  };
  message?: string;
  error?: string;
}

class DashboardService {
  /**
   * Récupère toutes les statistiques du dashboard en une seule requête optimisée
   */
  async getStatistics(): Promise<DashboardResponse> {
    try {
      const response = await api.get('/v1/dashboard/statistics');
      let data = response.data;
      
      // Si data est une string JSON, la parser
      if (typeof data === 'string') {
        try {
          // Supprimer le BOM (Byte Order Mark) et autres caractères invisibles
          data = data.replace(/^[\uFEFF\u200B-\u200D\uFEFF]/, '').trim();
          
          // Si ça commence encore par un caractère invisible, essayer de le supprimer
          if (data.charCodeAt(0) === 65279) {
            data = data.substring(1);
          }
          
          data = JSON.parse(data);
        } catch (e) {
          throw new Error('Réponse JSON invalide');
        }
      }
      
      // Si la réponse a déjà la structure attendue
      if (data && data.success !== undefined) {
        return data;
      }
      
      // Si la réponse n'a pas de champ 'success', c'est que l'API retourne directement les données
      const formattedResponse = {
        success: true,
        data: data,
        annee_scolaire: data.annee_scolaire
      };
      return formattedResponse;
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Aucune année scolaire active',
          data: this.getEmptyStatistics()
        };
      }
      
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  }

  /**
   * Retourne des statistiques vides en cas d'erreur
   */
  private getEmptyStatistics(): DashboardStatistics {
    return {
      eleves: 0,
      classes: 0,
      professeurs: 0,
      parents: 0,
      matieres: 0,
      niveaux: 0,
      cantines: 0,
      menus: 0,
      transports: 0,
      chauffeurs: 0,
      accompagnateurs: 0,
      salles: 0,
      activites: 0,
      paiements: 0,
      controles: 0,
      periodes: 0,
      notes: 0,
      absences: 0
    };
  }

  /**
   * Formate les statistiques pour l'affichage dans le dashboard
   */
  formatStatisticsForDisplay(data: DashboardStatistics) {
    return [
      { title: 'Étudiants', count: data.eleves, subtitle: 'Total des étudiants', color: 'blue' as const, icon: 'users' },
      { title: 'Niveaux', count: data.niveaux, subtitle: 'Total des niveaux', color: 'indigo' as const, icon: 'graduation-cap' },
      { title: 'Activités', count: data.activites, subtitle: 'Total des activités', color: 'green' as const, icon: 'activity' },
      { title: 'Professeurs', count: data.professeurs, subtitle: 'Total des professeurs', color: 'purple' as const, icon: 'graduation-cap' },
      { title: 'Classes', count: data.classes, subtitle: 'Total des classes', color: 'orange' as const, icon: 'book' },
      { title: 'Parents', count: data.parents, subtitle: 'Total des parents', color: 'cyan' as const, icon: 'users' },
      { title: 'Matières', count: data.matieres, subtitle: 'Total des matières', color: 'rose' as const, icon: 'book' },
      { title: 'Cantines', count: data.cantines, subtitle: 'Total des cantines', color: 'emerald' as const, icon: 'home' },
      { title: 'Menus', count: data.menus, subtitle: 'Total des menus', color: 'teal' as const, icon: 'utensils' },
      { title: 'Chauffeurs', count: data.chauffeurs, subtitle: 'Total des chauffeurs', color: 'slate' as const, icon: 'truck' },
      { title: 'Salles', count: data.salles, subtitle: 'Total des salles', color: 'gray' as const, icon: 'home' },
      { title: 'Examens', count: data.controles, subtitle: 'Total des examens', color: 'violet' as const, icon: 'file-text' },
      { title: 'Accompagnateurs', count: data.accompagnateurs, subtitle: 'Total des accompagnateurs', color: 'amber' as const, icon: 'user' },
      { title: 'Transports', count: data.transports, subtitle: 'Total des transports', color: 'sky' as const, icon: 'truck' },
      { title: 'Paiements', count: data.paiements, subtitle: 'Total des paiements', color: 'lime' as const, icon: 'credit-card' },
      { title: 'Périodes', count: data.periodes, subtitle: 'Total des périodes', color: 'pink' as const, icon: 'calendar' },
      { title: 'Notes', count: data.notes, subtitle: 'Total des notes', color: 'indigo' as const, icon: 'file-text' },
      { title: 'Absences', count: data.absences, subtitle: 'Total des absences', color: 'red' as const, icon: 'calendar-times' },
    ];
  }
}

export const dashboardService = new DashboardService();

