import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { absenceService } from '../../services/absenceService';
import type { Absence } from '../../services/absenceService';
import { useNotification } from '../../contexts/NotificationContext';

const AbsenceShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [absence, setAbsence] = useState<Absence | null>(null);

  useEffect(() => {
    const loadAbsence = async () => {
      try {
        setLoading(true);
        const response = await absenceService.show(parseInt(id!));
        setAbsence(response.data);
      } catch (error: any) {
        showError('Erreur', error?.message || 'Erreur lors du chargement de l\'absence');
        navigate('/eleves/absences');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAbsence();
    }
  }, [id, navigate, showError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  if (!absence) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-gray-400">Absence non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title={`Absence - ${absence.eleve?.nom_fr || absence.eleve?.nom || 'Élève'} ${absence.eleve?.prenom_fr || absence.eleve?.prenom || 'Inconnu'}`}
        subtitle={`${formatDate(absence.date)}`}
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Absences', link: '/absences' },
          { label: 'Détails', link: `/absences/${id}` }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Informations de l'absence</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Élève</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.eleve?.nom_fr || absence.eleve?.nom || 'Nom manquant'} {absence.eleve?.prenom_fr || absence.eleve?.prenom || 'Prénom manquant'}
                    {absence.eleve?.classe && (
                      <span className="text-slate-500 dark:text-gray-400 ml-2">({absence.eleve.classe.nom})</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Classe</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.eleve?.classe?.nom || 'Non spécifiée'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Date</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatDate(absence.date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Heure</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.heure_debut && absence.heure_fin 
                      ? `${formatTime(absence.heure_debut)} - ${formatTime(absence.heure_fin)}`
                      : 'Non spécifié'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Professeur</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.professeur ? `${absence.professeur.nom} ${absence.professeur.prenom}` : 'Non assigné'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Matière</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.matiere?.nom || 'Non spécifiée'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Statut</dt>
                  <dd className="mt-1">
                    <div className="flex items-center space-x-2">
                      {absence.justifie ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          Justifiée
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                          Non justifiée
                        </span>
                      )}
                      {absence.piece_jointe && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          <Icon name="file-text" className="w-3 h-3 mr-1" />
                          Pièce jointe
                        </span>
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Informations de l'élève */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Informations de l'élève</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Matricule</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{absence.eleve?.matricule || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Date de naissance</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.eleve?.date_naissance ? formatDate(absence.eleve.date_naissance) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Sexe</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {absence.eleve?.sexe === 'M' ? 'Masculin' : absence.eleve?.sexe === 'F' ? 'Féminin' : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nationalité</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{absence.eleve?.nationalite || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Téléphone d'urgence</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{absence.eleve?.telephone_urgence || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Personne d'urgence</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{absence.eleve?.personne_urgence || '—'}</dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Motif */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Motif</h3>
              <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{absence.motif}</p>
            </div>
          </Card>

          {/* Justification */}
          {absence.justification && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Justification</h3>
                <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{absence.justification}</p>
              </div>
            </Card>
          )}

          {/* Pièce jointe */}
          {absence.piece_jointe && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Pièce jointe</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Icon name="file-text" className="w-8 h-8 text-slate-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {absence.piece_jointe.split('/').pop()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        Document de justification
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(`http://localhost:8000/storage/${absence.piece_jointe}`, '_blank')}
                    >
                      <Icon name="eye" className="w-4 h-4" />
                      <span className="ml-1">Voir</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `http://localhost:8000/storage/${absence.piece_jointe}`;
                        link.download = absence.piece_jointe.split('/').pop() || 'piece_jointe';
                        link.click();
                      }}
                    >
                      <Icon name="file-upload" className="w-4 h-4" />
                      <span className="ml-1">Télécharger</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Informations du professeur et de la matière */}
        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Professeur</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nom complet</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">
                    {absence.professeur ? `${absence.professeur.nom} ${absence.professeur.prenom}` : 'Non assigné'}
                  </dd>
                </div>
                {absence.professeur && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Diplôme</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{absence.professeur.diplome || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Ancienneté</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{absence.professeur.anciennete ? `${absence.professeur.anciennete} ans` : '—'}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </Card>

          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Matière</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Nom</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">{absence.matiere?.nom || 'Non spécifiée'}</dd>
                </div>
                {absence.matiere && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Code</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{absence.matiere.code || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Description</dt>
                      <dd className="text-sm text-slate-900 dark:text-white">{absence.matiere.description || '—'}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </Card>

          {/* Actions */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/eleves/absences/${id}/edit`)}
                  className="w-full"
                >
                  <Icon name="edit" />
                  <span className="ml-2">Modifier</span>
                </Button>
                
                {!absence.justifie && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/eleves/absences/${id}/justify`)}
                    className="w-full"
                  >
                    <Icon name="check" />
                    <span className="ml-2">Justifier</span>
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => navigate('/eleves/absences')}
                  className="w-full"
                >
                  <Icon name="arrow-left" />
                  <span className="ml-2">Retour à la liste</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Informations système */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Informations système</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Créée le</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">
                    {new Date(absence.created_at).toLocaleString('fr-FR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Modifiée le</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">
                    {new Date(absence.updated_at).toLocaleString('fr-FR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Statut</dt>
                  <dd className="text-sm text-slate-900 dark:text-white">
                    {absence.active ? 'Active' : 'Inactive'}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AbsenceShow;
