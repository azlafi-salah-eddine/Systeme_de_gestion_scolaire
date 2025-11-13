import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { classeService } from '../../services/classeService';
import { anneeScolaireService } from '../../services/anneeScolaireService';
import { useAuth } from '../../contexts/AuthContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { salleService, type Salle } from '../../services/salleService';
import type { ClasseCreatePayload } from '../../services/classeService';
import type { AnneeScolaire } from '../../services/anneeScolaireService';
import niveauService, { type NiveauItem } from '../../services/niveauService';
import { useNotification } from '../../contexts/NotificationContext';

const ClasseNew: React.FC = () => {
  const navigate = useNavigate();
  const { isBackendOffline, user } = useAuth();
  const { anneeActive, refreshAnneeActive } = useAnneeScolaire();
  const { showSuccess, showError } = useNotification();
  
  // Vérifier si l'utilisateur est Super Admin
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  
  const [formData, setFormData] = useState<ClasseCreatePayload>({
    nom: '',
    niveau_id: 0,
    annee_scolaire_id: 0,
    section: '',
    capacite: 30,
    salle_id: undefined
  });

  useEffect(() => {
    loadAnneesScolaires();
    loadSalles();
    loadNiveaux();
  }, []);

  // Si l'année active change, l'appliquer automatiquement au formulaire
  useEffect(() => {
    if (anneeActive) {
      setFormData(prev => ({ ...prev, annee_scolaire_id: anneeActive.id }));
    }
  }, [anneeActive]);

  const loadAnneesScolaires = async () => {
    try {
      if (isBackendOffline) {
        setAnneesScolaires([
          {
            id: 1,
            nom: '2023-2024',
            annee_debut: 2023,
            annee_fin: 2024,
            date_debut: '2023-09-01',
            date_fin: '2024-06-30',
            active: true,
            created_at: '2023-09-01T00:00:00Z',
            updated_at: '2023-09-01T00:00:00Z'
          }
        ]);
        setFormData(prev => ({ ...prev, annee_scolaire_id: 1 }));
      } else {
        // S'assurer que l'année active est rafraîchie depuis le contexte
        await refreshAnneeActive().catch(() => undefined);
        const response = await anneeScolaireService.getAll();
        setAnneesScolaires(response);
        if (anneeActive) {
          setFormData(prev => ({ ...prev, annee_scolaire_id: anneeActive.id }));
        } else {
          const activeFromList = response.find((a: any) => a.active);
          if (activeFromList) {
            setFormData(prev => ({ ...prev, annee_scolaire_id: activeFromList.id }));
          }
        }
      }
    } catch (err) {
      // Erreur silencieuse
    }
  };

  const loadSalles = async () => {
    try {
      const res = await salleService.list({ active: true, type: 'classe' });
      setSalles(res.data);
    } catch {
      setSalles([]);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      if (name === 'salle_id') {
        // Ignorer la salle lors de la création de la classe
        return prev;
      }
      return {
        ...prev,
        [name]: type === 'number' ? (value === '' ? prev[name as keyof typeof prev] : parseInt(value) || 0) : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      } as any;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pour Admin/Prof: utiliser toujours l'année active
    // Pour Super Admin: utiliser l'année sélectionnée ou l'année active
    const anneeScolaireIdToUse = isSuperAdmin 
      ? (formData.annee_scolaire_id || anneeActive?.id)
      : anneeActive?.id;
    
    if (!anneeScolaireIdToUse) {
      setError("Aucune année scolaire active. Activez une année avant de créer une classe.");
      return;
    }

    if (!formData.nom || !formData.niveau_id || formData.niveau_id === 0 || !formData.section) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isBackendOffline) {
        // Simulation en mode offline
        showSuccess('Classe créée', 'La classe a été créée avec succès.');
        navigate('/classes');
      } else {
        const { nom, niveau_id, section, capacite } = formData;
        const anneeScolaireIdToUse = isSuperAdmin 
          ? (formData.annee_scolaire_id || anneeActive?.id)
          : anneeActive?.id;
        
        if (!anneeScolaireIdToUse) {
          setError("Aucune année scolaire active. Activez une année avant de créer une classe.");
          return;
        }
        
        // Le backend accepte soit via /annees-scolaires/{id}/classes soit /classes
        // Envoi via endpoint annuel pour cohérence
        await classeService.createPourAnneeScolaire(anneeScolaireIdToUse, {
          nom,
          niveau_id,
          section,
          capacite
        });
        showSuccess('Classe créée', 'La classe a été créée avec succès.');
        navigate('/classes');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la classe';
      setError(message);
      showError('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/classes');
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Nouvelle Classe"
        subtitle="Création d'une nouvelle classe"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Classes', link: '/classes' },
          { label: 'Nouvelle classe', link: '/classes/new' }
        ]}
      />
      

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Nom de la classe */}
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom de la classe *
                </label>
                <input
                  type="text"
                  name="nom"
                  id="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: 6ème A"
                />
              </div>

              {/* Niveau (depuis la base: niveaux) */}
              <div>
                <label htmlFor="niveau_id" className="block text-sm font-medium text-gray-700">
                  Niveau *
                </label>
                <select
                  name="niveau_id"
                  id="niveau_id"
                  value={formData.niveau_id}
                  onChange={handleInputChange}
                  required
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value={0}>Sélectionner un niveau</option>
                  {niveaux.filter((n: any) => n.active !== false).map(n => (
                    <option key={n.id} value={n.id}>{n.nom}</option>
                  ))}
                </select>
                {niveaux.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">Aucun niveau trouvé. <a className="text-primary-600 underline" href="/niveaux/new" target="_blank" rel="noreferrer">Créer un niveau</a></p>
                )}
              </div>

              {/* Section */}
              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                  Section *
                </label>
                <input
                  type="text"
                  name="section"
                  id="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: A, B, C"
                />
              </div>

              {/* Année scolaire */}
              {isSuperAdmin ? (
                <div>
                  <label htmlFor="annee_scolaire_id" className="block text-sm font-medium text-gray-700">
                    Année Scolaire *
                  </label>
                  <select
                    name="annee_scolaire_id"
                    id="annee_scolaire_id"
                    value={formData.annee_scolaire_id}
                    onChange={handleInputChange}
                    required
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Sélectionner une année scolaire</option>
                    {anneesScolaires.map(annee => (
                      <option key={annee.id} value={annee.id}>
                        {annee.nom}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="annee_scolaire_id" className="block text-sm font-medium text-gray-700">
                    Année Scolaire *
                  </label>
                  <input
                    type="text"
                    id="annee_scolaire_id"
                    value={anneeActive ? anneeActive.nom : 'Aucune année active'}
                    disabled
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    L'année scolaire active est utilisée automatiquement
                  </p>
                </div>
              )}

              {/* Capacité */}
              <div>
                <label htmlFor="capacite" className="block text-sm font-medium text-gray-700">
                  Capacité *
                </label>
                <input
                  type="number"
                  name="capacite"
                  id="capacite"
                  value={formData.capacite}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="50"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">Nombre maximum d'élèves (1-50)</p>
              </div>

              {/* Salle */}
              {/* Retiré: La salle est gérée via les emplois du temps */}
            </div>

            {/* Statut actif: retiré (le backend met actif=1 par défaut) */}
          </div>
        </Card>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Création...' : 'Créer la classe'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClasseNew;
