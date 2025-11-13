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
  annee_debut: yup
    .number()
    .required('L\'année de début est obligatoire')
    .min(2000, 'L\'année de début doit être supérieure à 2000')
    .max(2100, 'L\'année de début doit être inférieure à 2100')
    .integer('L\'année de début doit être un nombre entier'),
  annee_fin: yup
    .number()
    .required('L\'année de fin est obligatoire')
    .min(2000, 'L\'année de fin doit être supérieure à 2000')
    .max(2100, 'L\'année de fin doit être inférieure à 2100')
    .integer('L\'année de fin doit être un nombre entier')
    .test('greater-than-start', 'L\'année de fin doit être supérieure à l\'année de début', function(value) {
      const { annee_debut } = this.parent;
      return value > annee_debut;
    }),
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
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      annee_debut: anneeScolaire?.annee_debut || new Date().getFullYear(),
      annee_fin: anneeScolaire?.annee_fin || new Date().getFullYear() + 1,
    },
  });

  const watchedAnneeDebut = watch('annee_debut');

  useEffect(() => {
    if (isEditing && anneeScolaire) {
      reset({
        annee_debut: anneeScolaire.annee_debut,
        annee_fin: anneeScolaire.annee_fin,
      });
    }
  }, [anneeScolaire, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      let success = false;
      if (isEditing) {
        success = await updateAnneeScolaire(anneeScolaire.id, data);
      } else {
        success = await createAnneeScolaire(data);
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
                Année de Début
              </label>
              <Input
                type="number"
                {...register('annee_debut')}
                error={errors.annee_debut?.message}
                placeholder="Ex: 2024"
                min="2000"
                max="2100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Année de Fin
              </label>
              <Input
                type="number"
                {...register('annee_fin')}
                error={errors.annee_fin?.message}
                placeholder="Ex: 2025"
                min={watchedAnneeDebut ? watchedAnneeDebut + 1 : 2001}
                max="2100"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex">
                <Icon name="info" className="h-5 w-5 text-blue-400 dark:text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    L'année scolaire sera affichée comme : <strong>{watchedAnneeDebut || 'XXXX'}/{watch('annee_fin') || 'YYYY'}</strong>
                  </p>
                </div>
              </div>
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
