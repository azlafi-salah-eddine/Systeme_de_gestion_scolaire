<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class FileNamingService
{
    /**
     * Generate clean filename for student photo (DEPRECATED - use StudentPhotoService instead)
     * Format: nom.prenom.cne.extension
     */
    public static function generateStudentPhotoFilename($nom, $prenom, $cne, $extension)
    {
        // Nettoyer les noms (enlever les accents, espaces, caractères spéciaux)
        $nom = self::cleanString($nom);
        $prenom = self::cleanString($prenom);
        $cne = self::cleanString($cne);
        
        // Construire le nom du fichier
        $filename = strtolower($nom . '.' . $prenom);
        
        // Ajouter CNE si disponible (en minuscules)
        if (!empty($cne)) {
            $filename .= '.' . strtolower($cne);
        }
        
        // Ajouter extension
        $filename .= '.' . $extension;
        
        return 'eleves/' . $filename;
    }

    /**
     * Generate student folder path using new organized structure
     * Format: eleves/Prenom_Nom_CNE/
     */
    public static function generateStudentFolderPath($nom, $prenom, $cne = null)
    {
        // Utiliser le nouveau service pour la consistance
        return \App\Services\StudentPhotoService::generateFolderName($nom, $prenom, $cne);
    }
    
    /**
     * Generate clean filename for professor photo
     * Format: nom.prenom.matricule.extension
     */
    public static function generateProfessorPhotoFilename($nom, $prenom, $matricule, $extension)
    {
        // Nettoyer les noms
        $nom = self::cleanString($nom);
        $prenom = self::cleanString($prenom);
        $matricule = self::cleanString($matricule);
        
        // Construire le nom du fichier
        $filename = strtolower($nom . '.' . $prenom);
        
        // Ajouter matricule si disponible (en minuscules)
        if (!empty($matricule)) {
            $filename .= '.' . strtolower($matricule);
        }
        
        // Ajouter extension
        $filename .= '.' . $extension;
        
        return 'professeurs/' . $filename;
    }
    
    /**
     * Generate clean filename for parent photo
     * Format: nom.prenom.cin.extension
     */
    public static function generateParentPhotoFilename($nom, $prenom, $cin, $extension)
    {
        // Nettoyer les noms
        $nom = self::cleanString($nom);
        $prenom = self::cleanString($prenom);
        $cin = self::cleanString($cin);
        
        // Construire le nom du fichier
        $filename = strtolower($nom . '.' . $prenom);
        
        // Ajouter CIN si disponible (en minuscules)
        if (!empty($cin)) {
            $filename .= '.' . strtolower($cin);
        }
        
        // Ajouter extension
        $filename .= '.' . $extension;
        
        return 'parents/' . $filename;
    }
    
    /**
     * Clean string for filename use
     * Removes accents, special characters, spaces
     */
    private static function cleanString($string)
    {
        if (empty($string)) {
            return '';
        }
        
        // Convertir en ASCII (enlever les accents)
        $string = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $string);
        
        // Enlever tout sauf lettres, chiffres et tirets
        $string = preg_replace('/[^a-zA-Z0-9\-]/', '', $string);
        
        // Enlever les tirets multiples
        $string = preg_replace('/\-+/', '-', $string);
        
        // Enlever les tirets au début et à la fin
        $string = trim($string, '-');
        
        return $string;
    }
    
    /**
     * Check if filename already exists and generate unique name if needed
     */
    public static function generateUniqueFilename($baseFilename, $disk = 'public')
    {
        $originalFilename = $baseFilename;
        $counter = 1;
        
        while (Storage::disk($disk)->exists($baseFilename)) {
            $pathInfo = pathinfo($originalFilename);
            $baseFilename = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_' . $counter . '.' . $pathInfo['extension'];
            $counter++;
            
            // Éviter les boucles infinies
            if ($counter > 999) {
                $baseFilename = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_' . time() . '.' . $pathInfo['extension'];
                break;
            }
        }
        
        return $baseFilename;
    }
    
    /**
     * Delete old photo if exists
     */
    public static function deleteOldPhoto($photoPath, $disk = 'public')
    {
        if (!empty($photoPath) && Storage::disk($disk)->exists($photoPath)) {
            Storage::disk($disk)->delete($photoPath);
        }
    }
}
