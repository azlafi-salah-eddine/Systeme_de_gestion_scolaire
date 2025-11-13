<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AnneeScolaire;

class AnneeScolaireFilter
{
    /**
     * Handle an incoming request.
     * Filtre automatiquement les données par l'année scolaire active
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Récupérer l'année scolaire active
        $anneeActive = AnneeScolaire::getActive();
        
        if ($anneeActive) {
            // Ajouter l'année scolaire active aux paramètres de la requête
            $request->merge(['annee_scolaire_id' => $anneeActive->id]);
            $request->merge(['annee_active' => $anneeActive]);
        }
        
        return $next($request);
    }
}
