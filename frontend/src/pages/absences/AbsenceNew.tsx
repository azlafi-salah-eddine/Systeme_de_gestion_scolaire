import React, { useEffect, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { absenceService } from '../../services/absenceService';
import { useNotification } from '../../contexts/NotificationContext';
import { classeService } from '../../services/classeService';
import niveauService from '../../services/niveauService';
import api from '../../services/api';

interface EmploiDuTemps {
  id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  classe_id: number;
  professeur_id: number;
  matiere_id: number;
  salle_id: number;
  classe_nom?: string;
  matiere_nom?: string;
  salle_nom?: string;
  professeur_nom?: string;
}

interface Eleve {
  id: number;
  nom?: string;
  prenom?: string;
  nom_fr?: string;
  prenom_fr?: string;
  nom_ar?: string;
  prenom_ar?: string;
  classe?: {
    id: number;
    nom: string;
  };
}

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
}

interface Niveau {
  id: number;
  nom: string;
  description?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  section: string;
  nom_complet: string;
}

interface Absence {
  id: number;
  eleve_id: number;
  date: string;
  motif: string;
  justifie: boolean;
  professeur_id: number;
  heure_debut: string;
  heure_fin: string;
  justification?: string;
  piece_jointe?: string;
  matiere_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  matiere_nom?: string;
  classe_nom?: string;
  eleve?: {
  id: number;
  nom: string;
    prenom: string;
    nom_fr?: string;
    prenom_fr?: string;
    nom_ar?: string;
    prenom_ar?: string;
  };
}

const AbsenceNew: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);

  // États pour le système moderne
  const [selectedNiveau, setSelectedNiveau] = useState<Niveau | null>(null);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [emploisDuTemps, setEmploisDuTemps] = useState<EmploiDuTemps[]>([]);
  const [selectedCours, setSelectedCours] = useState<EmploiDuTemps | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [searchEleve, setSearchEleve] = useState('');
  const [absencesToAdd, setAbsencesToAdd] = useState<number[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showExistingAbsencesModal, setShowExistingAbsencesModal] = useState(false);
  const [existingAbsencesInfo, setExistingAbsencesInfo] = useState<{
    cours: EmploiDuTemps;
    date: Date;
    absences: Absence[];
  } | null>(null);


  useEffect(() => {
    const loadData = async () => {
      try {
        const [elevesRes, professeursRes, niveauxRes] = await Promise.all([
          api.get('/v1/eleves', { params: { with: ['classe'] } }),
          api.get('/v1/professeurs'),
          niveauService.list()
        ]);
        
        setEleves(elevesRes.data?.data || []);
        setProfesseurs(professeursRes.data?.data || []);
        setNiveaux(niveauxRes || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();
  }, []);

  // Charger les classes quand un niveau est sélectionné
  useEffect(() => {
    const loadClasses = async () => {
      if (selectedNiveau) {
        try {
          const classesRes = await api.get('/v1/classes');
          const allClasses = classesRes.data?.data || [];
          const filteredClasses = allClasses.filter((classe: any) => {
            const niveauNom = typeof classe.niveau === 'object' && classe.niveau ? classe.niveau.nom : classe.niveau;
            return niveauNom === selectedNiveau.nom;
          });
          setClasses(filteredClasses);
        } catch (error) {
          console.error('Erreur lors du chargement des classes:', error);
        }
      } else {
        setClasses([]);
      }
    };

    loadClasses();
  }, [selectedNiveau]);

  // Charger l'emploi du temps de la classe sélectionnée
  useEffect(() => {
    if (selectedClasse) {
      loadEmploiDuTempsByClasse(selectedClasse.id);
      loadAbsencesByClasse(selectedClasse.id);
    }
  }, [selectedClasse]);

  // Générer la semaine courante au chargement
  useEffect(() => {
    generateCurrentWeek();
  }, []);




  // Fonctions pour le système moderne
  const loadEmploiDuTempsByClasse = async (classeId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/classes/${classeId}/emplois-du-temps`, {
        params: {
          with: ['professeur', 'matiere', 'salle']
        }
      });
      setEmploisDuTemps(response.data?.data || []);
    } catch (error) {
      showError('Erreur', 'Impossible de charger l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  };

  const loadAbsencesByClasse = async (classeId: number) => {
    try {
      // Charger toutes les absences de la classe pour la vérification de conflits
      const response = await api.get('/v1/absences', {
        params: {
          classe_id: classeId,
          with: ['eleve']
        }
      });
      setAbsences(response.data?.data || []);
    } catch (error) {
      // Erreur silencieuse
    }
  };

  const generateCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    setCurrentWeek(week);
  };

  const loadEleves = async (classeId: number) => {
    try {
      const response = await api.get('/v1/eleves', {
        params: {
          classe_id: classeId,
          active: true,
          with: ['classe']
        }
      });
      setEleves(response.data?.data || []);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les élèves');
    }
  };

  const handleCoursClick = (cours: EmploiDuTemps, date?: Date) => {
    if (!cours.classe_id) {
      showError('Erreur', 'Informations de classe manquantes pour ce cours');
      return;
    }
    
    if (date) {
      const absencesForCours = getAbsencesForCours(cours, date);
      
      // Si il y a des absences existantes, afficher la fenêtre d'information
      if (absencesForCours.length > 0) {
        setExistingAbsencesInfo({
          cours,
          date,
          absences: absencesForCours
        });
        setShowExistingAbsencesModal(true);
        return;
      }
    }
    
    setSelectedCours(cours);
    setSelectedDate(date || null);
    loadEleves(cours.classe_id);
    setShowAbsenceModal(true);
    
    // Pré-sélectionner les élèves déjà absents pour ce cours
    if (date) {
      const absencesForCours = getAbsencesForCours(cours, date);
      const eleveIds = absencesForCours.map(absence => absence.eleve_id);
      setAbsencesToAdd(eleveIds);
    } else {
      setAbsencesToAdd([]);
    }
  };

  const handleEleveToggle = (eleveId: number) => {
    setAbsencesToAdd(prev => 
      prev.includes(eleveId) 
        ? prev.filter(id => id !== eleveId)
        : [...prev, eleveId]
    );
  };

  const handleSubmitAbsences = async () => {
    if (!selectedCours || absencesToAdd.length === 0) return;

    if (!selectedCours.matiere_id) {
      showError('Erreur', 'Informations de matière manquantes pour ce cours');
      return;
    }

    if (!selectedClasse?.id) {
      showError('Erreur', 'Classe non sélectionnée');
      return;
    }

    try {
      setLoading(true);
      
      // Obtenir la date du cours sélectionné
      const coursDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      // Vérifier que la date est valide
      if (!coursDate || coursDate === 'Invalid Date') {
        showError('Erreur', 'Date invalide pour ce cours');
        return;
      }

      // Convertir les heures du format "HH:MM:SS" vers "HH:MM"
      const heureDebut = selectedCours.heure_debut ? selectedCours.heure_debut.substring(0, 5) : undefined;
      const heureFin = selectedCours.heure_fin ? selectedCours.heure_fin.substring(0, 5) : undefined;

      // Vérifier les conflits d'absences
      const conflicts = checkAbsenceConflicts(absencesToAdd, coursDate, heureDebut || '', heureFin || '');
      
      if (conflicts.length > 0) {
        const conflictNames = conflicts.map(c => c.eleveName).join(', ');
        showError(
          'Conflit détecté', 
          `Les élèves suivants sont déjà marqués absents pour cette date et heure :\n${conflictNames}\n\nVeuillez les retirer de la sélection ou choisir une autre date/heure.`
        );
        setLoading(false);
        return;
      }
      
      // Créer les absences pour chaque élève sélectionné
      const promises = absencesToAdd.map(eleveId => {
        const absenceData = {
          eleve_id: eleveId,
          professeur_id: selectedCours.professeur_id,
          matiere_id: selectedCours.matiere_id,
          date: coursDate,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          motif: 'Absence non justifiée',
          justifie: false
        };
        return absenceService.create(absenceData);
      });

      await Promise.all(promises);
      
      showSuccess('Succès', `${absencesToAdd.length} absence(s) enregistrée(s) avec succès`);
      setShowAbsenceModal(false);
      setAbsencesToAdd([]);
      setSelectedCours(null);
      setSelectedDate(null);
      
      // Recharger les absences après création
      if (selectedClasse) {
        loadAbsencesByClasse(selectedClasse.id);
      }
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur lors de l\'enregistrement des absences');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour le calendrier
  const getJourIndex = (jour: string) => {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    return jours.indexOf(jour.toLowerCase());
  };

  const getHeureIndex = (heure: string) => {
    const [h] = heure.split(':');
    return parseInt(h) - 8; // 8h = index 0
  };

  const generateCalendarGrid = () => {
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const heures = Array.from({ length: 10 }, (_, i) => `${8 + i}:00 - ${9 + i}:00`);
    
    const grid = Array(10).fill(null).map(() => Array(6).fill(null));

    emploisDuTemps.forEach(emploi => {
      const jourIndex = getJourIndex(emploi.jour);
      const heureIndex = getHeureIndex(emploi.heure_debut);
      
      if (jourIndex >= 0 && jourIndex < 6 && heureIndex >= 0 && heureIndex < 10) {
        grid[heureIndex][jourIndex] = emploi;
      }
    });

    return { grid, jours, heures };
  };

  // Fonction utilitaire pour obtenir le nom complet de l'élève
  const getEleveName = (eleve: Eleve) => {
    const nom = eleve.nom || eleve.nom_fr || eleve.nom_ar || 'Nom manquant';
    const prenom = eleve.prenom || eleve.prenom_fr || eleve.prenom_ar || 'Prénom manquant';
    return `${nom} ${prenom}`;
  };

  // Fonction pour obtenir les absences d'un cours spécifique
  const getAbsencesForCours = (cours: EmploiDuTemps, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return absences.filter(absence => 
      absence.professeur_id === cours.professeur_id &&
      absence.matiere_id === cours.matiere_id &&
      absence.date === dateStr &&
      absence.heure_debut === cours.heure_debut &&
      absence.heure_fin === cours.heure_fin
    );
  };


  // Fonction pour vérifier les conflits d'absences
  const checkAbsenceConflicts = (eleveIds: number[], coursDate: string, heureDebut: string, heureFin: string) => {
    const conflicts: { eleveId: number; eleveName: string }[] = [];
    
    
    eleveIds.forEach(eleveId => {
      const existingAbsence = absences.find(absence => {
        // Convertir la date ISO en format YYYY-MM-DD pour la comparaison
        const absenceDate = new Date(absence.date).toISOString().split('T')[0];
        
        const match = absence.eleve_id === eleveId &&
          absenceDate === coursDate &&
          absence.heure_debut === (heureDebut + ':00') &&
          absence.heure_fin === (heureFin + ':00');
        
        
        return match;
      });
      
      if (existingAbsence) {
        const eleve = eleves.find(e => e.id === eleveId);
        conflicts.push({
          eleveId,
          eleveName: eleve ? getEleveName(eleve) : 'Élève inconnu'
        });
      }
    });
    
    return conflicts;
  };


  const { grid, jours, heures } = generateCalendarGrid();
  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch = getEleveName(eleve).toLowerCase().includes(searchEleve.toLowerCase());
    const matchesClasse = selectedClasse ? eleve.classe?.id === selectedClasse.id : true;
    return matchesSearch && matchesClasse;
  });


  return (
    <div className="space-y-6">
      <PageHead 
        title=""
        subtitle=""
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Absences', link: '/absences' },
          { label: 'Nouvelle absence', link: '/absences/new' }
        ]} 
      />

      {/* Header avec titre et filtre */}
      <div className="flex items-center justify-between pb-5 md:pb-7">
              <div>
          <h3 className="text-2xl font-bold tracking-tight font-heading lg:text-3xl leading-tighter text-slate-700 dark:text-white">
            Nouvelle absence
          </h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Gérez les absences des élèves par classe et par semaine
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Niveau :
            </label>
            <select
              value={selectedNiveau?.id || ''}
              onChange={(e) => {
                const niveau = niveaux.find(n => n.id === parseInt(e.target.value));
                setSelectedNiveau(niveau || null);
                setSelectedClasse(null); // Reset classe when niveau changes
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-950 text-slate-700 dark:text-slate-300 min-w-[150px]"
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map(niveau => (
                <option key={niveau.id} value={niveau.id}>
                  {niveau.nom}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Classe :
            </label>
            <select
              value={selectedClasse?.id || ''}
              onChange={(e) => {
                const classe = classes.find(c => c.id === parseInt(e.target.value));
                setSelectedClasse(classe || null);
              }}
              disabled={!selectedNiveau}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-950 text-slate-700 dark:text-slate-300 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom_complet}
                </option>
              ))}
            </select>
          </div>
        </div>
              </div>

      {/* Calendrier d'emploi du temps */}
      {selectedClasse && (
        <div className="p-5 bg-white border border-gray-300 rounded-md dark:bg-gray-950 dark:border-gray-900 sm:p-6">
          <div className="flex items-center justify-between mb-6">
              <div>
              <h4 className="text-lg font-semibold text-slate-700 dark:text-white">
                Semaine du {currentWeek[0]?.toLocaleDateString('fr-FR')} au {currentWeek[6]?.toLocaleDateString('fr-FR')}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedClasse.nom_complet} • {emploisDuTemps.length} séances
              </p>
            </div>
            {emploisDuTemps.length === 0 && (
              <div className="px-3 py-2 text-sm text-red-500 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-900/30">
                Aucun emploi du temps trouvé
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-20 p-3 text-sm font-semibold text-center border text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700">
                      Heure
                    </th>
                    {currentWeek.map((date, index) => (
                      <th key={index} className="p-3 text-sm font-semibold text-center text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 min-w-[120px]">
                        <div className="font-medium capitalize">{jours[index]}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heures.map((heure, heureIndex) => (
                    <tr key={heure}>
                      <td className="p-3 text-sm font-medium text-center border text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700">
                        {heure}
                      </td>
                      {currentWeek.map((date, jourIndex) => {
                        const cours = grid[heureIndex][jourIndex];
                        const absencesForCours = cours ? getAbsencesForCours(cours, date) : [];
                        return (
                          <td
                            key={`${heureIndex}-${jourIndex}`}
                            className="relative h-20 p-2 text-center align-middle transition-colors bg-white border cursor-pointer border-slate-200 dark:border-gray-700 dark:bg-gray-950 hover:bg-slate-50 dark:hover:bg-gray-900"
                          >
                            {/* Indicateur d'absences au-dessus de la cellule */}
                            {cours && absencesForCours.length > 0 && (
                              <div className="absolute z-20 transform -translate-x-1/2 -top-2 left-1/2">
                                <div className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full shadow-lg">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  {absencesForCours.length} absent{absencesForCours.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            
                            {cours ? (
                              <button
                                onClick={() => handleCoursClick(cours, date)}
                                className="relative w-full h-full p-2 text-xs font-medium text-white transition-all duration-200 rounded-lg hover:scale-105 group"
                                style={{ 
                                  backgroundColor: absencesForCours.length > 0 ? '#ef4444' : '#6366f1',
                                  boxShadow: absencesForCours.length > 0 ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
                                }}
                                title={`${cours.matiere_nom || 'Matière'} - ${cours.classe_nom || 'Classe'}${absencesForCours.length > 0 ? ` (${absencesForCours.length} absence${absencesForCours.length > 1 ? 's' : ''})` : ''}`}
                              >
                                <div className="mb-1 font-semibold truncate">{cours.matiere_nom || 'Matière'}</div>
                                <div className="text-xs truncate opacity-90">{cours.classe_nom || 'Classe'}</div>
                                <div className="text-xs truncate opacity-75">{cours.salle_nom || 'Salle'}</div>
                                
                                {/* Badge "A" pour absences */}
                                {absencesForCours.length > 0 && (
                                  <div className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full shadow-md bottom-1 right-1">
                                    A
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 transition-all duration-200 bg-black bg-opacity-0 rounded-lg group-hover:bg-opacity-10"></div>
                              </button>
                            ) : (
                              <div className="flex items-center justify-center w-full h-full rounded-lg bg-slate-50 dark:bg-gray-800">
                                <span className="text-xs text-slate-400 dark:text-gray-500">Libre</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Message si aucune classe sélectionnée */}
      {!selectedClasse && (
        <div className="p-8 text-center bg-white border border-gray-300 rounded-md dark:bg-gray-950 dark:border-gray-900">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-gray-800">
            <Icon name="calendar" className="text-slate-400 dark:text-gray-500" size="lg" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-white">
            Sélectionnez une classe
          </h3>
          <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400">
            Choisissez d'abord un niveau, puis une classe dans les menus déroulants ci-dessus pour voir l'emploi du temps et gérer les absences de la semaine.
          </p>
        </div>
      )}


      {/* Modal pour marquer les absences */}
      {showAbsenceModal && selectedCours && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-medium text-gray-800 dark:text-white">
                Marquer les absences
              </h3>
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Icon name="x" size="sm" />
              </button>
              </div>

            {/* Cours info */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div><strong>Matière :</strong> {selectedCours.matiere_nom || 'Non définie'}</div>
                <div><strong>Classe :</strong> {selectedCours.classe_nom || 'Non définie'}</div>
                <div><strong>Date :</strong> {selectedDate ? selectedDate.toLocaleDateString('fr-FR') : 'Non définie'}</div>
                <div><strong>Heure :</strong> {selectedCours.heure_debut} - {selectedCours.heure_fin}</div>
                <div><strong>Salle :</strong> {selectedCours.salle_nom || 'Non définie'}</div>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un élève..."
                  value={searchEleve}
                  onChange={(e) => setSearchEleve(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded pl-7 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <Icon name="search" size="sm" className="text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>

            {/* Liste des élèves */}
            <div className="overflow-y-auto max-h-48 bg-white dark:bg-gray-800">
              {filteredEleves.length === 0 ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-xs">Aucun élève trouvé pour cette classe</p>
                  <p className="mt-1 text-xs">Total élèves: {eleves.length}</p>
            </div>
              ) : (
                filteredEleves.map(eleve => (
                  <div key={eleve.id} className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-800 dark:text-white">{getEleveName(eleve)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{eleve.classe?.nom || 'Classe inconnue'}</div>
                    </div>
                    <button
                      onClick={() => handleEleveToggle(eleve.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                        absencesToAdd.includes(eleve.id)
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:border-red-500 dark:hover:border-red-500'
                      }`}
                      title="Marquer comme absent"
                    >
                      A
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {absencesToAdd.length} élève(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
              <Button
                variant="secondary"
                  onClick={() => setShowAbsenceModal(false)}
                disabled={loading}
                  className="px-3 py-1 text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                  onClick={handleSubmitAbsences}
                  disabled={loading || absencesToAdd.length === 0}
                  className="px-3 py-1 text-xs"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fenêtre d'information sur les absences existantes */}
      {showExistingAbsencesModal && existingAbsencesInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 text-white bg-red-600 dark:bg-red-700 rounded-full">
                  A
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Absences existantes
                </h3>
              </div>
              <button
                onClick={() => setShowExistingAbsencesModal(false)}
                className="p-1 text-gray-400 dark:text-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-800">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {existingAbsencesInfo.cours.matiere_nom} - {existingAbsencesInfo.cours.classe_nom}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {existingAbsencesInfo.date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • {existingAbsencesInfo.cours.heure_debut} - {existingAbsencesInfo.cours.heure_fin}
                </p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>{existingAbsencesInfo.absences.length}</strong> élève(s) déjà absent(s) :
                </p>
                <div className="max-h-40 overflow-y-auto">
                  {existingAbsencesInfo.absences.map((absence, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded mb-1">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {absence.eleve?.prenom_fr || absence.eleve?.prenom} {absence.eleve?.nom_fr || absence.eleve?.nom}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        absence.justifie 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {absence.justifie ? 'Justifiée' : 'Non justifiée'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setShowExistingAbsencesModal(false)}
                className="px-4 py-2"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceNew;
