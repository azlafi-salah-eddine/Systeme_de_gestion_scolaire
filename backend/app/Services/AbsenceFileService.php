<?php

namespace App\Services;

use App\Models\Eleve;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AbsenceFileService
{
    private const ABSENCES_BASE_PATH = 'absences';

    /**
     * Generate folder name for student's absence files
     */
    public static function generateFolderName(string $nom, string $prenom, ?string $cne = null): string
    {
        // Nettoyer et formater les noms (même logique que StudentPhotoService)
        $nomClean = self::cleanString($nom);
        $prenomClean = self::cleanString($prenom);
        $cneClean = $cne ? self::cleanString($cne) : null;

        // Format: Prenom_Nom_CNE ou Prenom_Nom si pas de CNE
        $folderName = $prenomClean . '_' . $nomClean;
        if ($cneClean) {
            $folderName .= '_' . $cneClean;
        }

        return $folderName;
    }

    /**
     * Get the full path for student's absence files folder
     */
    public static function getStudentAbsenceFolderPath(Eleve $eleve): string
    {
        $folderName = self::generateFolderName(
            $eleve->nom_fr ?: $eleve->nom,
            $eleve->prenom_fr ?: $eleve->prenom,
            $eleve->cne
        );

        return self::ABSENCES_BASE_PATH . '/' . $folderName;
    }

    /**
     * Save absence file
     */
    public static function saveAbsenceFile(Eleve $eleve, $uploadedFile, string $filename = null): string
    {
        try {
            // Valider le fichier
            if (!$uploadedFile->isValid()) {
                throw new \Exception("Fichier invalide");
            }

            // Créer le dossier de l'élève
            $folderPath = self::getStudentAbsenceFolderPath($eleve);
            Storage::disk('public')->makeDirectory($folderPath);

            // Générer le nom de fichier si pas fourni
            if (!$filename) {
                $extension = strtolower($uploadedFile->getClientOriginalExtension());
                // Nom simple : date de justification + extension
                $baseFilename = now()->format('Y-m-d') . '.' . $extension;
                
                // Vérifier si le fichier existe déjà et ajouter un numéro si nécessaire
                $filename = self::getUniqueFilename($folderPath, $baseFilename);
            }

            $filePath = $folderPath . '/' . $filename;

            // Sauvegarder le fichier
            $uploadedFile->storeAs($folderPath, $filename, 'public');

            return $filePath;

        } catch (\Exception $e) {
            throw new \Exception("Erreur lors de la sauvegarde du fichier: " . $e->getMessage());
        }
    }

    /**
     * Delete absence file
     */
    public static function deleteAbsenceFile(string $filePath): bool
    {
        try {
            if (Storage::disk('public')->exists($filePath)) {
                return Storage::disk('public')->delete($filePath);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get absence file URL
     */
    public static function getAbsenceFileUrl(string $filePath): string
    {
        return Storage::disk('public')->url($filePath);
    }

    /**
     * Delete all absence files for a student
     */
    public static function deleteStudentAbsenceFiles(Eleve $eleve): bool
    {
        try {
            $folderPath = self::getStudentAbsenceFolderPath($eleve);
            return Storage::disk('public')->deleteDirectory($folderPath);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Rename student absence folder when student info changes
     */
    public static function renameStudentAbsenceFolder(Eleve $eleve, string $oldNom, string $oldPrenom, ?string $oldCne = null): bool
    {
        try {
            $oldFolderName = self::generateFolderName($oldNom, $oldPrenom, $oldCne);
            $newFolderName = self::generateFolderName(
                $eleve->nom_fr ?: $eleve->nom,
                $eleve->prenom_fr ?: $eleve->prenom,
                $eleve->cne
            );

            if ($oldFolderName === $newFolderName) {
                return true; // Pas de changement nécessaire
            }

            $oldPath = self::ABSENCES_BASE_PATH . '/' . $oldFolderName;
            $newPath = self::ABSENCES_BASE_PATH . '/' . $newFolderName;

            if (Storage::disk('public')->exists($oldPath)) {
                return Storage::disk('public')->move($oldPath, $newPath);
            }

            return true;

        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get unique filename if file already exists
     */
    private static function getUniqueFilename(string $folderPath, string $baseFilename): string
    {
        $filename = $baseFilename;
        $counter = 1;
        
        while (Storage::disk('public')->exists($folderPath . '/' . $filename)) {
            $pathInfo = pathinfo($baseFilename);
            $filename = $pathInfo['filename'] . '_' . $counter . '.' . $pathInfo['extension'];
            $counter++;
        }
        
        return $filename;
    }

    /**
     * Clean string for folder names (même logique que StudentPhotoService)
     */
    private static function cleanString(string $str): string
    {
        // Supprimer les accents
        $str = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
        
        // Garder seulement les lettres, chiffres et quelques caractères spéciaux
        $str = preg_replace('/[^a-zA-Z0-9\-_]/', '', $str);
        
        // Limiter la longueur
        return Str::limit($str, 20, '');
    }
}
