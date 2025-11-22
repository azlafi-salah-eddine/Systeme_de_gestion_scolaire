import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface AnneeScolaireFormProps {
  anneeScolaire?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const schema = yup.object({
  nom: yup
    .string()
    .required('Le nom est obligatoire')
    .matches(/\d{4}-\d{4}/, 'Format attendu: AAAA-AAAA'),
  date_debut: yup
    .string()
    .required('La date de début est obligatoire'),
  date_fin: yup
    .string()
    .required('La date de fin est obligatoire')
    .test('greater-than-start', 'La date de fin doit être après la date de début', function(value) {
      const { date_debut } = this.parent;
      return new Date(value) > new Date(date_debut);
    }),
  description: yup.string().optional()
});

type FormData = yup.InferType<typeof schema>;

const AnneeScolaireForm: React.FC<AnneeScolaireFormProps> = ({
  anneeScolaire,
  onClose,
  onSuccess,
}) => {
  const { createAnneeScolaire, updateAnneeScolaire } = useAnneeScolaire();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!anneeScolaire;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData | Partial<FormData>>({
    // Cast resolver to any to accommodate optional default values typing
    resolver: yupResolver(schema) as any,
    defaultValues: {
      nom: anneeScolaire?.nom || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      date_debut: anneeScolaire?.date_debut || new Date().toISOString().slice(0,10),
      date_fin: anneeScolaire?.date_fin || new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10),
      description: anneeScolaire?.description || ''
    },
  });

  const watchedNom = watch('nom');

  useEffect(() => {
    if (isEditing && anneeScolaire) {
      reset({
        nom: anneeScolaire.nom,
        date_debut: anneeScolaire.date_debut,
        date_fin: anneeScolaire.date_fin,
        description: anneeScolaire.description || ''
      });
    }
  }, [anneeScolaire, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      let success = false;
      if (isEditing) {
        success = await updateAnneeScolaire(anneeScolaire.id, data as any);
      } else {
        success = await createAnneeScolaire(data as any);
      }

      if (success) {
        onSuccess();
      } else {
        setError('Une erreur est survenue lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Modifier l\'Année Scolaire' : 'Nouvelle Année Scolaire'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="x" size="sm" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex">
                <Icon name="alert-circle" className="h-5 w-5 text-red-400 dark:text-red-500" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom (format AAAA-AAAA)
              </label>
              <Input
                type="text"
                {...register('nom')}
                error={errors.nom?.message}
                placeholder="2024-2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début
              </label>
              <Input
                type="date"
                {...register('date_debut')}
                error={errors.date_debut?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin
              </label>
              <Input
                type="date"
                {...register('date_fin')}
                error={errors.date_fin?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optionnel)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Icon name={isEditing ? 'save' : 'plus'} size="sm" />
                )}
                <span>{isEditing ? 'Modifier' : 'Créer'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnneeScolaireForm;
