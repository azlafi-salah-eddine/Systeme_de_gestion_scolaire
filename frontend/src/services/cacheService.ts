interface EnrollmentCache {
  step: number;
  formData: any;
  selectedParents: any[];
  newParents: {
    pere?: any;
    mere?: any;
    tuteur?: any;
  };
  timestamp: number;
}

class CacheService {
  private static CACHE_KEY = 'enrollment_cache';
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

  /**
   * Sauvegarder les données d'inscription en cache
   */
  static saveEnrollmentData(data: Partial<EnrollmentCache>): void {
    try {
      const existingCache = this.getEnrollmentData();
      const cacheData: EnrollmentCache = {
        step: data.step || existingCache?.step || 1,
        formData: { ...existingCache?.formData, ...data.formData },
        selectedParents: data.selectedParents || existingCache?.selectedParents || [],
        newParents: { ...existingCache?.newParents, ...data.newParents },
        timestamp: Date.now()
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      // Erreur de sauvegarde silencieuse
    }
  }

  /**
   * Récupérer les données d'inscription du cache
   */
  static getEnrollmentData(): EnrollmentCache | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data: EnrollmentCache = JSON.parse(cached);
      
      // Vérifier si le cache n'a pas expiré
      if (Date.now() - data.timestamp > this.CACHE_DURATION) {
        this.clearEnrollmentData();
        return null;
      }

      return data;
    } catch (error) {
      this.clearEnrollmentData();
      return null;
    }
  }

  /**
   * Vider le cache d'inscription
   */
  static clearEnrollmentData(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      // Erreur de suppression silencieuse
    }
  }

  /**
   * Vérifier si le cache existe et est valide
   */
  static hasValidCache(): boolean {
    const cache = this.getEnrollmentData();
    return cache !== null;
  }

  /**
   * Sauvegarder seulement les données de formulaire
   */
  static saveFormData(formData: any): void {
    this.saveEnrollmentData({ formData });
  }

  /**
   * Sauvegarder seulement l'étape courante
   */
  static saveCurrentStep(step: number): void {
    this.saveEnrollmentData({ step });
  }

  /**
   * Sauvegarder les parents sélectionnés
   */
  static saveSelectedParents(selectedParents: any[]): void {
    this.saveEnrollmentData({ selectedParents });
  }

  /**
   * Sauvegarder un nouveau parent
   */
  static saveNewParent(type: 'pere' | 'mere' | 'tuteur', parentData: any): void {
    const newParents = { [type]: parentData };
    this.saveEnrollmentData({ newParents });
  }

  /**
   * Récupérer seulement les données de formulaire
   */
  static getFormData(): any {
    const cache = this.getEnrollmentData();
    return cache?.formData || {};
  }

  /**
   * Récupérer l'étape courante
   */
  static getCurrentStep(): number {
    const cache = this.getEnrollmentData();
    return cache?.step || 1;
  }

  /**
   * Récupérer les parents sélectionnés
   */
  static getSelectedParents(): any[] {
    const cache = this.getEnrollmentData();
    return cache?.selectedParents || [];
  }

  /**
   * Récupérer les nouveaux parents
   */
  static getNewParents(): any {
    const cache = this.getEnrollmentData();
    return cache?.newParents || {};
  }

  /**
   * Obtenir un résumé du cache pour debug
   */
  static getCacheSummary(): string {
    const cache = this.getEnrollmentData();
    if (!cache) return 'Aucun cache';

    const age = Math.round((Date.now() - cache.timestamp) / (1000 * 60));
    return `Étape ${cache.step}, ${age}min, ${Object.keys(cache.formData || {}).length} champs`;
  }
}

export default CacheService;
