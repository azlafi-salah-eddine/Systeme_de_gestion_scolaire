<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApiAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated via session
        if (!Auth::guard('web')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
                'error' => 'Unauthenticated'
            ], 401);
        }

        // Vérifier que l'utilisateur est toujours actif
        $user = Auth::guard('web')->user();
        if ($user && !$user->active) {
            // Détruire la session si l'utilisateur est inactif
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
                'error' => 'Account disabled'
            ], 403);
        }

        return $next($request);
    }
}
