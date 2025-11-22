import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';
import api from '../../services/api';
import { anneeScolaireService } from '../../services/anneeScolaireService';
import niveauService from '../../services/niveauService';
import { classeService } from '../../services/classeService';

interface Eleve {
  id: number;
  nom_fr?: string;
  nom?: string;
  prenom_fr?: string;
  prenom?: string;
  classe?: {
    id: number;
    nom: string;
    niveau?: any; // broadened for union compatibility
  };
}

interface Classe {
  id: number;
  nom: string;
  niveau?: {
    id: number;
    nom: string;
  };
}

interface Niveau {
  id: number;
  nom: string;
}

interface AnneeScolaire {
  id: number;
  nom: string;
  active: boolean;
}

const NotesIndex: React.FC = () => {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 5;

  const [filters, setFilters] = useState({
    anneeScolaire: 'active',
    niveau: '',
    classe: ''
  });

  const anneeActive = anneesScolaires.find(a => a.active);

  useEffect(() => {
    loadAnneesScolaires();
    loadNiveaux();
    loadClasses();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [filters.niveau]);

  useEffect(() => {
    loadEleves();
  }, [filters, currentPage, search]);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadAnneesScolaires = async () => {
    try {
      const response = await anneeScolaireService.getAll();
      setAnneesScolaires(response || []);
    } catch (error) {
      console.error('Error loading annees scolaires:', error);
    }
  };

  const loadNiveaux = async () => {
    try {
      const response = await niveauService.list();
      setNiveaux(response || []);
    } catch (error) {
      console.error('Error loading niveaux:', error);
    }
  };

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await classeService.index();
      let allClasses = response.data || [];
      
      // Filtrer par niveau si sélectionné
      if (filters.niveau) {
        allClasses = allClasses.filter((classe: any) => 
          classe.niveau_id === parseInt(filters.niveau)
        );
      }
      
      setClasses(allClasses as any);
      
      // Si le niveau change et qu'une classe était sélectionnée, la réinitialiser
      if (filters.niveau && filters.classe) {
        const selectedClasse = allClasses.find((classe: any) => classe.id === parseInt(filters.classe));
        if (!selectedClasse) {
          setFilters(prev => ({ ...prev, classe: '' }));
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadEleves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Si aucune classe n'est sélectionnée, ne pas charger d'élèves
      if (!filters.classe) {
        setEleves([]);
        setTotalItems(0);
        setLoading(false);
        return;
      }
      
      const anneeActive = anneesScolaires.find(a => a.active);
      const params: any = {
        per_page: pageSize,
        page: currentPage,
        search: search.trim() || undefined,
        with: ['classe', 'classe.niveau']
      };

      // Filtre par classe (obligatoire)
      params.classe_id = filters.classe;

      // Filtre par niveau (optionnel)
      if (filters.niveau) {
        params.niveau_id = filters.niveau;
      }

      // Gestion de l'année scolaire (optionnel)
      if (filters.anneeScolaire === 'active' && anneeActive) {
        params.annee_scolaire_id = anneeActive.id;
      } else if (filters.anneeScolaire !== 'active' && filters.anneeScolaire !== '') {
        params.annee_scolaire_id = filters.anneeScolaire;
      }

      const res = await api.get('/v1/eleves', { params });
      setEleves(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getEleveName = (eleve: Eleve) => {
    const prenom = eleve.prenom_fr || eleve.prenom || '';
    const nom = eleve.nom_fr || eleve.nom || '';
    return `${prenom} ${nom}`.trim() || 'Nom manquant';
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'niveau') {
      // Si le niveau change, réinitialiser la classe
      setFilters(prev => ({ 
        ...prev, 
        niveau: value,
        classe: '' // Réinitialiser la classe quand le niveau change
      }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      anneeScolaire: 'active',
      niveau: '',
      classe: ''
    });
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Gestion des Notes"
        subtitle="Consultez et gérez les notes des élèves"
        breadcrumb={[
          { label: 'Accueil', link: '/' },
          { label: 'Élèves', link: '/eleves' },
          { label: 'Notes' }
        ]}
      />

      <Card>
        <div className="p-6">
          {/* Barre de recherche */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size="sm" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" onClick={resetFilters}>
              <Icon name="refresh" size="sm" className="mr-2" />
              Réinitialiser
            </Button>
          </div>

          {/* Filtres avancés */}
          <div className="grid grid-cols-1 gap-4 p-4 rounded-lg md:grid-cols-2 lg:grid-cols-3 bg-slate-50 dark:bg-gray-800">
            {/* Année scolaire */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Année scolaire
              </label>
              <select
                value={filters.anneeScolaire}
                onChange={(e) => handleFilterChange('anneeScolaire', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">
                  {anneeActive ? anneeActive.nom : 'Année active'}
                </option>
                {anneesScolaires
                  .filter(annee => !anneeActive || annee.id !== anneeActive.id)
                  .map((annee) => (
                    <option key={annee.id} value={annee.id.toString()}>
                      {annee.nom}
                    </option>
                  ))}
              </select>
            </div>

            {/* Niveau */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Niveau
              </label>
              <select
                value={filters.niveau}
                onChange={(e) => handleFilterChange('niveau', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id.toString()}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Classe */}
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Classe
              </label>
              <select
                value={filters.classe}
                onChange={(e) => handleFilterChange('classe', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={loadingClasses}
              >
                <option value="">Toutes les classes</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id.toString()}>
                    {classe.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compteur de résultats */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              {totalItems} élève{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <Card>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-slate-300">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-slate-300">
                      Matricule
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-slate-300">
                      CNE
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-slate-300">
                      Classe
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-slate-300">
                      Niveau
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right uppercase text-slate-500 dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {eleves.map((eleve) => (
                    <tr key={eleve.id} className="hover:bg-slate-50">
                      {/* Nom */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {getEleveName(eleve)}
                        </div>
                      </td>
                      {/* Matricule */}
                      <td className="px-4 py-3 text-slate-600">
                        {(eleve as any).matricule || '—'}
                      </td>
                      {/* CNE */}
                      <td className="px-4 py-3 text-slate-600">
                        {(eleve as any).cne || '—'}
                      </td>
                      {/* Classe */}
                      <td className="px-4 py-3 text-slate-600">
                        {eleve.classe?.nom || '—'}
                      </td>
                      {/* Niveau */}
                      <td className="px-4 py-3 text-slate-600">
                        {(() => {
                          const raw = eleve.classe?.niveau as any;
                          if (!raw) return '—';
                          if (typeof raw === 'object') return raw.nom || '—';
                          return String(raw);
                        })()}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button 
                            className="p-2 text-purple-600 rounded-full hover:bg-purple-50" 
                            title="Gérer les notes" 
                            aria-label="Gérer les notes" 
                            onClick={() => navigate(`/eleves/${eleve.id}/notes`)}
                          >
                            <Icon name="notes" size="sm" />
                          </button>
                          <button 
                            className="p-2 text-blue-600 rounded-full hover:bg-slate-100" 
                            title="Voir profil" 
                            aria-label="Voir profil" 
                            onClick={() => navigate(`/eleves/${eleve.id}`)}
                          >
                            <Icon name="eye" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {eleves.length === 0 && (
                    <tr>
                      <td className="py-12 text-center text-slate-500" colSpan={6}>
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Icon name="notes" className="w-12 h-12 text-slate-300" />
                          <p className="text-lg font-medium">
                            {!filters.classe 
                              ? "Sélectionnez une classe pour gérer les notes" 
                              : "Aucun élève trouvé dans cette classe"}
                          </p>
                          <p className="text-sm">
                            {!filters.classe 
                              ? "Utilisez les filtres ci-dessus pour sélectionner une classe et voir ses élèves." 
                              : "Cette classe ne contient aucun élève ou aucun élève ne correspond aux critères de recherche."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Page {safePage} sur {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(safePage - 1)}
                    disabled={safePage <= 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-slate-600">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(safePage + 1)}
                    disabled={safePage >= totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotesIndex;
