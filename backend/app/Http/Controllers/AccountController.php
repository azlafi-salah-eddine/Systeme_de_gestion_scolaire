<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    /**
     * Get current user account information
     */
    public function profile()
    {
        /** @var User $user */
        $user = Auth::user();
        $user->load('role');
        $nomComplet = ($user->nom && $user->prenom) ? trim($user->nom . ' ' . $user->prenom) : ($user->nom || $user->prenom || $user->nom_complet);
        
        // Si c'est un professeur, trouver l'ID du professeur associé
        $professeurId = null;
        if ($user->hasRole('professeur')) {
            $professeur = $user->getProfesseur();
            if ($professeur) {
                $professeurId = $professeur->id;
            }
        }

        // Si c'est un élève, trouver l'ID de l'élève associé et sa classe
        $eleveId = null;
        $classeId = null;
        if ($user->hasRole('eleve')) {
            $eleve = $user->getEleve();
            if ($eleve) {
                $eleveId = $eleve->id;
                $classeId = $eleve->classe_id;
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'name' => $nomComplet ?? $user->email,
                'nom_complet' => $nomComplet,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'role_id' => $user->role_id,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'nom' => $user->role->type, // Utiliser 'type' au lieu de 'nom'
                    'description' => null // Plus de champ description
                ] : null,
                'professeur_id' => $professeurId, // ID du professeur si c'est un professeur
                'eleve_id' => $eleveId, // ID de l'élève si c'est un élève
                'classe_id' => $classeId, // ID de la classe si c'est un élève
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at
            ]
        ]);
    }

    /**
     * Update user profile information
     */
    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'sometimes|nullable|string|max:20',
        ], [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // L'email ne peut pas être modifié - il est généré automatiquement
            $user->update([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'telephone' => $request->telephone ?? null,
            ]);

            $nomComplet = trim(($user->nom ?? '') . ' ' . ($user->prenom ?? ''));

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'name' => $nomComplet || $user->email,
                    'nom_complet' => $nomComplet,
                    'email' => $user->email,
                    'telephone' => $user->telephone,
                    'role_id' => $user->role_id,
                    'role' => $user->role ? [
                        'id' => $user->role->id,
                        'nom' => $user->role->type,
                        'description' => null
                    ] : null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil'
            ], 500);
        }
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect'
            ], 400);
        }

        try {
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du mot de passe'
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        $user = Auth::user();
        
        // Ici tu peux ajouter des statistiques spécifiques à l'utilisateur
        $stats = [
            'account_created' => $user->created_at->format('d/m/Y'),
            'last_login' => $user->updated_at->format('d/m/Y H:i'),
            'role' => $user->role ? $user->role->type : 'Sans rôle', // Utiliser 'type' au lieu de 'nom'
            'role_description' => null, // Plus de champ description
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
