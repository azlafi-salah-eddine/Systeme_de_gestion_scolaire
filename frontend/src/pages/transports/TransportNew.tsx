import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { transportService } from '../../services/transportService';
import type { Chauffeur, Accompagnateur, Transport } from '../../types/eleve';
import { useNotification } from '../../contexts/NotificationContext';

const TransportNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [ligne, setLigne] = useState('');
  const [matricule, setMatricule] = useState('');
  const [capacite, setCapacite] = useState<string>('');
  const [chauffeurId, setChauffeurId] = useState<string>('');
  const [accompagnateurId, setAccompagnateurId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [accompagnateurs, setAccompagnateurs] = useState<Accompagnateur[]>([]);

  useEffect(() => {
    void loadChauffeursAndAccompagnateurs();
  }, []);

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

      const availableChauffeurs = chauffeursRes.data.filter((c) => !usedChauffeurIds.has(c.id));
      const availableAccompagnateurs = accompagnateursRes.data.filter((a) => !usedAccompagnateurIds.has(a.id));

      setChauffeurs(availableChauffeurs);
      setAccompagnateurs(availableAccompagnateurs);
    } catch (e) {
      setError('Erreur lors du chargement des données');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ligne.trim()) return setError('La ligne est requise');
    if (!matricule.trim()) return setError('Le matricule est requis');
    const matriculePattern = /^\d{1,5}-[A-Za-z\u0600-\u06FF]{1}-\d{1,2}$/;
    if (!matriculePattern.test(matricule.trim())) {
      return setError('Format matricule invalide. Ex: 12345-A-12 ou 12345-أ-06');
    }
    const capNum = Number(capacite);
    if (Number.isNaN(capNum) || capNum < 1) return setError('Capacité invalide');
    
    try {
      setLoading(true);
      setError(null);
      await transportService.create({
        ligne: ligne.trim(),
        matricule: matricule.trim(),
        capacite: capNum,
        chauffeur_id: chauffeurId ? Number(chauffeurId) : undefined,
        accompagnateur_id: accompagnateurId ? Number(accompagnateurId) : undefined,
      });
      showSuccess('Transport créé', 'Le transport a été créé avec succès.');
      navigate('/transports');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de création';
      setError(message);
      showError('Échec de création', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Nouveau transport" 
        subtitle="Créer un nouveau transport scolaire"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Transports', link: '/transports' },
          { label: 'Nouveau', link: '/transports/new' }
        ]}
      />

      <Card>
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600">{error}</div>}

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">Ligne *</label>
            <input 
              type="text"
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2.5"
              value={ligne}
              onChange={(e) => setLigne(e.target.value)}
              placeholder="Départ - xx - xx - xx - Fin"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Écrivez le trajet complet sous la forme: Départ - Arrêt1 - Arrêt2 - Arrêt3 - Fin.
              
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">Matricule *</label>
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
              <label className="block mb-1 text-sm font-medium text-slate-700">Capacité *</label>
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">Chauffeur</label>
              <select 
                className="block w-full rounded-md shadow-sm border-slate-300 focus:border-primary-500 focus:ring-primary-500"
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
              <label className="block mb-1 text-sm font-medium text-slate-700">Accompagnateur</label>
              <select 
                className="block w-full rounded-md shadow-sm border-slate-300 focus:border-primary-500 focus:ring-primary-500"
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
            <Button type="button" variant="secondary" onClick={() => navigate('/transports')}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Créer'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TransportNew;