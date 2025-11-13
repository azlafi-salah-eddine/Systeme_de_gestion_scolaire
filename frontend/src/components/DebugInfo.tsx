import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnneeScolaire } from '../contexts/AnneeScolaireContext';

const DebugInfo: React.FC = () => {
  const { user } = useAuth();
  const { anneesScolaires, loading, error, anneeActive } = useAnneeScolaire();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div><strong>User:</strong> {user ? `${user.name} (${user.roles?.join(', ')})` : 'Non connecté'}</div>
        <div><strong>Is Admin:</strong> {user?.roles?.includes('admin') || user?.roles?.includes('Admin') ? 'Oui' : 'Non'}</div>
        <div><strong>Loading:</strong> {loading ? 'Oui' : 'Non'}</div>
        <div><strong>Error:</strong> {error || 'Aucune'}</div>
        <div><strong>Années:</strong> {anneesScolaires.length}</div>
        <div><strong>Active:</strong> {anneeActive?.nom || 'Aucune'}</div>
      </div>
    </div>
  );
};

export default DebugInfo;
