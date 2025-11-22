import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { smsService } from '../../services/smsService';
import { eleveService } from '../../services/eleveService';
import type { SmsSendRequest } from '../../types/sms';
import { useNotification } from '../../contexts/NotificationContext';

interface RecipientGroup {
  type: 'classe' | 'niveau' | 'tous' | 'personnalise';
  label: string;
  icon: string;
  description: string;
}

const SendSms: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [destinataireType, setDestinataireType] = useState<'eleve' | 'parent' | 'classe' | 'niveau' | 'tous' | 'personnalise'>('classe');
  const [destinataireId, setDestinataireId] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [numerosPersonnalises, setNumerosPersonnalises] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);

  const recipientGroups: RecipientGroup[] = [
    { type: 'classe', label: 'Par Classe', icon: 'users', description: 'Envoyer à tous les élèves d\'une classe' },
    { type: 'niveau', label: 'Par Niveau', icon: 'layers', description: 'Envoyer à tous les élèves d\'un niveau' },
    { type: 'tous', label: 'Tous', icon: 'globe', description: 'Envoyer à tous les élèves de l\'école' },
    { type: 'personnalise', label: 'Personnalisé', icon: 'edit', description: 'Liste personnalisée de numéros' },
  ];

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    setLoadingOptions(true);
    try {
      const [classesRes, elevesRes] = await Promise.all([
        eleveService.getClasses(),
        eleveService.getEleves({ per_page: 1000 }),
      ]);

      if (classesRes.data) {
        setClasses(classesRes.data);
        
        // Extract unique niveaux
        const uniqueNiveaux = Array.from(
          new Set(
            classesRes.data
              .map((c: any) => typeof c.niveau === 'string' ? c.niveau : c.niveau?.nom)
              .filter(Boolean)
          )
        ) as string[];
        setNiveaux(uniqueNiveaux);
      }

      if (elevesRes.data) {
        setEleves(elevesRes.data);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showError('Erreur', 'Veuillez saisir un message');
      return;
    }

    if (destinataireType === 'personnalise' && !numerosPersonnalises.trim()) {
      showError('Erreur', 'Veuillez saisir au moins un numéro de téléphone');
      return;
    }

    if ((destinataireType === 'classe' || destinataireType === 'niveau') && !destinataireId) {
      showError('Erreur', 'Veuillez sélectionner une option');
      return;
    }

    setLoading(true);
    try {
      const payload: SmsSendRequest = {
        destinataire_type: destinataireType,
        message: message.trim(),
      };

      if (destinataireType === 'classe' || destinataireType === 'niveau') {
        payload.destinataire_id = destinataireId;
      }

      if (destinataireType === 'personnalise') {
        payload.numeros_personnalises = numerosPersonnalises
          .split(/[\n,;]+/)
          .map(n => n.trim())
          .filter(Boolean);
      }

      const response = await smsService.send(payload);

      if (response.success) {
        showSuccess('Succès', response.message || 'SMS envoyé avec succès');
        setMessage('');
        setDestinataireId(undefined);
        setNumerosPersonnalises('');
        navigate('/sms/history');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      showError('Erreur', error instanceof Error ? error.message : 'Erreur lors de l\'envoi du SMS');
    } finally {
      setLoading(false);
    }
  };

  const charInfo = smsService.getCharacterInfo(message);

  return (
    <div className="space-y-6">
      <PageHead
        title="Envoi de SMS"
        subtitle="Envoyer des notifications par SMS aux élèves et parents"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'SMS', link: '/sms/send' },
          { label: 'Envoyer', link: '/sms/send' },
        ]}
        actions={[
          {
            icon: 'clock',
            label: 'Historique',
            onClick: () => navigate('/sms/history'),
            variant: 'outline',
          },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Selection */}
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Destinataires
            </h3>

            {/* Recipient Type Selection */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
              {recipientGroups.map((group) => (
                <button
                  key={group.type}
                  type="button"
                  onClick={() => {
                    setDestinataireType(group.type);
                    setDestinataireId(undefined);
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    destinataireType === group.type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      name={group.icon}
                      className={`mt-1 ${
                        destinataireType === group.type
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          destinataireType === group.type
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {group.label}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Conditional Filters */}
            {destinataireType === 'classe' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sélectionner une classe
                </label>
                <select
                  value={destinataireId || ''}
                  onChange={(e) => setDestinataireId(Number(e.target.value))}
                  disabled={loadingOptions}
                  required
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Choisir une classe --</option>
                  {classes.map((classe) => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom_complet || classe.nom} ({classe.nombre_eleves || 0} élèves)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {destinataireType === 'niveau' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sélectionner un niveau
                </label>
                <select
                  value={destinataireId || ''}
                  onChange={(e) => setDestinataireId(Number(e.target.value))}
                  disabled={loadingOptions}
                  required
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Choisir un niveau --</option>
                  {niveaux.map((niveau, index) => (
                    <option key={index} value={index + 1}>
                      {niveau}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {destinataireType === 'personnalise' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Numéros de téléphone (un par ligne ou séparés par des virgules)
                </label>
                <textarea
                  value={numerosPersonnalises}
                  onChange={(e) => setNumerosPersonnalises(e.target.value)}
                  placeholder="+212612345678&#10;+212698765432&#10;0612345678"
                  rows={5}
                  required
                  className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formats acceptés: +212XXXXXXXXX ou 06XXXXXXXX
                </p>
              </div>
            )}

            {destinataireType === 'tous' && (
              <div className="p-4 border border-yellow-200 rounded-lg dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start gap-3">
                  <Icon name="alert-triangle" className="mt-0.5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Attention
                    </p>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Ce message sera envoyé à tous les élèves de l'école ({eleves.length} élèves)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Message Composer */}
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Message
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contenu du message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Saisissez votre message ici..."
                  rows={6}
                  required
                  className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                
                {/* Character Count */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-medium ${
                      charInfo.length > 160 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {charInfo.length} caractères
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      •
                    </span>
                    <span className={`font-medium ${
                      charInfo.segments > 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {charInfo.segments} SMS
                    </span>
                  </div>
                  {charInfo.segments === 1 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {charInfo.remaining} caractères restants
                    </span>
                  )}
                </div>
              </div>

              {/* Message Preview */}
              {message && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Aperçu
                  </label>
                  <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap dark:text-white">
                      {message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/sms/history')}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <>
                <Icon name="refresh" className="mr-2 animate-spin" size="sm" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Icon name="send" className="mr-2" size="sm" />
                Envoyer le SMS
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SendSms;
