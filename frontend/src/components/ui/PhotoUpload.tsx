import React, { useCallback, useRef, useState } from 'react';

interface PhotoUploadProps {
  label?: string;
  value?: string | null;
  onChange: (base64: string | null) => void;
  maxBytes?: number;
  allowedFormats?: string[];
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  label = 'Photo', 
  value, 
  onChange, 
  maxBytes = 1024 * 1024,
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/png']
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxBytes) {
      return `Fichier trop volumineux. Taille maximale ${Math.round(maxBytes / (1024 * 1024))} Mo.`;
    }

    // Check file format
    if (!allowedFormats.includes(file.type.toLowerCase())) {
      const formatNames = allowedFormats.map(format => {
        switch(format) {
          case 'image/jpeg':
          case 'image/jpg':
            return 'JPEG';
          case 'image/png':
            return 'PNG';
          case 'image/gif':
            return 'GIF';
          default:
            return format.replace('image/', '').toUpperCase();
        }
      });
      return `Format non autorisé. Formats acceptés: ${formatNames.join(', ')}.`;
    }

    return null;
  };

  const readFile = (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = (reader.result as string) || null;
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }, []);

  const formatNames = allowedFormats.map(format => {
    switch(format) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'JPEG';
      case 'image/png':
        return 'PNG';
      case 'image/gif':
        return 'GIF';
      default:
        return format.replace('image/', '').toUpperCase();
    }
  });

  const helperText = `Formats: ${formatNames.join(', ')}. Taille max ${Math.round(maxBytes / (1024 * 1024))}MB.`;

  const acceptTypes = allowedFormats.join(',');

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative flex items-center gap-4 p-4 border-2 border-dashed rounded-xl transition ${dragOver ? 'border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
      >
        <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">Glissez-déposez une image ici, ou</p>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Choisir un fichier
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={acceptTypes}
              onChange={onFileSelect}
              className="hidden"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); setError(null); }}
            className="absolute top-2 right-2 inline-flex items-center px-2 py-1 text-xs rounded bg-gray-800 dark:bg-gray-700 text-white/90 dark:text-white hover:text-white dark:hover:bg-gray-600"
            aria-label="Supprimer la photo"
          >
            Retirer
          </button>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;


