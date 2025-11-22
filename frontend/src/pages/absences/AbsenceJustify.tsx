import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { absenceService } from '../../services/absenceService';
import type { Absence } from '../../services/absenceService';
import { useNotification } from '../../contexts/NotificationContext';

const AbsenceJustify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingConsecutive, setLoadingConsecutive] = useState(false);
  const [justification, setJustification] = useState('');
  const [pieceJointe, setPieceJointe] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consecutiveAbsences, setConsecutiveAbsences] = useState<Absence[]>([]);
  const [justifyConsecutive, setJustifyConsecutive] = useState(false);
  const [currentAbsence, setCurrentAbsence] = useState<Absence | null>(null);

  useEffect(() => {
    const loadAbsenceAndConsecutive = async () => {
      if (!id) return;
      
      try {
        setLoadingConsecutive(true);
        // Charger l'absence actuelle
        const absenceResponse = await absenceService.show(parseInt(id));
        setCurrentAbsence(absenceResponse.data);
        
        // Détecter automatiquement TOUS les groupes d'absences consécutives
        if (absenceResponse.data.eleve_id) {
          const groupsResponse = await absenceService.detectConsecutiveAbsences(absenceResponse.data.eleve_id);
          
          if (groupsResponse.success && groupsResponse.data) {
            // Trouver le groupe qui contient l'absence actuelle
            const currentGroup = groupsResponse.data.find(group => 
              group.absences.some(absence => absence.id === parseInt(id))
            );
            
            if (currentGroup) {
              setConsecutiveAbsences(currentGroup.absences);
              // Activer la justification groupée si il y a plus d'une absence
              setJustifyConsecutive(false); // Temporairement désactivé pour debug
            } else {
              // Fallback: utiliser l'ancienne méthode pour les absences du même jour
                    const consecutiveResponse = await absenceService.getConsecutiveAbsences(parseInt(id));
        if (consecutiveResponse.success && consecutiveResponse.data) {
          setConsecutiveAbsences(consecutiveResponse.data);
                setJustifyConsecutive(consecutiveResponse.data.length > 1);
        } else {
          setConsecutiveAbsences([]);
              }
            }
          } else {
            // Fallback: utiliser l'ancienne méthode pour les absences du même jour
            const consecutiveResponse = await absenceService.getConsecutiveAbsences(parseInt(id));
            if (consecutiveResponse.success && consecutiveResponse.data) {
              setConsecutiveAbsences(consecutiveResponse.data);
              setJustifyConsecutive(consecutiveResponse.data.length > 1);
            } else {
              setConsecutiveAbsences([]);
            }
          }
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement:', error);
        showError('Erreur', 'Erreur lors du chargement des données');
      } finally {
        setLoadingConsecutive(false);
      }
    };

    loadAbsenceAndConsecutive();
  }, [id, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!justification.trim()) {
      setErrors({ justification: 'La justification est requise' });
      return;
    }

    setLoading(true);
    try {
      const response = await absenceService.justify(
        parseInt(id!), 
        justification, 
        pieceJointe || undefined,
        justifyConsecutive
      );
      
      const message = justifyConsecutive && Array.isArray(response.data) 
        ? `${response.data.length} absences consécutives justifiées avec succès`
        : 'Absence justifiée avec succès';
        
      showSuccess('Succès', message);
      navigate(`/eleves/absences/${id}`);
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur lors de la justification de l\'absence');
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ piece_jointe: 'Le fichier ne doit pas dépasser 2MB' });
        return;
      }
      
      // Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ piece_jointe: 'Seuls les fichiers PDF, JPG et PNG sont autorisés' });
        return;
      }
      
      setPieceJointe(file);
      setErrors(prev => ({ ...prev, piece_jointe: '' }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingConsecutive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title="Justifier l'absence" 
        subtitle="Ajouter une justification pour cette absence" 
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Absences', link: '/absences' },
          { label: 'Détails', link: `/absences/${id}` },
          { label: 'Justifier', link: `/absences/${id}/justify` }
        ]} 
      />

      {/* Affichage des absences consécutives */}
      {consecutiveAbsences.length > 1 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Icon name="calendar" className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Absences consécutives détectées ({consecutiveAbsences.length} absences)
              </h3>
            </div>
            
            <div className="space-y-3">
              {consecutiveAbsences.map((absence, index) => (
                <div key={absence.id} className={`p-3 rounded-lg border ${absence.id === parseInt(id!) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(absence.date)}
                        </span>
                        {absence.heure_debut && absence.heure_fin && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(absence.heure_debut)} - {formatTime(absence.heure_fin)}
                          </span>
                        )}
                        {absence.matiere && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            • {absence.matiere.nom}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{absence.motif}</p>
                    </div>
                    {absence.id === parseInt(id!) && (
                      <span className="px-2 py-1 text-xs text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        Absence actuelle
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

     
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Option de justification groupée */}
            {consecutiveAbsences.length > 1 && (
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="justify-consecutive"
                      type="checkbox"
                      checked={justifyConsecutive}
                      onChange={(e) => setJustifyConsecutive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="justify-consecutive" className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Justifier toutes les absences consécutives ({consecutiveAbsences.length} absences)
                    </label>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      Cette justification sera appliquée à toutes les absences consécutives listées ci-dessus.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Justification */}
            <div>
              <label htmlFor="justification" className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                Justification *
              </label>
              <textarea
                id="justification"
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value);
                  if (errors.justification) {
                    setErrors(prev => ({ ...prev, justification: '' }));
                  }
                }}
                placeholder="Expliquez pourquoi cette absence est justifiée..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${errors.justification ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-gray-600'}`}
                required
              />
              {errors.justification && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.justification}</p>}
            </div>

            {/* Pièce jointe */}
            <div>
              <label htmlFor="piece_jointe" className="block mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">
                Pièce jointe (optionnel)
              </label>
              <input
                type="file"
                id="piece_jointe"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-50 dark:file:bg-gray-700 file:text-slate-700 dark:file:text-gray-300 hover:file:bg-slate-100 dark:hover:file:bg-gray-600"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                Formats acceptés: PDF, JPG, PNG (max 2MB)
              </p>
              {errors.piece_jointe && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.piece_jointe}</p>}
            </div>

            {/* Avertissement */}
            <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-900/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icon name="warning" className="w-5 h-5 text-yellow-400 dark:text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Attention
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <p>
                      {justifyConsecutive 
                        ? `Une fois justifiées, ces ${consecutiveAbsences.length} absences consécutives seront marquées comme justifiées et ne pourront plus être modifiées sans autorisation administrative.`
                        : 'Une fois justifiée, cette absence sera marquée comme justifiée et ne pourra plus être modifiée sans autorisation administrative.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/eleves/absences/${id}`)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    {justifyConsecutive ? 'Justification en cours...' : 'Justification...'}
                  </>
                ) : (
                  <>
                    <Icon name="check" className="mr-2 text-lg" />
                    {justifyConsecutive 
                      ? `Justifier ${consecutiveAbsences.length} absences`
                      : 'Justifier l\'absence'
                    }
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AbsenceJustify;
