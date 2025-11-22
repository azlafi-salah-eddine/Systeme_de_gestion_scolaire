import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import AnneeScolaireTable from './AnneeScolaireTable';

const AnneesScolairesIndex: React.FC = () => {
  const { anneesScolaires, loading } = useAnneeScolaire();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only super_admin can manage années scolaires
  const isSuperAdmin = !!(user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Années Scolaires"
        subtitle="Gestion des années scolaires"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Années Scolaires', link: '/annees-scolaires' }
        ]}
        actions={[
          isSuperAdmin ? { label: 'Nouvelle année', link: '/annees-scolaires/new', variant: 'primary' as const } : undefined
        ].filter((action): action is { label: string; link: string; variant: 'primary' } => action !== undefined)}
      />

      <Card>
        <AnneeScolaireTable
          anneesScolaires={anneesScolaires}
          onEdit={(annee: any) => navigate(`/annees-scolaires/${annee.id}/edit`)}
          isAdmin={isSuperAdmin || false}
        />
      </Card>
    </div>
  );
};

export default AnneesScolairesIndex;
