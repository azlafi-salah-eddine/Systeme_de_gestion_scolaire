<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authentifier un utilisateur avec session
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        /** @var User $user */
        $user = $request->user()->load('role');

        // Vérifier que l'utilisateur est actif (double vérification)
        if (!$user->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            throw ValidationException::withMessages([
                'email' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
            ]);
        }

        // Créer une session sécurisée
        $request->session()->regenerate();
        $request->session()->put('user_id', $user->id);
        $request->session()->put('authenticated', true);

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => new UserResource($user),
            'session_id' => $request->session()->getId()
        ]);
    }

    /**
     * Déconnecter l'utilisateur et détruire la session
     */
    public function logout(Request $request): JsonResponse
    {
        // Détruire la session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Rafraîchir la session d'authentification
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Vérifier que l'utilisateur est toujours actif
        if (!$user->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return response()->json([
                'message' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.'
            ], 403);
        }

        $user->load('role');
        return response()->json([
            'user' => new UserResource($user),
        ], 200);
    }

    /**
     * Retourner l'utilisateur connecté avec ses rôles
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }
        
        // Vérifier que l'utilisateur est toujours actif
        if (!$user->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return response()->json([
                'message' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.'
            ], 403);
        }
        
        $user->load('role');
        
        return response()->json([
            'user' => new UserResource($user)
        ]);
    }
}
