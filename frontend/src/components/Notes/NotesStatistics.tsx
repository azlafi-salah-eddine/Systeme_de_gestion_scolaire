import React, { useState, useEffect } from 'react';
import type { NoteStatistics, NoteFilters } from '../../services/notesService';
import notesService from '../../services/notesService';
import { BarChart3, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

interface NotesStatisticsProps {
  filters?: NoteFilters;
}

const NotesStatistics: React.FC<NotesStatisticsProps> = ({ filters = {} }) => {
  const [statistics, setStatistics] = useState<NoteStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notesService.getStatistics(filters);
      
      if (response.success) {
        setStatistics(response.data);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'passable':
        return 'text-yellow-600 bg-yellow-50';
      case 'insuffisant':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return <Award className="w-5 h-5" />;
      case 'good':
        return <TrendingUp className="w-5 h-5" />;
      case 'passable':
        return <BarChart3 className="w-5 h-5" />;
      case 'insuffisant':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const gradeStats = [
    {
      label: 'Excellent (≥16)',
      value: statistics.excellentes,
      percentage: getPercentage(statistics.excellentes, statistics.total),
      grade: 'excellent'
    },
    {
      label: 'Bien (12-15.99)',
      value: statistics.bonnes,
      percentage: getPercentage(statistics.bonnes, statistics.total),
      grade: 'good'
    },
    {
      label: 'Passable (10-11.99)',
      value: statistics.passables,
      percentage: getPercentage(statistics.passables, statistics.total),
      grade: 'passable'
    },
    {
      label: 'Insuffisant (&lt;10)',
      value: statistics.insuffisantes,
      percentage: getPercentage(statistics.insuffisantes, statistics.total),
      grade: 'insuffisant'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Statistiques des Notes</h3>
        <button
          onClick={loadStatistics}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Actualiser
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total des notes</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Moyenne générale</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.moyenne ? statistics.moyenne.toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Meilleure note</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.meilleure_note || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Note la plus basse</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.pire_note || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Répartition par niveau</h4>
        <div className="space-y-4">
          {gradeStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getGradeColor(stat.grade)}`}>
                  {getGradeIcon(stat.grade)}
                </div>
                <span className="text-sm font-medium text-gray-700">{stat.label}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.percentage}%</div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stat.grade === 'excellent' ? 'bg-green-500' :
                      stat.grade === 'good' ? 'bg-blue-500' :
                      stat.grade === 'passable' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Performance positive</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Notes ≥ 12</span>
              <span className="text-lg font-semibold text-green-600">
                {statistics.excellentes + statistics.bonnes}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pourcentage</span>
              <span className="text-lg font-semibold text-green-600">
                {getPercentage(statistics.excellentes + statistics.bonnes, statistics.total)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Notes à améliorer</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Notes &lt; 10</span>
              <span className="text-lg font-semibold text-red-600">
                {statistics.insuffisantes}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pourcentage</span>
              <span className="text-lg font-semibold text-red-600">
                {getPercentage(statistics.insuffisantes, statistics.total)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Average Score Visualization */}
      {statistics.moyenne && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Moyenne générale</h4>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    statistics.moyenne >= 16 ? 'bg-green-500' :
                    statistics.moyenne >= 12 ? 'bg-blue-500' :
                    statistics.moyenne >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(statistics.moyenne / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {statistics.moyenne.toFixed(2)}/20
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {statistics.moyenne >= 16 ? 'Excellent niveau' :
             statistics.moyenne >= 12 ? 'Bon niveau' :
             statistics.moyenne >= 10 ? 'Niveau passable' : 'Niveau à améliorer'}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesStatistics;
