import React, { useState } from 'react';
import Icon from '../Icon';

interface StudentPhotoProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: string;
  showDebugInfo?: boolean;
  studentName?: string; // legacy support
  firstName?: string;
  lastName?: string;
  cne?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

const iconSizes = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'xl',
  xl: '2xl'
} as const;

const StudentPhoto: React.FC<StudentPhotoProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon = 'user',
  showDebugInfo = false,
  studentName,
  firstName,
  lastName,
  cne
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fallbackIndexTried, setFallbackIndexTried] = useState(0);

  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  // Generate fallback URLs based on backend scheme: storage/eleves/Prenom_Nom_CNE/profile.(jpg|jpeg|png)
  const generateFallbackUrls = (): string[] => {
    if ((!firstName && !lastName && !studentName) || !cne) return [];

    const clean = (str: string) => str.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    let prenom = firstName;
    let nom = lastName;

    if ((!prenom || !nom) && studentName) {
      const parts = studentName.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        // Assume legacy studentName was "Nom Prénom"; try both orders to be safe
        const legacyNom = parts[0];
        const legacyPrenom = parts[1];
        prenom = prenom || legacyPrenom;
        nom = nom || legacyNom;
      }
    }

    if (!prenom || !nom) return [];

    const folder = `${clean(prenom)}_${clean(nom)}_${clean(cne as string)}`;
    const base = `http://localhost:8000/storage/eleves/${folder}/profile`;
    return [`${base}.jpg`, `${base}.jpeg`, `${base}.png`];
  };

  const fallbackUrls = generateFallbackUrls();
  const shouldShowImage = src && src.trim() !== '' && !imageError;
  const shouldTryFallback = !shouldShowImage && src && src.trim() !== '' && fallbackUrls.length > 0 && fallbackIndexTried < fallbackUrls.length;

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative`}>
      {shouldShowImage && (
        <img
          src={src}
          alt={alt || 'Photo étudiant'}
          className="w-full h-full object-cover"
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
      
      {shouldTryFallback && (
        <img
          src={fallbackUrls[fallbackIndexTried]}
          alt={alt || 'Photo étudiant'}
          className="w-full h-full object-cover"
          onError={() => {
            // try next fallback extension
            setFallbackIndexTried((idx) => idx + 1);
            if (fallbackIndexTried + 1 >= fallbackUrls.length) {
              handleError();
            }
          }}
          onLoad={handleLoad}
        />
      )}
      
      {!shouldShowImage && !shouldTryFallback && (
        <Icon 
          name={fallbackIcon} 
          size={iconSizes[size]} 
          className="text-gray-400 dark:text-gray-500"
        />
      )}
      
      {/* Debug info overlay removed as requested */}
      
      {/* Loading indicator */}
      {src && !imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse rounded-full" />
      )}
    </div>
  );
};

export default StudentPhoto;
