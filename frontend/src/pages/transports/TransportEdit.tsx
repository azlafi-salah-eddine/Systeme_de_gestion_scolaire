import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { transportService } from '../../services/transportService';
import type { Transport, Chauffeur, Accompagnateur } from '../../types/eleve';
import { useNotification } from '../../contexts/NotificationContext';

const TransportEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const [ligne, setLigne] = useState('');
  const [matricule, setMatricule] = useState('');
  const [capacite, setCapacite] = useState<string>('');
  const [chauffeurId, setChauffeurId] = useState<string>('');
  const [accompagnateurId, setAccompagnateurId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<Transport | null>(null);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [accompagnateurs, setAccompagnateurs] = useState<Accompagnateur[]>([]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      void loadTransport();
      void loadChauffeursAndAccompagnateurs();
    }
  }, [id]);

  const loadChauffeursAndAccompagnateurs = async () => {
    try {
      const [chauffeursRes, accompagnateursRes, transportsRes] = await Promise.all([
        transportService.listChauffeurs({ per_page: 1000 }),
        transportService.listAccompagnateurs({ per_page: 1000 }),
        transportService.list({ per_page: 1000, with: ['chauffeur', 'accompagnateur'] }),
      ]);

      const usedChauffeurIds = new Set<number>();
      const usedAccompagnateurIds = new Set<number>();
      (transportsRes.data as Transport[]).forEach((t) => {
        if (t.chauffeur_id) usedChauffeurIds.add(t.chauffeur_id);
        if (t.accompagnateur_id) usedAccompagnateurIds.add(t.accompagnateur_id);
      });

      const currentChauffeurId = transport?.chauffeur_id;
      const currentAccompagnateurId = transport?.accompagnateur_id;
      const availableChauffeurs = chauffeursRes.data.filter((c) => !usedChauffeurIds.has(c.id) || c.id === currentChauffeurId);
      const availableAccompagnateurs = accompagnateursRes.data.filter((a) => !usedAccompagnateurIds.has(a.id) || a.id === currentAccompagnateurId);

      setChauffeurs(availableChauffeurs);
      setAccompagnateurs(availableAccompagnateurs);
    } catch (e) {
      setError('Erreur lors du chargement des données');
    }
  };

  const loadTransport = async () => {
    try {
      setError(null);
      const res = await transportService.show(parseInt(id!));
      const t: Transport = res.data as any;
      setTransport(t);
      setLigne(t.ligne || '');
      setCapacite(String(t.capacite ?? ''));
      setMatricule(t.matricule || '');
      setChauffeurId(t.chauffeur_id ? String(t.chauffeur_id) : '');
      setAccompagnateurId(t.accompagnateur_id ? String(t.accompagnateur_id) : '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ligne.trim()) return setError('La ligne est requise');
    const capNum = Number(capacite);
    if (Number.isNaN(capNum) || capNum < 1) return setError('Capacité invalide');
    
    try {
      setSaving(true);
      setError(null);
      const matriculePattern = /^\d{1,5}-[A-Za-z\u0600-\u06FF]{1}-\d{1,2}$/;
      if (!matriculePattern.test(matricule.trim())) {
        setSaving(false);
        return setError('Format matricule invalide. Ex: 12345-A-12 ou 1234-أ-9');
      }
      await transportService.update(parseInt(id!), {
        ligne: ligne.trim(),
        matricule: matricule.trim(),
        capacite: capNum,
        chauffeur_id: chauffeurId ? Number(chauffeurId) : undefined,
        accompagnateur_id: accompagnateurId ? Number(accompagnateurId) : undefined,
      } as any);
      showSuccess('Transport modifié', 'Le transport a été mis à jour avec succès.');
      navigate(`/transports/${id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de mise à jour';
      setError(message);
      showError('Échec de modification', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier transport" 
        subtitle="Mettre à jour les informations"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Transports', link: '/transports' },
          { label: 'Modifier', link: `/transports/${id}/edit` }
        ]}
      />

      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-600">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ligne *</label>
                <input 
                  type="text"
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2.5"
                  value={ligne}
                  onChange={(e) => setLigne(e.target.value)}
                  placeholder="Ex: Ligne A - Centre ville"
                  required
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Matricule *</label>
              <input 
                type="text"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2.5"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                placeholder="Ex: 12345-A-12 ou 1234-أ-9"
                required
              />
            </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacité *</label>
                <input 
                  type="number" min="1" step="1"
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2.5"
                  value={capacite}
                  onChange={(e) => setCapacite(e.target.value)}
                  placeholder="Nombre de places"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur</label>
                <select 
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={chauffeurId}
                  onChange={(e) => setChauffeurId(e.target.value)}
                >
                  <option value="">Sélectionner un chauffeur</option>
                  {chauffeurs.map((chauffeur) => (
                    <option key={chauffeur.id} value={chauffeur.id}>
                      {chauffeur.prenom} {chauffeur.nom} - {chauffeur.permis}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Accompagnateur</label>
                <select 
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={accompagnateurId}
                  onChange={(e) => setAccompagnateurId(e.target.value)}
                >
                  <option value="">Sélectionner un accompagnateur</option>
                  {accompagnateurs.map((accompagnateur) => (
                    <option key={accompagnateur.id} value={accompagnateur.id}>
                      {accompagnateur.prenom} {accompagnateur.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default TransportEdit;