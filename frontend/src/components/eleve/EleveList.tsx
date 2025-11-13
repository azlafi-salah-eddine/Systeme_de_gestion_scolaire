import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PermissionGate from '../PermissionGate';
import StudentPhoto from '../ui/StudentPhoto';
import type { Eleve } from '../../types/eleve';

interface EleveListProps {
  eleves: Eleve[];
  loading?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (eleve: Eleve) => void;
}

const EleveList: React.FC<EleveListProps> = ({ eleves, loading, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const filteredEleves = eleves.filter(eleve => {
    const nom = eleve.nom_fr || eleve.nom || '';
    const prenom = eleve.prenom_fr || eleve.prenom || '';
    const matricule = eleve.matricule || eleve.cne || eleve.cin || '';
    
    const matchesSearch = nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matricule.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClasse = !filterClasse || eleve.classe?.id.toString() === filterClasse;
    const matchesActive = !filterActive || eleve.active.toString() === filterActive;
    
    return matchesSearch && matchesClasse && matchesActive;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Rechercher
            </label>
            <div className="relative">
              <Icon name="search" className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Nom, prénom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Classe
            </label>
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Toutes les classes</option>
              {/* Options will be populated from classes data */}
            </select>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredEleves.length} élève(s) trouvé(s)
        </p>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                Profil
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                Matricule
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                Nom
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                Prénom
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                CNE
              </th>
              <th className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredEleves.map((eleve) => (
              <tr key={eleve.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <StudentPhoto
                    src={eleve.photo}
                    alt={`${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`}
                    size="sm"
                    firstName={(eleve.prenom_fr || eleve.prenom) || ''}
                    lastName={(eleve.nom_fr || eleve.nom) || ''}
                    cne={eleve.cne}
                    showDebugInfo={process.env.NODE_ENV === 'development'}
                  />
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-900">
                  <span className="inline-flex items-center gap-1">
                    {eleve.matricule || '—'}
                    {!eleve.matricule && <Icon name="plus" size="sm" className="text-gray-400" />}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-900">
                  {eleve.nom_fr || eleve.nom || 'N/A'}
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-900">
                  {eleve.prenom_fr || eleve.prenom || 'N/A'}
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-900">
                  {eleve.cne || 'N/A'}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Link 
                      to={`/eleves/${eleve.id}`}
                      className="p-2 text-blue-600 rounded-full hover:bg-slate-100"
                      title="Voir détails"
                    >
                      <Icon name="eye" size="sm" />
                    </Link>
                    <button
                      onClick={() => onEdit?.(eleve)}
                      className="p-2 text-green-600 rounded-full hover:bg-green-50"
                      title="Modifier"
                    >
                      <Icon name="edit" size="sm" />
                    </button>
                    <PermissionGate permission="delete">
                      <button
                        onClick={() => onDelete?.(eleve.id)}
                        className="p-2 text-red-600 rounded-full hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEleves.length === 0 && (
        <Card className="p-12 text-center">
          <Icon name="users" className="mx-auto mb-4 text-gray-400" size="lg" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Aucun élève trouvé
          </h3>
          <p className="mb-6 text-gray-600">
            {searchTerm || filterClasse || filterActive 
              ? 'Aucun élève ne correspond à vos critères de recherche.'
              : 'Commencez par ajouter votre premier élève.'
            }
          </p>
          <Link to="/eleves/new">
            <Button>
              <Icon name="plus" size="sm" className="mr-2" />
              Ajouter un élève
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default EleveList;
