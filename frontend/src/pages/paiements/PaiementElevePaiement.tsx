import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { paiementEleveService } from '../../services/paiementEleveService';
import { fraisScolaireService } from '../../services/fraisScolaireService';
import type { PaiementEleve, PaiementsEleveResponse, HistoriquePaiement } from '../../types/paiements';
import { useNotification } from '../../contexts/NotificationContext';

interface HistoriqueWithFrais extends HistoriquePaiement {
  frais_nom?: string;
  frais_type?: string;
  paiement_id?: number;
}

interface PaiementFormState {
  montant: string;
  mode_paiement: 'especes' | 'virement' | 'cheque';
  reference: string;
  notes: string;
}

const PaiementElevePaiement: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const paiementFromState = (location.state as { paiement?: PaiementEleve } | undefined)?.paiement;
  const { showSuccess, showError } = useNotification();

  const [paiement, setPaiement] = useState<PaiementEleve | null>(paiementFromState ?? null);
  const [loading, setLoading] = useState(!paiementFromState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ montant?: string }>({});
  const [form, setForm] = useState<PaiementFormState>({
    montant: '',
    mode_paiement: 'especes',
    reference: '',
    notes: ''
  });
  const [contexteMensuel, setContexteMensuel] = useState<PaiementsEleveResponse['data'] | null>(null);
  const [fraisDetails, setFraisDetails] = useState<PaiementEleve['frais_scolaire'] | null>(paiementFromState?.frais_scolaire ?? null);

  useEffect(() => {
    if (id) {
      loadPaiement(parseInt(id, 10));
    }
  }, [id]);

  useEffect(() => {
    if (paiement) {
      const montantRestant = Number(paiement.montant_restant) || 0;
      setForm(prev => ({
        ...prev,
        montant: montantRestant > 0 ? montantRestant.toFixed(2) : '',
      }));
    }
  }, [paiement]);

  const paiementCourant = useMemo(() => {
    if (!paiement) return null;
    if (!contexteMensuel?.paiements) return paiement;
    const retrouve = contexteMensuel.paiements.find((p) => p.id === paiement.id);
    return retrouve ?? paiement;
  }, [paiement, contexteMensuel]);

  const eleveId = paiement?.eleve_id;
  const mois = paiement?.mois;
  const paiementsLength = contexteMensuel?.paiements?.length ?? 0;
  const hasFraisScolaire = !!paiement?.frais_scolaire;

  useEffect(() => {
    if (!eleveId || !mois) {
      return;
    }

    const shouldLoadContext =
      !contexteMensuel ||
      paiementsLength === 0 ||
      !hasFraisScolaire;

    if (shouldLoadContext) {
      loadContexte(eleveId, mois, paiement);
    }
  }, [eleveId, mois, paiementsLength, hasFraisScolaire, contexteMensuel]);

  useEffect(() => {
    if (!paiementCourant) {
      setFraisDetails(null);
      return;
    }

    // Laravel peut retourner en camelCase ou snake_case
    const fraisLoaded = (paiementCourant as any).fraisScolaire || paiementCourant.frais_scolaire;
    
    // Priorité 1: utiliser frais_scolaire/fraisScolaire déjà chargé et valide (avec nom)
    if (fraisLoaded && 
        typeof fraisLoaded === 'object' && 
        fraisLoaded.nom) {
      setFraisDetails(fraisLoaded);
      return;
    }

    // Priorité 2: charger depuis frais_scolaire_id si disponible
    const fraisScolaireId = paiementCourant.frais_scolaire_id || (paiementCourant as any).fraisScolaireId;
    if (fraisScolaireId) {
      // Toujours charger depuis l'API pour être sûr d'avoir les données complètes
      (async () => {
        try {
          const response = await fraisScolaireService.getFraisScolaire(fraisScolaireId);
          if (response.success && response.data) {
            setFraisDetails(response.data);
          }
        } catch (err) {
          console.error("Erreur lors du chargement du frais scolaire:", err);
        }
      })();
    } else {
      // Pas de frais_scolaire_id, réinitialiser
      setFraisDetails(null);
    }
  }, [paiementCourant]);

  const loadContexte = async (eleveId: number, mois: string, paiementInitial?: PaiementEleve | null) => {
    try {
      const response = await paiementEleveService.getPaiementsEleves({
        eleve_id: eleveId,
        mois,
        per_page: 100,
      });

      if (response.success) {
        const paiements = response.data ?? [];
        const eleveAssocie = paiements.length > 0 ? paiements[0].eleve : paiementInitial?.eleve || paiement?.eleve;

        const totaux = paiements.reduce(
          (acc, paiementCourant) => {
            const montantDu = Number(paiementCourant.montant_du) || 0;
            const montantPaye = Number(paiementCourant.montant_paye) || 0;
            const montantRestant = Number(paiementCourant.montant_restant) || 0;

            acc.total_du += montantDu;
            acc.total_paye += montantPaye;
            acc.total_restant += montantRestant;

            if (paiementCourant.statut === 'regle') {
              acc.paiements_regles += 1;
            }

            const enRetard =
              paiementCourant.statut === 'en_retard' ||
              (paiementCourant.statut === 'en_attente' && paiementCourant.date_echeance && new Date(paiementCourant.date_echeance) < new Date());

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

        setContexteMensuel({
          eleve: eleveAssocie,
          paiements,
          totaux,
        });

        setPaiement((prev) => {
          if (!prev?.id) {
            return prev;
          }

          const paiementComplet = paiements.find((p) => p.id === prev.id);
          if (paiementComplet) {
            // Mettre à jour fraisDetails si le paiement complet a frais_scolaire/fraisScolaire
            const fraisLoaded = (paiementComplet as any).fraisScolaire || paiementComplet.frais_scolaire;
            if (fraisLoaded && 
                typeof fraisLoaded === 'object' &&
                (fraisLoaded.nom || fraisLoaded.id)) {
              setFraisDetails(fraisLoaded);
            }
            // Le useEffect se chargera de charger depuis frais_scolaire_id si nécessaire
            return paiementComplet;
          }
          return prev;
        });
      }
    } catch (err) {
      // pas critique si le contexte mensuel échoue
    }
  };

  const loadPaiement = async (paiementId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await paiementEleveService.getPaiementEleve(paiementId);
      if (response.success && response.data) {
        const paiementData = response.data;
        setPaiement(paiementData);
        
        // Initialiser fraisDetails si frais_scolaire/fraisScolaire est présent
        const fraisLoaded = (paiementData as any).fraisScolaire || paiementData.frais_scolaire;
        if (fraisLoaded && 
            typeof fraisLoaded === 'object' &&
            (fraisLoaded.nom || fraisLoaded.id)) {
          setFraisDetails(fraisLoaded);
        }
        
        // Charger le contexte mensuel si on a eleve_id et mois pour avoir toutes les données
        if (paiementData.eleve_id && paiementData.mois) {
          loadContexte(paiementData.eleve_id, paiementData.mois, paiementData);
        }
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

  const formatMontant = (montant?: number | null) => paiementEleveService.formatMontant(montant ?? 0);
  const formatDate = (date?: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const remainingAmount = useMemo(() => {
    if (!paiementCourant) return 0;
    return Number(paiementCourant.montant_restant) || 0;
  }, [paiementCourant]);

  const historiqueComplet = useMemo<HistoriqueWithFrais[]>(() => {
    // Agréger tous les historiques de tous les paiements du mois
    const allHistorique: HistoriqueWithFrais[] = [];
    
    // Utiliser contexteMensuel si disponible, sinon utiliser paiementCourant
    const paiementsToUse = contexteMensuel?.paiements && contexteMensuel.paiements.length > 0 
      ? contexteMensuel.paiements 
      : (paiementCourant ? [paiementCourant] : []);
    
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
  }, [contexteMensuel?.paiements, paiementCourant]);

  const handleInputChange = (field: keyof PaiementFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = event.target;
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const errors: { montant?: string } = {};

    const montantValue = parseFloat(form.montant.replace(',', '.'));
    if (Number.isNaN(montantValue)) {
      errors.montant = 'Veuillez saisir un montant valide';
    } else if (montantValue <= 0) {
      errors.montant = 'Le montant doit être supérieur à 0';
    } else if (montantValue > remainingAmount) {
      errors.montant = 'Le montant dépasse le montant restant';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paiementCourant) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const montantValue = parseFloat(form.montant.replace(',', '.'));
      const response = await paiementEleveService.enregistrerPaiement(paiementCourant.id, {
        montant: montantValue,
        mode_paiement: form.mode_paiement,
        reference: form.reference || undefined,
        notes: form.notes || undefined
      });

      if (response.success) {
        showSuccess('Succès', response.message || 'Paiement enregistré avec succès');
        navigate(`/paiements-eleves/${paiementCourant.id}`);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement du paiement';
      showError('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

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
          title="Enregistrer un paiement"
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

  if (!paiementCourant) {
    return null;
  }

  const eleve = paiementCourant.eleve ?? contexteMensuel?.eleve;
  const classe = eleve?.classe ?? paiementCourant.eleve?.classe;
  // Gérer les deux formats (camelCase et snake_case)
  const frais = (paiementCourant as any).fraisScolaire || paiementCourant.frais_scolaire || fraisDetails;
  const isFullyPaid = remainingAmount <= 0;

  const getEleveName = () => {
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

  return (
    <div className="space-y-6">
      <PageHead
        title="Encaissement d'un paiement"
        subtitle="Suivi et règlement des frais pour l'élève"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Paiements Élèves', link: '/paiements-eleves' },
          { label: `Paiement #${paiementCourant.id ?? id}`, link: `/paiements-eleves/${paiementCourant.id ?? id}` },
          { label: 'Encaisser', link: '#' }
        ]}
        actions={[
          {
            icon: 'arrow-left',
            label: 'Retour au détail',
            onClick: () => navigate(`/paiements-eleves/${paiementCourant.id ?? id}`, { state: { paiement: paiementCourant } }),
            variant: 'outline' as const
          }
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Informations élève</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nom complet</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{getEleveName()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Matricule</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {(eleve as any)?.matricule || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Classe</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {classe?.nom || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Niveau</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {classe?.niveau?.nom || '—'}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Détails du frais</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Intitulé</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{frais?.nom || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{fraisScolaireService.getTypeLabel(frais?.type || '')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mois concerné</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{paiementEleveService.formatMois(paiementCourant.mois ?? null)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Échéance</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{formatDate(paiementCourant.date_echeance ?? null)}</p>
                </div>
              </div>
              <div className="grid gap-4 mt-6 sm:grid-cols-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Montant dû</p>
                  <p className="mt-2 text-xl font-semibold text-blue-900 dark:text-blue-200">{formatMontant(paiementCourant.montant_du ?? 0)}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Montant payé</p>
                  <p className="mt-2 text-xl font-semibold text-green-900 dark:text-green-200">{formatMontant(paiementCourant.montant_paye ?? 0)}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Montant restant</p>
                  <p className="mt-2 text-xl font-semibold text-orange-900 dark:text-orange-200">{formatMontant(paiementCourant.montant_restant ?? 0)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                <span className={`inline-flex px-3 py-1 mt-2 text-sm font-semibold rounded-full ${paiementEleveService.getStatutColor(paiementCourant.statut || 'en_attente')}`}>
                  {paiementCourant.statut_label || 'En Attente'}
                </span>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Nouveau paiement</h3>
            </Card.Header>
            <Card.Body>
              {isFullyPaid && (
                <div className="p-4 mb-6 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center">
                    <Icon name="check" className="text-green-600 dark:text-green-400" />
                    <p className="ml-3 text-sm text-green-700 dark:text-green-300">
                      Ce paiement est déjà réglé. Aucun montant restant à payer.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Montant à encaisser
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.montant}
                    onChange={handleInputChange('montant')}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formErrors.montant ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                    disabled={isFullyPaid || submitting}
                    placeholder="0.00"
                    required
                  />
                  {formErrors.montant && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.montant}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mode de paiement
                  </label>
                  <select
                    value={form.mode_paiement}
                    onChange={handleInputChange('mode_paiement')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isFullyPaid || submitting}
                  >
                    <option value="especes">Espèces</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Référence (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={handleInputChange('reference')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isFullyPaid || submitting}
                    placeholder="Référence bancaire, numéro de chèque…"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes (optionnel)
                  </label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={handleInputChange('notes')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isFullyPaid || submitting}
                    placeholder="Ajouter des détails sur le paiement"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isFullyPaid || submitting}
                    className="inline-flex items-center"
                  >
                    {submitting && (
                      <span className="mr-2">
                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      </span>
                    )}
                    Enregistrer le paiement
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Résumé global du mois</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total dû</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatMontant(contexteMensuel?.totaux?.total_du ?? paiementCourant.montant_du ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total payé</span>
                  <span className="text-base font-semibold text-green-600 dark:text-green-400">
                    {formatMontant(contexteMensuel?.totaux?.total_paye ?? paiementCourant.montant_paye ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total restant</span>
                  <span className="text-base font-semibold text-orange-600 dark:text-orange-400">
                    {formatMontant(contexteMensuel?.totaux?.total_restant ?? paiementCourant.montant_restant ?? 0)}
                  </span>
                </div>
                
              </div>
            </Card.Body>
          </Card>

          {contexteMensuel?.paiements && contexteMensuel.paiements.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Tous les frais du mois</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  {contexteMensuel.paiements.map((p) => {
                    const isCurrent = p.id === paiementCourant.id;
                    const fraisP = (p as any).fraisScolaire || p.frais_scolaire;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isCurrent 
                            ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => {
                          if (!isCurrent) {
                            navigate(`/paiements-eleves/${p.id}/paiement`, { 
                              state: { paiement: p } 
                            });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {fraisP?.nom || fraisScolaireService.getTypeLabel(fraisP?.type || '')}
                              </p>
                              {isCurrent && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 whitespace-nowrap">
                                  En cours
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {fraisScolaireService.getTypeLabel(fraisP?.type || '')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {formatMontant(p.montant_restant ?? 0)}
                            </p>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${paiementEleveService.getStatutColor(p.statut || 'en_attente')}`}>
                              {p.statut_label || 'En Attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Historique des versements du mois</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{historiqueComplet.length} enregistrements</span>
              </div>
            </Card.Header>
            <Card.Body>
              {historiqueComplet.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon name="credit-card" className="text-gray-400 dark:text-gray-500" size="lg" />
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aucun versement enregistré pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historiqueComplet.map((entry) => (
                    <div key={`${entry.paiement_id}-${entry.id}`} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.frais_nom || fraisScolaireService.getTypeLabel(entry.frais_type || '')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({fraisScolaireService.getTypeLabel(entry.frais_type || '')})
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(entry.date_paiement)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatMontant(entry.montant)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Mode : {entry.mode_paiement_label || paiementEleveService.getModePaiementLabel(entry.mode_paiement)}
                        </span>
                        {entry.reference && (
                          <span>
                            Référence : {entry.reference}
                          </span>
                        )}
                        {entry.utilisateur && (
                          <span>
                            Enregistré par : {entry.utilisateur.prenom} {entry.utilisateur.nom}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Notes : {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaiementElevePaiement;

