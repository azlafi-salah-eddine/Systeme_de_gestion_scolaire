import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Eleve } from '../../types/eleve';
import { eleveService } from '../../services/eleveService';
import { useAuth } from '../../contexts/AuthContext';
import StudentPhoto from '../../components/ui/StudentPhoto';
import PageHead from '../../components/ui/PageHead';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const EleveShow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isBackendOffline, isAdmin } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEleve(parseInt(id));
    }
  }, [id]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('identite');
  const [showCredentials, setShowCredentials] = useState(false);
  const [confirmResetState, setConfirmResetState] = useState({ isOpen: false, loading: false });

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Gestion du sidebar mobile - fermer sur resize vers desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadEleve = async (eleveId: number) => {
    try {
      setLoading(true);
      setError(null);

      if (isBackendOffline) {
        // Mode hors ligne - données de démonstration
        setEleve({
          id: eleveId,
          nom: 'azlafi',
          prenom: 'salah eddine',
          nom_fr: 'azlafi',
          prenom_fr: 'salah eddine',
          nom_ar: 'أزلافي',
          prenom_ar: 'صلاح الدين',
          date_naissance: '2004-06-29',
          lieu_naissance_fr: 'Casablanca, Maroc',
          lieu_naissance_ar: 'الدار البيضاء، المغرب',
          matricule: 'ELV2500006',
          cne: 'P123456212',
          cin: 'AB123456',
          photo: '',
          adresse: '123 Rue Mohammed V, Casablanca',
          nationalite: 'Marocaine',
          ancienne_ecole: 'École Ibn Khaldoun',
          type_ecole: 'Publique',
          statut_ecole: 'Diplômé',
          langues: ['Arabe', 'Français', 'Anglais'],
          personne_urgence: 'Ahmed Azlafi (Père)',
          telephone_urgence: '+212 6 12 34 56 78',
          infos_sante: 'Cours particuliers: Non\nAide scolaire: Non\nDepuis sa naissance, votre enfant a-t-il eu des problèmes de santé?: Non\nVotre enfant a-t-il subi une opération?: Non\nVotre enfant prend-il des médicaments de manière chronique?: Non\nPrésente-t-il des problèmes de vue?: Non\nPrésente-t-il des problèmes d\'audition?: Non\nCalendrier de vaccination à jour?: Non',
          groupe_sanguin: 'A-',
          allergies: 'Allergies alimentaires',
          maladies_chroniques: 'Aucune',
          medicaments: 'Aucun',
          // Données des responsables légaux
          pere: {
            nom: 'Azlafi',
            prenom: 'Ahmed',
            telephone: '+212 6 12 34 56 78',
            profession: 'Ingénieur',
            email: 'ahmed.azlafi@email.com'
          },
          mere: {
            nom: 'Benali',
            prenom: 'Fatima',
            telephone: '+212 6 98 76 54 32',
            profession: 'Enseignante',
            email: 'fatima.benali@email.com'
          },
          tuteur: {
            nom: 'Azlafi',
            prenom: 'Omar',
            telephone: '+212 6 55 44 33 22',
            profession: 'Médecin',
            email: 'omar.azlafi@email.com',
            relation: 'Oncle'
          },
          // Données des services
          transport_info: {
            souscrit: true,
            ligne: 'Hay Mohammadi - Sidi Bernoussi - Ain Sebaa - École Al Amal',
            chauffeur: 'Mohammed Alami',
            telephone_chauffeur: '+212 6 11 22 33 44',
            heure_depart: '07:30',
            heure_retour: '16:45'
          },
          cantine_info: {
            souscrit: true,
            nom: 'Cantine Al Amal',
            regime: 'Normal',
            allergies_alimentaires: 'Aucune',
            repas_speciaux: 'Non'
          },
          sexe: 'M',
          classe_id: 1,
          date_inscription: '2025-10-07',
          active: true,
          created_at: '2025-10-07T00:00:00Z',
          updated_at: '2025-10-07T00:00:00Z',
          classe: {
            id: 1,
            nom: '1ère AP A',
            niveau: '1ère Année Primaire (1AP)',
            capacite: 30,
            annee_scolaire: '2025-2026',
            created_at: '2025-10-07T00:00:00Z',
            updated_at: '2025-10-07T00:00:00Z'
          }
        });
      } else {
        const response = await eleveService.getEleve(eleveId);
        // Attacher les infos user si renvoyées par l'API et afficher le temp_password si présent
        const merged: any = { ...(response as any).eleve };
        if ((response as any).user) {
          merged.user = (response as any).user;
          if ((response as any).user?.temp_password) {
            setShowCredentials(true);
          }
        }
        setEleve(merged as Eleve);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'élève');
    } finally {
      setLoading(false);
    }
  };


  const renderSectionContent = () => {
    if (!eleve) return null;

    switch (activeSection) {
      case 'identite':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Identité
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Nom prénom (FR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {`${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.trim() || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Nom prénom (AR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {`${eleve.prenom_ar || ''} ${eleve.nom_ar || ''}`.trim() || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Sexe
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Âge
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.date_naissance ? `${calculateAge(eleve.date_naissance)} ans` : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Date de naissance
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.date_naissance ? new Date(eleve.date_naissance).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Lieu de naissance (FR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.lieu_naissance_fr || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Lieu de naissance (AR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.lieu_naissance_ar || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'identifiants':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Identifiants
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Matricule
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.matricule || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      CNE
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.cne || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      CIN
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.cin || '—'}
                    </span>
                  </div>
                </div>
                {isAdmin() && (
                  <>
                    <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900 mt-6">
                      <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                        Informations de connexion
                      </h6>
                    </div>
                    <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                      <div className="flex-grow md:flex md:items-center">
                        <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                          Email de connexion
                        </span>
                        <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                          {eleve.matricule ? `${(eleve.matricule || '').toUpperCase()}@ecole.ma` : '—'}
                        </span>
                      </div>
                    </div>
                    {showCredentials && (eleve as any)?.user?.temp_password && (
                      <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                        <div className="flex-grow md:flex md:items-center">
                          <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                            Mot de passe (temporaire)
                          </span>
                          <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                            {(eleve as any).user.temp_password}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="px-5 pt-2 pb-4 text-xs text-slate-500 dark:text-slate-400">
                      Ces identifiants sont générés automatiquement. Vous pouvez réinitialiser le mot de passe ci-dessous.
                    </div>
                    <div className="px-5 pb-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmResetState({ isOpen: true, loading: false })}
                        disabled={confirmResetState.loading}
                        className="w-full"
                      >
                        <Icon name="refresh" className="w-4 h-4 mr-2" />
                        Réinitialiser le mot de passe
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case 'complementaires':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Informations complémentaires
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Adresse
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.adresse || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Nationalité
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.nationalite || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Date d'inscription
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.date_inscription ? new Date(eleve.date_inscription).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Ancienne école
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.ancienne_ecole || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Type d'école
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.type_ecole || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Statut de l'école
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.statut_ecole || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Langues
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.langues && eleve.langues.length > 0 ? eleve.langues.join(', ') : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Personne à contacter en urgence
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.personne_urgence || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Téléphone d'urgence
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.telephone_urgence || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'scolarite':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Scolarité
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Niveau
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.classe?.niveau || 'Niveau non défini'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Classe actuelle
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.classe?.nom ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {eleve.classe.nom}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Non affecté
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Date d'inscription
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.date_inscription ? new Date(eleve.date_inscription).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'medicales':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Informations médicales
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Groupe sanguin
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.groupe_sanguin || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Allergies
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.allergies || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Maladies chroniques
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.maladies_chroniques || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Médicaments
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.medicaments || '—'}
                    </span>
                  </div>
                </div>

                {eleve.infos_sante && (
                  <div className="px-5 py-2 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                    <div className="flex-grow md:flex md:items-start">
                      <span className="block mb-2 transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2 md:mb-0">
                        Informations de santé
                      </span>
                      <div className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                        <div className="space-y-2">
                          {eleve.infos_sante.split('\n').map((line, index) => {
                            if (line.includes(':')) {
                              const [question, answer] = line.split(':').map(s => s.trim());
                              return (
                                <div key={index} className="flex items-center justify-between py-1">
                                  <span className="text-xs text-gray-600">{question}</span>
                                  <span className={`text-xs font-medium px-2 py-1 rounded ${answer.toLowerCase().includes('oui')
                                      ? 'bg-green-100 text-green-800'
                                      : answer.toLowerCase().includes('non')
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {answer}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'responsables':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Responsables légaux
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Père
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.pere ? `${eleve.pere.prenom} ${eleve.pere.nom}` : '— (Non renseigné)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Téléphone père
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.pere?.telephone || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Profession père
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.pere?.profession || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Mère
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.mere ? `${eleve.mere.prenom} ${eleve.mere.nom}` : '— (Non renseigné)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Téléphone mère
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.mere?.telephone || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Profession mère
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.mere?.profession || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Tuteur légal
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.tuteur ? `${eleve.tuteur.prenom} ${eleve.tuteur.nom} (${eleve.tuteur.relation})` : '— (Non renseigné)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Téléphone tuteur
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.tuteur?.telephone || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Services
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Ligne de transport
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.transport_info?.ligne || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Chauffeur
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.transport_info?.chauffeur || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Cantine
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.cantine_info?.nom || (eleve.cantine_info?.souscrit ? 'Souscrit' : 'Non souscrit')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="mb-8 last:mb-0">
              <div className="px-5 py-2 bg-gray-100 rounded dark:bg-gray-900">
                <h6 className="font-bold leading-tight uppercase text-slate-400 whitespace-nowrap text-xxs tracking-relaxed">
                  Identité
                </h6>
              </div>
              <div className="space-y-0">
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Nom prénom (FR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {`${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.trim() || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Nom prénom (AR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {`${eleve.prenom_ar || ''} ${eleve.nom_ar || ''}`.trim() || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Sexe
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Âge
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.date_naissance ? `${calculateAge(eleve.date_naissance)} ans` : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Date de naissance
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.date_naissance ? new Date(eleve.date_naissance).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Lieu de naissance (FR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.lieu_naissance_fr || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-4 border-b border-gray-200 group last:border-b-0 dark:border-gray-800">
                  <div className="flex-grow md:flex md:items-center">
                    <span className="block transition-all duration-300 text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 md:w-1/2">
                      Lieu de naissance (AR)
                    </span>
                    <span className="block transition-all duration-300 text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 md:w-1/2">
                      {eleve.lieu_naissance_ar || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  if (error && !eleve) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Erreur</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/eleves')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!eleve) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Élève non trouvé</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">L'élève que vous recherchez n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => navigate('/eleves')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHead
        title={`Profil de l'élève - ${eleve ? `${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.trim() : 'Profil'}`}
        subtitle="Consultez les informations détaillées de l'élève"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Élèves', link: '/eleves' },
          { label: eleve ? `${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.trim() : 'Profil', link: '#' }
        ]}
      />
      <style>{`
        @media (max-width: 1023px) {
          #pageAside {
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            z-index: 1000;
          }
          #pageAside.sidebar-open {
            transform: translateX(0) !important;
          }
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 1;
            visibility: visible;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
          }
        }
        @media (min-width: 1024px) {
          #pageAside {
            transform: translateX(0) !important;
            position: static !important;
          }
          .overlay {
            display: none !important;
          }
        }
      `}</style>
      <div className="min-h-screen mt-4 bg-gray-50 dark:bg-gray-1000">
        <div className="h-full bg-white border border-gray-300 rounded-md dark:bg-gray-950 dark:border-gray-900">
          <div className="relative flex">
            {/* Sidebar - Student Info */}
            <div
              id="pageAside"
              className={`peer min-w-[260px] max-w-[calc(100%-2.5rem)] w-[300px] 2xl:w-[380px] min-h-screen bg-white dark:bg-gray-950 lg:bg-transparent border-e border-gray-300 dark:border-gray-900 flex-shrink-0 fixed lg:static top-0 start-0 z-[999] transition-transform duration-300 lg:transition-none ${sidebarOpen ? 'sidebar-open' : ''} lg:translate-x-0`}
            >
              <div className="max-lg:mt-16 max-lg:max-h-[calc(100vh-theme(spacing.16))]" data-simplebar>
                {/* Student Header */}
                <div className="p-5 border-b border-gray-300 sm:p-6 dark:border-gray-900">
                  <div className="flex items-center">
                    <StudentPhoto
                      src={eleve.photo}
                      alt={`${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`}
                      size="lg"
                      firstName={eleve.prenom_fr || eleve.prenom || ''}
                      lastName={eleve.nom_fr || eleve.nom || ''}
                      cne={eleve.cne}
                      className="flex-shrink-0"
                    />
                    <div className="flex flex-col ms-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-white">
                        {`${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.trim()}
                      </span>
                      <span className="mt-1 text-xs text-slate-400 dark:text-gray-400">
                        {eleve.classe?.nom || 'Classe non définie'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-gray-400">
                        Matricule: {eleve.matricule}
                      </span>
                    </div>
                  </div>
                </div>



                {/* Navigation Menu */}
                <div className="relative">
                  <ul className="py-3">
                    <li>
                      <button
                        onClick={() => setActiveSection('identite')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'identite'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'identite'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="flex-1">Identité</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveSection('identifiants')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'identifiants'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'identifiants'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <span className="flex-1">Identifiants</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveSection('complementaires')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'complementaires'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'complementaires'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="flex-1">Informations complémentaires</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveSection('scolarite')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'scolarite'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'scolarite'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="flex-1">Scolarité</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveSection('medicales')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'medicales'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'medicales'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="flex-1">Informations médicales</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveSection('responsables')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'responsables'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'responsables'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="flex-1">Responsables légaux</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveSection('services')}
                        className={`group px-5 sm:px-6 py-3 sm:py-4 flex items-center text-sm font-medium leading-5 transition-all duration-300 w-full text-left ${activeSection === 'services'
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                      >
                        <svg className={`w-5 h-5 transition-all duration-300 mr-3 ${activeSection === 'services'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'opacity-80 text-slate-400 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="flex-1">Services</span>
                        <svg className="w-4 h-4 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div
                data-target="#pageAside"
                className="overlay lg:hidden"
                onClick={() => setSidebarOpen(false)}
                style={{
                  opacity: sidebarOpen ? 1 : 0,
                  visibility: sidebarOpen ? 'visible' : 'hidden'
                }}
              ></div>
            )}

            {/* Main Content */}
            <div className="flex-grow">

              <div className="p-5 sm:p-10">
                <div className="flex items-center justify-between pb-6 sm:pb-10 gap-x-6">
                  <div className="relative">
                    <h5 className="mb-2 text-2xl font-bold tracking-tight font-heading leading-tighter text-slate-700 dark:text-white">
                      {activeSection === 'identite' && 'Identité'}
                      {activeSection === 'identifiants' && 'Identifiants'}
                      {activeSection === 'complementaires' && 'Informations complémentaires'}
                      {activeSection === 'scolarite' && 'Scolarité'}
                      {activeSection === 'medicales' && 'Informations médicales'}
                      {activeSection === 'responsables' && 'Responsables légaux'}
                      {activeSection === 'services' && 'Services'}
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400">
                      {activeSection === 'identite' && 'Informations d\'identité de l\'élève (nom, prénom, date de naissance, etc.).'}
                      {activeSection === 'identifiants' && 'Identifiants administratifs de l\'élève (matricule, CNE, CIN).'}
                      {activeSection === 'complementaires' && 'Informations complémentaires (adresse, nationalité, ancienne école, etc.).'}
                      {activeSection === 'scolarite' && 'Informations de scolarité (niveau, classe, date d\'inscription).'}
                      {activeSection === 'medicales' && 'Informations médicales et de santé de l\'élève.'}
                      {activeSection === 'responsables' && 'Informations sur les parents et tuteurs légaux.'}
                      {activeSection === 'services' && 'Services souscrits par l\'élève (transport, cantine, etc.).'}
                    </p>
                  </div>
                  <div className="lg:hidden">
                    <button
                      data-target="#pageAside"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="class-toggle [&>*]:pointer-events-none -me-2 inline-flex items-center justify-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 [&.active]:before:h-10 [&.active]:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 [&.active]:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Offline Mode Warning */}
                {isBackendOffline && (
                  <div className="p-4 mb-6 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-400 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Mode hors ligne - Affichage des données de démonstration
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                          Erreur
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Details Content */}
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal pour Reset Password */}
      {isAdmin() && (
        <ConfirmationModal
          isOpen={confirmResetState.isOpen}
          onClose={() => setConfirmResetState({ isOpen: false, loading: false })}
          onConfirm={async () => {
            try {
              setConfirmResetState(prev => ({ ...prev, loading: true }));
              const res = await api.post(`/v1/eleves/${id}/reset-password`);
              if (res.data?.success) {
                showSuccess('Mot de passe réinitialisé avec succès');
                // Recharger les données élève (pour temp_password)
                const response = await eleveService.getEleve(parseInt(id as string));
                // injecter user dans l'objet local pour affichage
                setEleve({ ...(response.eleve as any), user: { temp_password: res.data?.data?.password } } as any);
                setShowCredentials(true);
                setConfirmResetState({ isOpen: false, loading: false });
              }
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Erreur lors de la réinitialisation';
              showError(msg);
              setConfirmResetState(prev => ({ ...prev, loading: false }));
            }
          }}
          title="Réinitialiser le mot de passe"
          message="Êtes-vous sûr de vouloir réinitialiser le mot de passe ? Un nouveau mot de passe sera généré automatiquement."
          confirmText="Oui, réinitialiser"
          cancelText="Annuler"
          type="warning"
          loading={confirmResetState.loading}
        />
      )}
    </>
  );
};

export default EleveShow;