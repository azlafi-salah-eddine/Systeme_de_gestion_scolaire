<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilterInactiveRecords
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Si l'utilisateur n'est pas connecté, on ne fait rien
        if (!$user) {
            return $next($request);
        }

        // Si l'utilisateur est super admin, il peut voir tous les enregistrements
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Pour les autres utilisateurs, on filtre automatiquement les enregistrements inactifs
        // Cette logique sera appliquée dans les contrôleurs via les scopes du trait SoftDeleteActive
        
        return $next($request);
    }
}