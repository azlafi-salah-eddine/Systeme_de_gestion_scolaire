import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { paiementEleveService } from '../../services/paiementEleveService';
import { fraisScolaireService } from '../../services/fraisScolaireService';
import type { PaiementEleve, PaiementEleveResponse } from '../../types/paiements';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter';
import { eleveService } from '../../services/eleveService';

interface ClasseOption {
  id: number;
  nom: string;
  niveau?: string | null;
  nom_complet: string;
}

const PaiementsElevesIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';
  
  const [paiements, setPaiements] = useState<PaiementEleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [moisFilter, setMoisFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined);
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [meta, setMeta] = useState<PaiementEleveResponse['meta'] | null>(null);

  // Mettre à jour le filtre avec l'année active quand elle est disponible (pour Admin/Prof)
  useEffect(() => {
    if (anneeActive) {
      // Pour Admin/Prof: toujours utiliser l'année active
      // Pour Super Admin: utiliser l'année active par défaut si aucune n'est sélectionnée
      if (!isSuperAdmin || !selectedAnneeScolaire) {
        setSelectedAnneeScolaire(anneeActive.id);
      }
    }
  }, [anneeActive, isSuperAdmin]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadPaiements();
  }, [currentPage, statutFilter, typeFilter, moisFilter, niveauFilter, classeFilter, selectedAnneeScolaire]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statutFilter, typeFilter, moisFilter, niveauFilter, classeFilter, selectedAnneeScolaire]);

  const handleGenererPaiements = async () => {
    try {
      setLoading(true);
      const mois = generateCurrentMonth();
      // Envoyer l'année scolaire sélectionnée pour générer les paiements pour toutes les classes de cette année
      const response = await fraisScolaireService.genererPaiementsMensuels(mois, selectedAnneeScolaire);
      if (response.success) {
        const data = response.data || {};
        let message = response.message || 'Paiements générés avec succès';
        
        // Améliorer le message avec les détails
        if (data.paiements_crees !== undefined || data.paiements_existants !== undefined) {
          const nouveaux = data.paiements_crees || 0;
          const existants = data.paiements_existants || 0;
          const elevesNouveaux = data.eleves_avec_nouveaux_paiements || 0;
          const elevesExistants = data.eleves_avec_paiements_existants || 0;
          const elevesSansFrais = data.eleves_sans_frais_applicables || 0;
          const totalEleves = data.eleves_traites || 0;
          const totalClasses = data.classes_traitees || 0;
          const fraisTrouves = data.frais_scolaires_trouves || 0;
          
          message = `Génération terminée pour le mois ${mois}\n\n`;
          message += `${nouveaux} nouveau(x) paiement(s) créé(s)\n`;
          message += `${existants} paiement(s) existant(s) déjà présents\n`;
          message += `${elevesNouveaux} élève(s) avec nouveau(x) paiement(s)\n`;
          message += `${elevesExistants} élève(s) avec paiement(s) déjà existant(s)\n`;
          if (elevesSansFrais > 0) {
            message += `\nATTENTION: ${elevesSansFrais} élève(s) sans frais applicables.\n`;
            message += `Vérifiez que des frais scolaires sont configurés pour leurs niveaux.\n`;
          }
          message += `\nTotal: ${totalEleves} élève(s) dans ${totalClasses} classe(s)`;
          if (fraisTrouves > 0) {
            message += `\n${fraisTrouves} frais scolaire(s) trouvé(s) pour cette année`;
          }
        }
        
        showSuccess('Génération terminée', message);
        loadPaiements();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la génération des paiements');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      setLoadingFilters(true);
      const response = await eleveService.getFilterOptions();
      if (response.success) {
        setNiveaux(response.data.niveaux || []);
      }
    } catch (error) {
      // Les filtres sont optionnels, ignorer les erreurs silencieusement
    } finally {
      setLoadingFilters(false);
    }
  };
  
  // Charger les classes selon l'année sélectionnée
  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (!selectedAnneeScolaire) {
          setClasses([]);
          setClasseFilter('');
          return;
        }
        // Utiliser classeService pour lister les classes de l'année
        const res = await (await import('../../services/classeService')).classeService.index({
          per_page: 1000,
          annee_scolaire_id: selectedAnneeScolaire
        }, ['niveau']);
        const list = (res as any).data || [];
        // Nom complet fallback
        const options = list.map((c: any) => ({
          id: c.id,
          nom: c.nom,
          niveau: c.niveau?.nom ?? c.niveau,
          nom_complet: c.nom_complet || `${c.nom}${c.section ? ' ' + c.section : ''}`
        }));
        setClasses(options);
        if (classeFilter && !options.some((c: any) => String(c.id) === String(classeFilter))) {
          setClasseFilter('');
        }
      } catch {
        setClasses([]);
      }
    };
    void loadClasses();
  }, [selectedAnneeScolaire]);

  const loadPaiements = async () => {
    try {
      setLoading(true);
      const response = await paiementEleveService.getPaiementsEleves({
        statut: statutFilter || undefined,
        type_frais: typeFilter || undefined,
        mois: moisFilter || undefined,
        niveau: niveauFilter || undefined,
        classe_id: classeFilter ? parseInt(classeFilter, 10) : undefined,
        annee_scolaire_id: selectedAnneeScolaire || undefined,
        per_page: 10,
        page: currentPage
      });
      
      if (response.success) {
        setPaiements(response.data || []);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
          setMeta(response.meta);
        }
        if (!response.meta) {
          setMeta(null);
        }
      }
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des paiements');
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = useMemo(() => {
    if (!niveauFilter) {
      return classes;
    }
    return classes.filter(classe => (classe.niveau || '').toLowerCase() === niveauFilter.toLowerCase());
  }, [classes, niveauFilter]);

  const filteredPaiements = useMemo(() => {
    if (!search.trim()) {
      return paiements;
    }

    const searchLower = search.toLowerCase();
    return paiements.filter(paiement => {
    if (!paiement.eleve) return false;
    
      const valuesToSearch = [
        paiement.eleve.nom_complet,
        paiement.eleve.nom,
        paiement.eleve.prenom,
        (paiement.eleve as any)?.matricule,
        paiement.eleve?.classe?.nom
      ];

      return valuesToSearch.some(value =>
        typeof value === 'string' && value.toLowerCase().includes(searchLower)
      );
    });
  }, [paiements, search]);

  const getEleveName = (eleve: PaiementEleve['eleve'] | undefined): string => {
    if (!eleve) return 'N/A';

    if (typeof eleve.nom_complet === 'string' && eleve.nom_complet.trim().length > 0) {
      return eleve.nom_complet.trim();
    }

    const parts = [
      (eleve as any)?.prenom_fr,
      (eleve as any)?.nom_fr,
      eleve.prenom,
      eleve.nom,
    ]
      .filter((part): part is string => typeof part === 'string')
      .map(part => part.trim())
      .filter(part => part.length > 0);

    return parts.length > 0 ? parts.join(' ') : 'N/A';
  };

  const aggregatedPaiements = useMemo(() => {
    const priority: Record<string, number> = {
      regle: 0,
      en_attente: 1,
      partiel: 2,
      en_retard: 3
    };

    interface AggregatedRow {
      key: string;
      eleve?: PaiementEleve['eleve'];
      classe?: any;
      mois: string;
      paiementsParType: Record<string, PaiementEleve>;
      totalDu: number;
      totalPaye: number;
      totalRestant: number;
      statutGlobal: string;
    }

    const map = new Map<string, AggregatedRow>();

    filteredPaiements.forEach(paiement => {
      const type = paiement.frais_scolaire?.type;
      const eleveId = paiement.eleve?.id !== undefined ? paiement.eleve.id : `inconnu-${paiement.id}`;
      const key = `${eleveId}-${paiement.mois}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          eleve: paiement.eleve,
          classe: (paiement.eleve as any)?.classe,
          mois: paiement.mois,
          paiementsParType: {},
          totalDu: 0,
          totalPaye: 0,
          totalRestant: 0,
          statutGlobal: 'regle'
        });
      }

      const entry = map.get(key)!;

      if (type) {
        entry.paiementsParType[type] = paiement;
      }

      entry.totalDu += Number(paiement.montant_du) || 0;
      entry.totalPaye += Number(paiement.montant_paye) || 0;
      entry.totalRestant += Number(paiement.montant_restant) || 0;

      if (priority[paiement.statut] > priority[entry.statutGlobal]) {
        entry.statutGlobal = paiement.statut;
      }
    });

    // Après avoir agrégé tous les paiements, corriger le statut si totalRestant est 0
    map.forEach(entry => {
      if (entry.totalRestant <= 0 && entry.totalPaye > 0) {
        entry.statutGlobal = 'regle';
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      getEleveName(a.eleve).toLowerCase().localeCompare(getEleveName(b.eleve).toLowerCase())
    );
  }, [filteredPaiements]);

  const paiementStats = useMemo(() => {
    const totals = filteredPaiements.reduce((acc, paiement) => {
      acc.totalDu += Number(paiement.montant_du) || 0;
      acc.totalPaye += Number(paiement.montant_paye) || 0;
      acc.totalRestant += Number(paiement.montant_restant) || 0;

      if (paiement.statut === 'regle') acc.regles += 1;
      if (paiement.statut === 'en_retard') acc.enRetard += 1;

      return acc;
    }, {
      totalDu: 0,
      totalPaye: 0,
      totalRestant: 0,
      regles: 0,
      enRetard: 0
    });

    const tauxRecouvrement = totals.totalDu > 0
      ? (totals.totalPaye / totals.totalDu) * 100
      : 0;

    return {
      ...totals,
      tauxRecouvrement
    };
  }, [filteredPaiements]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search ||
      statutFilter ||
      typeFilter ||
      moisFilter ||
      niveauFilter ||
      classeFilter ||
      (selectedAnneeScolaire && anneeActive && selectedAnneeScolaire !== anneeActive.id)
    );
  }, [search, statutFilter, typeFilter, moisFilter, niveauFilter, classeFilter, selectedAnneeScolaire, anneeActive]);

  const generateCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatutFilter('');
    setTypeFilter('');
    setMoisFilter('');
    setNiveauFilter('');
    setClasseFilter('');
    // Réinitialiser l'année scolaire selon le rôle
    if (anneeActive) {
      setSelectedAnneeScolaire(anneeActive.id);
    }
  };

  const handleNiveauChange = (value: string) => {
    setNiveauFilter(value);
    setClasseFilter(prevClasse => {
      if (!prevClasse) return prevClasse;
      const selectedClasse = classes.find(classe => classe.id.toString() === prevClasse);
      if (!selectedClasse) return '';
      if (!value) return prevClasse;
      if ((selectedClasse.niveau || '').toLowerCase() !== value.toLowerCase()) {
        return '';
      }
      return prevClasse;
    });
  };

  const handleClasseChange = (value: string) => {
    setClasseFilter(value);

    if (value) {
      const selectedClasse = classes.find(classe => classe.id.toString() === value);
      if (selectedClasse?.niveau) {
        setNiveauFilter(current => current || selectedClasse.niveau || '');
      }
    }
  };

  const generateMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        value: monthStr,
        label: paiementEleveService.formatMois(monthStr)
      });
    }
    return months;
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Paiements des Élèves"
        subtitle="Suivi et gestion des paiements mensuels des élèves"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Paiements Élèves', link: '/paiements-eleves' }
        ]}
        actions={[
          {
            icon: 'plus',
            label: 'Générer Paiements',
            onClick: handleGenererPaiements,
            variant: 'primary'
          }
        ]}
      />

      {/* Filtres */}
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h3>
              <div className="flex items-center gap-3">
                {loadingFilters && (
                  <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Icon name="refresh" className="mr-2 animate-spin text-primary-500" size="sm" />
                    Chargement des options…
                  </span>
                )}
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
              {/* Search */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rechercher
                </label>
                <div className="relative">
                  <Icon name="search" className="absolute text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="Nom de l'élève..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Année Scolaire Filter */}
              <div>
                <AnneeScolaireFilter
                  value={selectedAnneeScolaire}
                  onChange={(value) => setSelectedAnneeScolaire(value)}
                />
              </div>

              {/* Statut Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statut
                </label>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tous les statuts</option>
                  <option value="en_attente">En Attente</option>
                  <option value="partiel">Paiement Partiel</option>
                  <option value="regle">Réglé</option>
                  <option value="en_retard">En Retard</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tous les types</option>
                  <option value="scolarite">Scolarité</option>
                  <option value="cantine">Cantine</option>
                  <option value="transport">Transport</option>
                </select>
              </div>

              {/* Mois Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mois
                </label>
                <select
                  value={moisFilter}
                  onChange={(e) => setMoisFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tous les mois</option>
                  {generateMonths().map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Niveau Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niveau
                </label>
                <select
                  value={niveauFilter}
                  onChange={(e) => handleNiveauChange(e.target.value)}
                  disabled={loadingFilters}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                >
                  <option value="">Tous les niveaux</option>
                  {niveaux.map(niveau => (
                    <option key={niveau} value={niveau}>
                      {niveau}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classe Filter - always visible; empty when no classes */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Classe
                </label>
                <select
                  value={classeFilter}
                  onChange={(e) => handleClasseChange(e.target.value)}
                  disabled={loadingFilters || filteredClasses.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                >
                  {filteredClasses.length === 0 ? (
                    <option value="">Aucune classe disponible</option>
                  ) : (
                    <>
                      <option value="">Toutes les classes</option>
                      {filteredClasses.map(classe => (
                        <option key={classe.id} value={classe.id.toString()}>
                          {classe.nom_complet || classe.nom}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Montant total dû</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {paiementEleveService.formatMontant(paiementStats.totalDu)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Montant total payé</p>
              <p className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
                {paiementEleveService.formatMontant(paiementStats.totalPaye)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Montant restant</p>
              <p className="mt-2 text-2xl font-semibold text-orange-600 dark:text-orange-400">
                {paiementEleveService.formatMontant(paiementStats.totalRestant)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Taux de recouvrement</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {paiementStats.tauxRecouvrement.toFixed(1)}%
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {paiementStats.regles} réglés • {paiementStats.enRetard} en retard
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des paiements */}
      <Card>
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Paiements des Élèves ({aggregatedPaiements.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          ) : aggregatedPaiements.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="credit-card" className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size="lg" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun paiement trouvé
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {hasActiveFilters
                  ? 'Aucun paiement ne correspond à vos critères de recherche.'
                  : 'Commencez par générer les paiements mensuels.'
                }
              </p>
              <Button
                onClick={handleGenererPaiements}
                disabled={loading}
                variant="success"
              >
                <Icon name="plus" size="sm" className="mr-2" />
                Générer les paiements
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Élève
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Classe
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Mois
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                      Total dû
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                      Total payé
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                      Restant
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {aggregatedPaiements.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2.5">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getEleveName(row.eleve)}
                          </div>
                          {(row.eleve as any)?.matricule && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Matricule&nbsp;: {(row.eleve as any).matricule}
                          </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-white">
                        {row.classe?.nom || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-white">
                        {paiementEleveService.formatMois(row.mois)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-900 dark:text-white">
                        {paiementEleveService.formatMontant(row.totalDu)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-900 dark:text-white">
                        {paiementEleveService.formatMontant(row.totalPaye)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-900 dark:text-white">
                        {paiementEleveService.formatMontant(row.totalRestant)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paiementEleveService.getStatutColor(row.statutGlobal)}`}>
                          {paiementEleveService.getStatutLabel(row.statutGlobal)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              const firstPaiement = Object.values(row.paiementsParType)[0];
                              if (firstPaiement) {
                                navigate(`/paiements-eleves/${firstPaiement.id}`, { state: { paiement: firstPaiement } });
                              }
                            }}
                            className="p-1 text-indigo-600 dark:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            title="Voir le détail"
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                          </button>
                            <button
                            onClick={() => {
                              const paiementNonRegle = Object.values(row.paiementsParType).find(p => {
                                const montantRestant = Number(p.montant_restant) || 0;
                                return p.statut !== 'regle' && montantRestant > 0;
                              });
                              const cible = paiementNonRegle || Object.values(row.paiementsParType)[0];
                              if (cible) {
                                navigate(`/paiements-eleves/${cible.id}/paiement`, { state: { paiement: cible } });
                              }
                            }}
                            className="p-1 text-green-600 dark:text-green-400 transition-colors rounded-full hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Enregistrer un paiement"
                            >
                              <Icon name="credit-card" className="w-3.5 h-3.5" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {(() => {
          const pageCount = totalPages || 1;
          const perPage = meta?.per_page ?? 10;
          const totalItems = meta?.total ?? aggregatedPaiements.length;
          const start = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
          const end = totalItems === 0 ? 0 : Math.min(totalItems, currentPage * perPage);

          return (
            <div className="flex flex-col gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
                Affichage {start}-{end} sur {totalItems}
            </div>
              <div className="inline-flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Précédent
              </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} / {pageCount}
                </span>
              <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                  disabled={currentPage >= pageCount}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Suivant
              </button>
            </div>
              </div>
          );
        })()}
        </Card>
    </div>
  );
};

export default PaiementsElevesIndex;
