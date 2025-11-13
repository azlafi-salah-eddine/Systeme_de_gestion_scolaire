<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CleanJsonResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Nettoyer la réponse JSON si c'est une réponse JSON
        if ($response->headers->get('Content-Type') === 'application/json') {
            $content = $response->getContent();
            
            // Supprimer le BOM UTF-8 et autres caractères invisibles au début
            $content = preg_replace('/^[\xEF\xBB\xBF\x00-\x1F\x7F]+/', '', $content);
            
            // Supprimer les espaces et caractères invisibles au début et à la fin
            $content = trim($content);
            
            // Vérifier que le contenu commence bien par { ou [
            if (!preg_match('/^[\{\[]/', $content)) {
                // Si ce n'est pas du JSON valide, essayer de nettoyer plus agressivement
                $content = preg_replace('/^[^{[]*/', '', $content);
            }
            
            $response->setContent($content);
        }

        return $response;
    }
}
