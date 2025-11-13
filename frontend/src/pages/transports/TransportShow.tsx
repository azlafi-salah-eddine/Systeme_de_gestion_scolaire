import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PermissionGate from '../../components/PermissionGate';
import { transportService } from '../../services/transportService';
import { useNotification } from '../../contexts/NotificationContext';
import type { Transport } from '../../types/eleve';

const TransportShow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<Transport | null>(null);

  useEffect(() => {
    if (id) {
      void loadTransport();
    }
  }, [id]);

  const loadTransport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transportService.show(parseInt(id!), ['chauffeur', 'accompagnateur', 'eleves']);
      setTransport(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transport || !confirm('Supprimer ce transport ?')) return;
    try {
      await transportService.remove(transport.id);
      showSuccess('Transport masqué', 'Le transport a été masqué (soft delete). Vous pouvez le restaurer depuis Enregistrements supprimés.');
      navigate('/transports');
    } catch (e) {
      showError('Erreur de suppression', e instanceof Error ? e.message : 'Erreur de suppression');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Transport" 
          subtitle="Chargement..."
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Transports', link: '/transports' },
            { label: 'Détails', link: `/transports/${id}` }
          ]}
        />
        <Card>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !transport) {
    return (
      <div className="space-y-6">
        <PageHead 
          title="Erreur" 
          subtitle={error || 'Transport introuvable'}
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Transports', link: '/transports' },
            { label: 'Détails', link: `/transports/${id}` }
          ]}
        />
        <Card>
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            {error || 'Transport introuvable'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title={transport.ligne} 
        subtitle="Détails du transport"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informations générales</h3>
            <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Ligne</dt>
              <dd className="text-slate-900 dark:text-white">{transport.ligne}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Matricule</dt>
              <dd className="text-slate-900 dark:text-white">{transport.matricule || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Capacité</dt>
              <dd className="text-slate-900 dark:text-white">{transport.capacite} places</dd>
            </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Créé le</dt>
                <dd className="text-slate-900 dark:text-white">{new Date(transport.created_at).toLocaleDateString('fr-FR')}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personnel</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Chauffeur</dt>
                <dd className="text-slate-900 dark:text-white">
                  {transport.chauffeur ? (
                    transport.chauffeur.active === false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">Supprimé</span>
                    ) : (
                      <div>
                        <div className="font-medium">{transport.chauffeur.prenom} {transport.chauffeur.nom}</div>
                        {transport.chauffeur.telephone && (
                          <div className="text-sm text-slate-500 dark:text-gray-400">{transport.chauffeur.telephone}</div>
                        )}
                      </div>
                    )
                  ) : (
                    <span className="text-slate-400 dark:text-gray-500">Non assigné</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-gray-400">Accompagnateur</dt>
                <dd className="text-slate-900 dark:text-white">
                  {transport.accompagnateur ? (
                    transport.accompagnateur.active === false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">Supprimé</span>
                    ) : (
                      <div>
                        <div className="font-medium">{transport.accompagnateur.prenom} {transport.accompagnateur.nom}</div>
                        {transport.accompagnateur.telephone && (
                          <div className="text-sm text-slate-500 dark:text-gray-400">{transport.accompagnateur.telephone}</div>
                        )}
                      </div>
                    )
                  ) : (
                    <span className="text-slate-400 dark:text-gray-500">Non assigné</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      {transport.eleves && transport.eleves.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Élèves inscrits ({transport.eleves.length})</h3>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Nom</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Prénom</th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Matricule</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {transport.eleves.map((eleve) => (
                    <tr key={eleve.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{eleve.nom_fr || eleve.nom}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{eleve.prenom_fr || eleve.prenom}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">{eleve.matricule || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TransportShow;
