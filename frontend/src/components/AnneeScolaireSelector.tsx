import React, { useState } from 'react';
import { useAnneeScolaire } from '../contexts/AnneeScolaireContext';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';
import Button from './ui/Button';

const AnneeScolaireSelector: React.FC = () => {
  const { anneeActive, anneesScolaires } = useAnneeScolaire();
  const { user } = useAuth();

  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';

  if (!anneeActive) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <Icon name="calendar" size="sm" />
        <span>Aucune année active</span>
        {isSuperAdmin && (
          <a
            href="/annees-scolaires"
            className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded"
          >
            Configurer
          </a>
        )}
      </div>
    );
  }

  // Déterminer quelle année est actuelle (basée sur la date système)
  // Utiliser la même logique que Backend: Carbon::today() = date seulement (sans heure)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à 00:00:00 pour comparer seulement la date
  
  const anneeActuelle = anneesScolaires.find(annee => {
    if (!annee.date_debut || !annee.date_fin) return false;
    const dateDebut = new Date(annee.date_debut);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(annee.date_fin);
    dateFin.setHours(0, 0, 0, 0);
    return today >= dateDebut && today <= dateFin;
  });

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">|</span>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {anneeActive?.nom || (anneeActuelle?.nom || 'Aucune année actuelle')}
        {anneeActuelle && anneeActuelle.id === anneeActive?.id && (
          <span className="ml-1 text-xs text-blue-500" title="Année actuelle (basée sur la date système)">
            (actuelle)
          </span>
        )}
      </span>
      
      {isSuperAdmin && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          (Super Admin)
        </span>
      )}
    </div>
  );
};

export default AnneeScolaireSelector;
