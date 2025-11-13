import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { anneeScolaireService, type AnneeScolaire } from '../../services/anneeScolaireService';

const AnneeScolaireShow: React.FC = () => {
  const { id } = useParams();
  const anneeScolaireId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [anneeScolaire, setAnneeScolaire] = useState<AnneeScolaire | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!anneeScolaireId) return;
    void loadAnneeScolaire();
  }, [anneeScolaireId]);

  const loadAnneeScolaire = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await anneeScolaireService.getById(anneeScolaireId);
      setAnneeScolaire(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      <PageHead 
        title={anneeScolaire ? anneeScolaire.nom : 'Année Scolaire'} 
        subtitle="Vue détaillée de l'année scolaire"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Années Scolaires', link: '/annees-scolaires' },
          { label: anneeScolaire ? anneeScolaire.nom : 'Détails', link: `/annees-scolaires/${anneeScolaireId}` }
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
        </div>
      ) : error ? (
        <Card><div className="p-6 text-red-600">{error}</div></Card>
      ) : anneeScolaire ? (
        <Card>
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            <div>
              <div className="text-sm text-slate-500">Nom</div>
              <div className="text-base font-medium">{anneeScolaire.nom}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Année de Début</div>
              <div className="text-base font-medium">
                {(() => {
                  if (anneeScolaire.annee_debut) return anneeScolaire.annee_debut;
                  if (anneeScolaire.nom && anneeScolaire.nom.match(/^(\d{4})-\d{4}$/)) {
                    return anneeScolaire.nom.match(/^(\d{4})-\d{4}$/)?.[1] || '-';
                  }
                  if (anneeScolaire.date_debut) {
                    return String(new Date(anneeScolaire.date_debut).getFullYear());
                  }
                  return '-';
                })()}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Année de Fin</div>
              <div className="text-base font-medium">
                {(() => {
                  if (anneeScolaire.annee_fin) return anneeScolaire.annee_fin;
                  if (anneeScolaire.nom && anneeScolaire.nom.match(/^\d{4}-(\d{4})$/)) {
                    return anneeScolaire.nom.match(/^\d{4}-(\d{4})$/)?.[1] || '-';
                  }
                  if (anneeScolaire.date_fin) {
                    return String(new Date(anneeScolaire.date_fin).getFullYear());
                  }
                  return '-';
                })()}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Date de Début</div>
              <div className="text-base">{new Date(anneeScolaire.date_debut).toLocaleDateString('fr-FR')}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Date de Fin</div>
              <div className="text-base">{new Date(anneeScolaire.date_fin).toLocaleDateString('fr-FR')}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-slate-500">Description</div>
              <div className="text-base">{anneeScolaire.description || 'Aucune description'}</div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 m-6">
            <Button variant="secondary" onClick={() => navigate(`/annees-scolaires/${anneeScolaireId}/edit`)}>
              <Icon name="edit" />
              <span className="ml-2">Modifier</span>
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default AnneeScolaireShow;
