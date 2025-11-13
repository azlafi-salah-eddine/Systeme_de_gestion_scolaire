import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { paiementEleveService } from '../../services/paiementEleveService';
import { fraisScolaireService } from '../../services/fraisScolaireService';
import type { PaiementEleve, HistoriquePaiement } from '../../types/paiements';
import { useNotification } from '../../contexts/NotificationContext';

interface HistoriqueWithFrais extends HistoriquePaiement {
  frais_nom?: string;
  frais_type?: string;
  paiement_id?: number;
}

const PaiementEleveShow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const paiementFromState = (location.state as { paiement?: PaiementEleve } | undefined)?.paiement;
  const { showError } = useNotification();

  const [paiement, setPaiement] = useState<PaiementEleve | null>(paiementFromState ?? null);
  const [allPaiements, setAllPaiements] = useState<PaiementEleve[]>([]);
  const [loading, setLoading] = useState(!paiementFromState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPaiement(parseInt(id, 10));
    }
  }, [id]);

  useEffect(() => {
    // Charger tous les paiements du mois une fois qu'on a le paiement principal
    if (paiement?.eleve_id && paiement?.mois) {
      loadAllPaiementsMois(paiement.eleve_id, paiement.mois);
    }
  }, [paiement?.eleve_id, paiement?.mois]);

  const loadPaiement = async (paiementId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await paiementEleveService.getPaiementEleve(paiementId);
      if (response.success) {
        setPaiement(response.data);
      } else {
        setError("Impossible de charger ce paiement");
      }
    } catch (err: any) {
      const message = err?.message || "Erreur lors du chargement du paiement";
      setError(message);
      showError('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPaiementsMois = async (eleveId: number, mois: string) => {
    try {
      const response = await paiementEleveService.getPaiementsEleves({
        eleve_id: eleveId,
        mois,
        per_page: 100,
      });
      if (response.success && response.data) {
        setAllPaiements(response.data);
      }
    } catch (err) {
      // Pas critique si ça échoue
      console.error("Erreur lors du chargement des paiements du mois:", err);
    }
  };

  const statutBadgeClass = useMemo(() => {
    if (!paiement) return 'bg-gray-100 text-gray-800';
    return paiementEleveService.getStatutColor(paiement.statut);
  }, [paiement]);

  const getEleveName = () => {
    const eleve = paiement?.eleve;
    if (!eleve) return '—';
    if (typeof eleve.nom_complet === 'string' && eleve.nom_complet.trim().length > 0) {
      return eleve.nom_complet.trim();
    }
    const parts = [
      (eleve as any)?.prenom_fr,
      (eleve as any)?.nom_fr,
      eleve.prenom,
      eleve.nom,
    ]
      .filter((part): part is string => typeof part === 'string')
      .map(part => part.trim())
      .filter(part => part.length > 0);

    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '—';
    const parsed = new Date(date);
    return parsed.toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant?: number | null) => {
    return paiementEleveService.formatMontant(montant ?? 0);
  };

  const totauxMois = useMemo(() => {
    const paiementsToUse = allPaiements.length > 0 ? allPaiements : (paiement ? [paiement] : []);
    
    return paiementsToUse.reduce(
      (acc, p) => {
        const montantDu = Number(p.montant_du) || 0;
        const montantPaye = Number(p.montant_paye) || 0;
        const montantRestant = Number(p.montant_restant) || 0;

        acc.total_du += montantDu;
        acc.total_paye += montantPaye;
        acc.total_restant += montantRestant;

        if (p.statut === 'regle') {
          acc.paiements_regles += 1;
        }

        const enRetard =
          p.statut === 'en_retard' ||
          (p.statut === 'en_attente' && p.date_echeance && new Date(p.date_echeance) < new Date());

        if (enRetard) {
          acc.paiements_en_retard += 1;
        }

        return acc;
      },
      {
        total_du: 0,
        total_paye: 0,
        total_restant: 0,
        paiements_regles: 0,
        paiements_en_retard: 0,
      }
    );
  }, [allPaiements, paiement]);

  const historique = useMemo<HistoriqueWithFrais[]>(() => {
    // Agréger tous les historiques de tous les paiements du mois
    const allHistorique: HistoriqueWithFrais[] = [];
    
    // Utiliser allPaiements si disponible, sinon utiliser le paiement principal
    const paiementsToUse = allPaiements.length > 0 ? allPaiements : (paiement ? [paiement] : []);
    
    paiementsToUse.forEach((p) => {
      const fraisP = (p as any).fraisScolaire || p.frais_scolaire;
      if (p.historique_paiements && Array.isArray(p.historique_paiements)) {
        p.historique_paiements.forEach((h: HistoriquePaiement) => {
          allHistorique.push({
            ...h,
            frais_nom: fraisP?.nom || (fraisP ? fraisScolaireService.getTypeLabel(fraisP.type || '') : ''),
            frais_type: fraisP?.type,
            paiement_id: p.id,
          });
        });
      }
    });
    
    // Trier par date (plus récent en premier)
    return allHistorique.sort((a, b) => {
      const dateA = a.date_paiement ? new Date(a.date_paiement).getTime() : 0;
      const dateB = b.date_paiement ? new Date(b.date_paiement).getTime() : 0;
      return dateB - dateA;
    });
  }, [allPaiements, paiement]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  if (error && !paiement) {
    return (
      <div className="space-y-6">
        <PageHead
          title="Détail du paiement"
          subtitle="Gestion des paiements élèves"
          breadcrumb={[
            { label: 'Accueil', link: '/dashboard' },
            { label: 'Paiements Élèves', link: '/paiements-eleves' }
          ]}
        />
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="alert" className="text-red-500 dark:text-red-400" size="lg" />
              <p className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-200">{error}</p>
              <Button className="mt-6" onClick={() => navigate(-1)}>
                <Icon name="arrow-left" className="mr-2" />
                Retour
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!paiement) {
    return null;
  }

  const eleve = paiement.eleve;
  const classe = eleve?.classe;

  return (
    <div className="space-y-6">
      <PageHead
        title="Détail du paiement élève"
        subtitle="Consultez l'état complet du paiement"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Paiements Élèves', link: '/paiements-eleves' },
          { label: `Paiement #${paiement.id ?? id}`, link: '#' }
        ]}
        actions={[
          ...(paiement.statut !== 'regle'
            ? [{
                icon: 'credit-card',
                label: 'Enregistrer un paiement',
                onClick: () => navigate(`/paiements-eleves/${paiement.id ?? id}/paiement`, { state: { paiement } }),
                variant: 'primary' as const
              }]
            : []),
          {
            icon: 'arrow-left',
            label: 'Retour',
            onClick: () => navigate(-1),
            variant: 'outline' as const
          }
        ]}
      />

    

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Informations sur l'élève */}
        <Card className="xl:col-span-2">
          <Card.Header>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Informations sur l'élève</h3>
          </Card.Header>
          <Card.Body>
            {eleve ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nom complet</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {getEleveName()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Classe</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{classe?.nom || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Niveau</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {classe?.niveau?.nom || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mois concerné</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {paiementEleveService.formatMois(paiement.mois)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucune information sur l'élève.</p>
            )}
          </Card.Body>
        </Card>

        {/* Résumé global du mois */}
        <Card>
          <Card.Header>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Résumé global du mois</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total dû</span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatMontant(totauxMois.total_du)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total payé</span>
                <span className="text-base font-semibold text-green-600 dark:text-green-400">
                  {formatMontant(totauxMois.total_paye)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total restant</span>
                <span className="text-base font-semibold text-orange-600 dark:text-orange-400">
                  {formatMontant(totauxMois.total_restant)}
                </span>
              </div>
            
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Historique des paiements */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Historique des paiements du mois</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{historique.length} enregistrements</span>
          </div>
        </Card.Header>
        <Card.Body>
          {historique.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="credit-card" className="text-gray-400 dark:text-gray-500" size="lg" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aucun paiement enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Frais
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                      Montant
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Mode
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Référence
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                      Enregistré par
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {historique.map((entry) => (
                    <tr key={`${entry.paiement_id}-${entry.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            {entry.frais_nom || fraisScolaireService.getTypeLabel(entry.frais_type || '')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fraisScolaireService.getTypeLabel(entry.frais_type || '')}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-xs text-gray-900 dark:text-white">{formatDate(entry.date_paiement)}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">{formatMontant(entry.montant)}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-xs text-gray-900 dark:text-white">{entry.mode_paiement_label}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-xs text-gray-900 dark:text-white">{entry.reference || '—'}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-xs text-gray-900 dark:text-white">
                          {entry.utilisateur ? `${entry.utilisateur.prenom} ${entry.utilisateur.nom}` : '—'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaiementEleveShow;

