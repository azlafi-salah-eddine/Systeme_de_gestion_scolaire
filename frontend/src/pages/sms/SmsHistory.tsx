import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { smsService } from '../../services/smsService';
import type { SmsNotification, SmsHistoryFilters } from '../../types/sms';
import { useNotification } from '../../contexts/NotificationContext';

const SmsHistory: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [messages, setMessages] = useState<SmsNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SmsHistoryFilters>({
    page: 1,
    per_page: 15,
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  useEffect(() => {
    loadMessages();
  }, [filters]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await smsService.getHistory(filters);
      
      if (response.success) {
        setMessages(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Erreur', error instanceof Error ? error.message : 'Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
      destinataire_type: typeFilter || undefined,
      statut: statutFilter || undefined,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatutFilter('');
    setFilters({
      page: 1,
      per_page: 15,
    });
  };

  const statistics = useMemo(() => {
    return smsService.calculateStatistics(messages);
  }, [messages]);

  const hasActiveFilters = searchTerm || typeFilter || statutFilter;

  return (
    <div className="space-y-6">
      <PageHead
        title="Historique des SMS"
        subtitle="Suivi de tous les messages envoyés"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'SMS', link: '/sms/history' },
          { label: 'Historique', link: '/sms/history' },
        ]}
        actions={[
          {
            icon: 'plus',
            label: 'Envoyer un SMS',
            onClick: () => navigate('/sms/send'),
            variant: 'primary',
          },
        ]}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {statistics.total}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Icon name="message-square" className="text-primary-600 dark:text-primary-400" size="lg" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Envoyés
                </p>
                <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
                  {statistics.envoyes}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Icon name="check-circle" className="text-green-600 dark:text-green-400" size="lg" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  En attente
                </p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600 dark:text-yellow-400">
                  {statistics.en_attente}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Icon name="clock" className="text-yellow-600 dark:text-yellow-400" size="lg" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taux de succès
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {statistics.taux_succes.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Icon name="trending-up" className="text-blue-600 dark:text-blue-400" size="lg" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h3>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
              >
                Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rechercher
                </label>
                <div className="relative">
                  <Icon name="search" className="absolute text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="Message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type de destinataire
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tous les types</option>
                  <option value="eleve">Élève</option>
                  <option value="parent">Parent</option>
                  <option value="classe">Classe</option>
                  <option value="niveau">Niveau</option>
                  <option value="tous">Tous</option>
                  <option value="personnalise">Personnalisé</option>
                </select>
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
                  <option value="envoye">Envoyé</option>
                  <option value="livre">Livré</option>
                  <option value="en_attente">En attente</option>
                  <option value="echoue">Échoué</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  variant="primary"
                  className="w-full"
                >
                  <Icon name="search" size="sm" className="mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Messages Table */}
      <Card>
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Messages ({meta.total})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="message-square" className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size="lg" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun message trouvé
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {hasActiveFilters
                  ? 'Aucun message ne correspond à vos critères.'
                  : 'Commencez par envoyer votre premier SMS.'}
              </p>
              <Button
                onClick={() => navigate('/sms/send')}
                variant="primary"
              >
                <Icon name="plus" size="sm" className="mr-2" />
                Envoyer un SMS
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Type
                    </th>
                    <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Message
                    </th>
                    <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {smsService.formatDate(message.date_envoi)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                          {smsService.getDestinataireTypeLabel(message.destinataire_type)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-md truncate" title={message.message}>
                          {message.message}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {smsService.calculateSegments(message.message)} SMS • {message.message.length} car.
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${smsService.getStatutColor(message.statut)}`}>
                          {smsService.getStatutLabel(message.statut)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Affichage {(meta.current_page - 1) * meta.per_page + 1}-
              {Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total}
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                disabled={meta.current_page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(meta.last_page, prev.page! + 1) }))}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SmsHistory;
