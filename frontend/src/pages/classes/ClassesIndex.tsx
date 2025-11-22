import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import { classeService, type Classe, type ClasseFilters } from '../../services/classeService';
import niveauService, { type NiveauItem } from '../../services/niveauService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter';
import jsPDF from 'jspdf';

const ClassesIndex: React.FC = () => {
  const navigate = useNavigate();
  const { isBackendOffline, isProfesseur, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();

  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';

  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null; label: string }>({ isOpen: false, id: null, label: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [filters, setFilters] = useState<ClasseFilters>({
    search: '',
    annee_scolaire_id: undefined, // Sera mis à jour par useEffect
    niveau: '',
    active: undefined,
    page: 1,
    per_page: 10,
    sort_by: 'nom',
  });

  useEffect(() => {
    void loadNiveaux();
  }, []);

  // Mettre à jour le filtre avec l'année active quand elle est disponible (pour Admin/Prof)
  useEffect(() => {
    if (anneeActive) {
      // Pour Admin/Prof: toujours utiliser l'année active
      // Pour Super Admin: utiliser l'année active par défaut si aucune n'est sélectionnée
      setFilters(prev => {
        // Si aucune année n'est sélectionnée ou si l'utilisateur n'est pas Super Admin, utiliser l'année active
        if (!isSuperAdmin || !prev.annee_scolaire_id) {
          return {
            ...prev,
            annee_scolaire_id: anneeActive.id
          };
        }
        return prev;
      });
    }
  }, [anneeActive, isSuperAdmin]);

  useEffect(() => {
    void loadClasses();
  }, [filters.search, filters.annee_scolaire_id, filters.niveau]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isBackendOffline) {
        setClasses([]);
      } else {
        // Charger toutes les classes d'un coup comme les parents
        const res: any = await classeService.index({
          per_page: 1000,
          search: filters.search,
          annee_scolaire_id: filters.annee_scolaire_id,
          niveau: filters.niveau,
          active: true
        }, ['anneeScolaire', 'niveau']);
        
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : null;
              
        if (Array.isArray(data)) {
          const normalized: Classe[] = data.map((c: any) => {
            const capacite = typeof c.capacite === 'number' ? c.capacite : (c.capacite ? Number(c.capacite) : 0);
            const nombre_eleves = typeof c.nombre_eleves === 'number' ? c.nombre_eleves : (c.nombre_eleves ? Number(c.nombre_eleves) : 0);
            const taux_occupation = (capacite > 0) ? (nombre_eleves / capacite) * 100 : (typeof c.taux_occupation === 'number' ? c.taux_occupation : 0);
            const active = typeof c.active === 'boolean' ? c.active : true;
            const est_complete = typeof c.est_complete === 'boolean' ? c.est_complete : (capacite > 0 && nombre_eleves >= capacite);
            return { ...c, capacite, nombre_eleves, taux_occupation, active, est_complete } as Classe;
          });
          setClasses(normalized);
        } else {
          setClasses([]);
          setError('Réponse serveur invalide pour la liste des classes');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };


  const loadNiveaux = async () => {
    try {
      const data = await niveauService.list();
      setNiveaux(data);
    } catch {
      setNiveaux([]);
    }
  };

  const handleFilterChange = (key: keyof ClasseFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setCurrentPage(1);
  };

  const handleToggleActive = async (classe: Classe) => {
    try {
      if (!isBackendOffline) {
        await classeService.toggleActive(classe.id);
      }
      setClasses(prev => prev.map(c => (c.id === classe.id ? { ...c, active: !c.active } : c)));
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la modification du statut');
    }
  };

  const requestDelete = (classe: Classe) => {
    setConfirmState({ isOpen: true, id: classe.id, label: classe.nom_complet || `${classe.nom} ${classe.section}` });
  };

  const confirmDelete = async () => {
    if (!confirmState.id) return;
    try {
      if (!isBackendOffline) {
        await classeService.delete(confirmState.id);
      }
      void loadClasses();
      showSuccess('Classe supprimée', 'La classe a été supprimée avec succès.');
    } catch (e: any) {
      const message = e.message || 'Erreur lors de la suppression';
      setError(message);
      showError('Échec de suppression', message);
    } finally {
      setConfirmState({ isOpen: false, id: null, label: '' });
    }
  };

  const getStatusBadge = (classe: Classe) => {
    if (!classe.active) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">Inactive</span>;
    }
    if (classe.est_complete) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">Complète</span>;
    }
    if (classe.taux_occupation >= 80) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">Presque complète</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Disponible</span>;
  };

  const getOccupationColor = (taux: number) => {
    if (taux >= 100) return 'bg-red-500';
    if (taux >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleExportStudents = async (classe: Classe) => {
    try {
      // Récupérer les élèves de la classe
      const response = await classeService.getEleves(classe.id);
      const eleves = response.data || [];

      if (eleves.length === 0) {
        showError('Information', 'Aucun élève trouvé dans cette classe');
        return;
      }

      // Créer le PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête du document
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`LISTE DE CLASSE ${classe.nom || ''}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Année scolaire
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const anneeScolaire = classe.annee_scolaire || 'Année scolaire non définie';
      doc.text(`Année scolaire : ${anneeScolaire}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Informations de la classe (format identique aux notes)
      const niveauInfo = typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : classe.niveau || 'N/A';
      const classInfo = `Classe: ${classe.nom || 'N/A'}`;
      const dateInfo = `Date: ${new Date().toLocaleDateString('fr-FR')}`;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      // Ligne du haut: Niveau (gauche), Classe (centre), Date (droite)
      doc.text(String(niveauInfo || ''), 20, yPosition);
      doc.text(classInfo, pageWidth / 2, yPosition, { align: 'center' });
      doc.text(dateInfo, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 20;

      // Séparateur
      doc.setDrawColor(0, 0, 0);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10;

      // En-têtes du tableau
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const tableHeaders = ['Matricule', 'CNE', 'Nom complet', 'Date de naissance', 'Sexe'];
      const colWidths = [30, 30, 60, 40, 20];
      const tableStartX = (pageWidth - colWidths.reduce((sum, width) => sum + width, 0)) / 2;
      let xPosition = tableStartX;

      // Dessiner les en-têtes
      doc.setFillColor(240, 240, 240);
      doc.rect(xPosition, yPosition - 3, colWidths.reduce((sum, width) => sum + width, 0), 8, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(xPosition, yPosition - 3, colWidths.reduce((sum, width) => sum + width, 0), 8);
      
      tableHeaders.forEach((header, index) => {
        doc.rect(xPosition, yPosition - 3, colWidths[index], 8);
        doc.text(header, xPosition + colWidths[index]/2, yPosition + 1, { align: 'center' });
        xPosition += colWidths[index];
      });
      yPosition += 8;

      // Données des élèves
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      eleves.forEach((eleve, index) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - 15) {
          doc.addPage();
          yPosition = 20;
        }

        xPosition = tableStartX;
        
        // Construire le nom complet
        let nomComplet = 'N/A';
        if (eleve.nom_complet) {
          nomComplet = eleve.nom_complet;
        } else if (eleve.nom_fr && eleve.prenom_fr) {
          nomComplet = `${eleve.prenom_fr} ${eleve.nom_fr}`;
        } else if (eleve.nom && eleve.prenom) {
          nomComplet = `${eleve.prenom} ${eleve.nom}`;
        }

        // Formater la date de naissance
        const dateNaissance = eleve.date_naissance ? new Date(eleve.date_naissance).toLocaleDateString('fr-FR') : 'N/A';
        
        const rowData = [
          eleve.matricule || 'N/A',
          eleve.cne || 'N/A',
          nomComplet,
          dateNaissance,
          eleve.sexe || 'N/A'
        ];

        // Alterner les couleurs de fond pour les lignes
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(xPosition, yPosition - 3, colWidths.reduce((sum, width) => sum + width, 0), 6, 'F');
        }

        rowData.forEach((data, colIndex) => {
          doc.setDrawColor(0, 0, 0);
          doc.rect(xPosition, yPosition - 3, colWidths[colIndex], 6);
          doc.text(data, xPosition + colWidths[colIndex]/2, yPosition + 1, { align: 'center' });
          xPosition += colWidths[colIndex];
        });

        yPosition += 6;
      });


      // Télécharger le PDF
      const filename = `classe_${classe.nom}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      showSuccess('Succès', `Export PDF terminé: ${eleves.length} élève(s) exporté(s)`);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'export:', error);
      showError('Erreur', error.response?.data?.message || 'Impossible d\'exporter la liste des élèves');
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Classes" 
        subtitle="Gestion des classes"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Classes', link: '/classes' }
        ]}
        actions={!isProfesseur() ? [
          {
            label: 'Nouvelle classe',
            onClick: () => navigate('/classes/new'),
            variant: 'primary'
          }
        ] : undefined}
      />



      <Card>
        <div className="p-6">
          <div className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Filtres</div>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
            <div className="md:flex-1 min-w-[220px]">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recherche</label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm"
                placeholder="Nom, niveau, section..."
              />
            </div>

            <div className="min-w-[200px]">
              <AnneeScolaireFilter
                value={filters.annee_scolaire_id}
                onChange={(value) => handleFilterChange('annee_scolaire_id', value)}
              />
            </div>

            <div className="min-w-[200px]">
              <label htmlFor="niveau" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Niveau</label>
              <select
                id="niveau"
                value={filters.niveau}
                onChange={(e) => handleFilterChange('niveau', e.target.value)}
                className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.filter((n: any) => n.active !== false).map(n => (
                  <option key={n.id} value={n.nom}>{n.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erreur</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400"><p>{error}</p></div>
            </div>
          </div>
        </div>
      )}

      <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune classe</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par créer une nouvelle classe.</p>
              {!isProfesseur() && (
                <div className="mt-6">
                  <button onClick={() => navigate('/classes/new')} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Nouvelle classe
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Classe</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Niveau</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Année scolaire</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Élèves</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left uppercase text-slate-500 dark:text-gray-300">Occupation</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-gray-700">
                  {(() => {
                    const q = filters.search.trim().toLowerCase();
                    const filtered = q ? classes.filter((classe: Classe) =>
                      (classe.nom || '').toLowerCase().includes(q) ||
                      (typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : String(classe.niveau || '')).toLowerCase().includes(q) ||
                      (classe.section || '').toLowerCase().includes(q) ||
                      (classe.nom_complet || '').toLowerCase().includes(q)
                    ) : classes;
                    const total = filtered.length;
                    const totalPages = Math.max(1, Math.ceil(total / pageSize));
                    const safePage = Math.min(currentPage, totalPages);
                    const start = (safePage - 1) * pageSize;
                    const end = start + pageSize;
                    const pageItems = filtered.slice(start, end);
                    return pageItems.map(classe => (
                    <tr key={classe.id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2">
                        <div className="text-xs font-medium text-slate-900 dark:text-white">{typeof classe.nom_complet === 'string' && classe.nom_complet ? classe.nom_complet : (classe.nom || `${typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : classe.niveau} ${classe.section}`)}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">Section {classe.section}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">{(() => {
                        // Si niveau est un objet (relation), utiliser son nom
                        const niveauNom = typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : classe.niveau;
                        
                        if (!niveauNom) {
                          return (
                            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                              Non défini
                            </span>
                          );
                        }
                        
                        const n = niveaux.find(nv => nv.nom === niveauNom);
                        if (n && n.active === false) {
                          return (
                            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">
                              Supprimé
                            </span>
                          );
                        }
                        
                        return (
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                            {typeof niveauNom === 'object' ? String(niveauNom) : niveauNom}
                          </span>
                        );
                      })()}</td>
                      <td className="px-3 py-2 text-xs text-slate-500 dark:text-gray-400">{typeof classe.annee_scolaire === 'object' && classe.annee_scolaire ? ((classe.annee_scolaire as any).nom || (classe.annee_scolaire as any).nom_formate || 'N/A') : (classe.annee_scolaire as any) || 'N/A'}</td>
                      <td className="px-3 py-2 text-xs text-slate-500 dark:text-gray-400">{classe.nombre_eleves} / {classe.capacite}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <div className="w-16 h-2 mr-2 rounded-full bg-slate-200 dark:bg-gray-700">
                            <div className={`h-2 rounded-full ${getOccupationColor(classe.taux_occupation)}`} style={{ width: `${Math.min(classe.taux_occupation, 100)}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-gray-400">{classe.taux_occupation.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => handleExportStudents(classe)} className="p-1.5 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors" aria-label="Exporter liste des élèves" title="Exporter liste des élèves">
                            <Icon name="file-pdf" size="sm" />
                          </button>
                          {!isProfesseur() && (
                            <button onClick={() => navigate(`/classes/${classe.id}/emplois-du-temps`)} className="p-1.5 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" aria-label="Emploi du temps" title="Emploi du temps">
                              <Icon name="calendar" size="sm" />
                            </button>
                          )}
                          <button onClick={() => navigate(`/classes/${classe.id}`)} className="p-1.5 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" aria-label="Voir" title="Voir">
                            <Icon name="eye" size="sm" />
                          </button>
                          {!isProfesseur() && (
                            <>
                              <button onClick={() => navigate(`/classes/${classe.id}/edit`)} className="p-1.5 text-green-600 dark:text-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" aria-label="Modifier" title="Modifier">
                                <Icon name="edit" size="sm" />
                              </button>
                              <button onClick={() => requestDelete(classe)} className="p-1.5 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" aria-label="Supprimer" title="Supprimer">
                                <Icon name="trash" size="sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    ));
                  })()}
                  {(() => {
                    const q = filters.search.trim().toLowerCase();
                    const filtered = q ? classes.filter((classe: Classe) =>
                      (classe.nom || '').toLowerCase().includes(q) ||
                      (typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : String(classe.niveau || '')).toLowerCase().includes(q) ||
                      (classe.section || '').toLowerCase().includes(q) ||
                      (classe.nom_complet || '').toLowerCase().includes(q)
                    ) : classes;
                    return filtered.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-slate-500 dark:text-gray-400" colSpan={6}>Aucune classe</td>
                      </tr>
                    ) : null;
                  })()}
                </tbody>
              </table>
              {(() => {
                const q = filters.search.trim().toLowerCase();
                const filtered = q ? classes.filter((classe: Classe) =>
                  (classe.nom || '').toLowerCase().includes(q) ||
                  (typeof classe.niveau === 'object' && classe.niveau ? String(classe.niveau.nom) : String(classe.niveau || '')).toLowerCase().includes(q) ||
                  (classe.section || '').toLowerCase().includes(q) ||
                  (classe.nom_complet || '').toLowerCase().includes(q)
                ) : classes;
                const total = filtered.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1;
                const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize);
                return (
                  <div className="flex items-center justify-between px-4 pb-4 mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
                    <div className="inline-flex items-center gap-2">
                      <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Précédent</button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Page {Math.min(currentPage, totalPages)} / {totalPages}</span>
                      <button className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Suivant</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
      </Card>
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, id: null, label: '' })}
        onConfirm={confirmDelete}
        title="Supprimer la classe"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmState.label}" ?`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default ClassesIndex;


