<?php



namespace App\Http\Controllers;



use App\Models\AnneeScolaire;
use App\Models\User;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;

use Illuminate\Validation\ValidationException;

use Illuminate\Support\Facades\Log;



class AnneeScolaireController extends Controller

{

    /**

     * Afficher la liste des années scolaires (uniquement actives / non supprimées)

     */

    public function index(): JsonResponse

    {

        $anneesScolaires = AnneeScolaire::active()->orderBy('date_debut', 'desc')->get();

        

        return response()->json([

            'success' => true,

            'data' => $anneesScolaires

        ]);

    }



    /**

     * Afficher l'année scolaire active (statut fonctionnel)

     */

    public function active(): JsonResponse

    {

        $anneeActive = AnneeScolaire::getActive();

        

        if (!$anneeActive) {

            return response()->json([

                'success' => false,

                'message' => 'Aucune année scolaire active trouvée'

            ], 404);

        }



        return response()->json([

            'success' => true,

            'data' => $anneeActive

        ]);

    }

    /**

     * Afficher les années scolaires avec statut = 1 (accessible à tous les utilisateurs authentifiés)

     */

    public function withStatut(Request $request): JsonResponse

    {
        try {
            $user = $request->user();

            // Si pas d'utilisateur ou erreur, retourner seulement l'année active
            if (!$user) {
                $anneeActive = AnneeScolaire::getActive();
                $data = $anneeActive ? [$anneeActive] : [];
                return response()->json([
                    'success' => true,
                    'data' => $data
                ]);
            }

            // Vérifier si l'utilisateur est super admin de manière sécurisée
            $isSuperAdmin = false;
            try {
                $isSuperAdmin = $user->isSuperAdmin();
            } catch (\Exception $e) {
                // En cas d'erreur, considérer que ce n'est pas un super admin
                Log::warning('Erreur lors de la vérification du rôle super admin: ' . $e->getMessage());
            }

            if ($isSuperAdmin) {
                // Super Admin voit toutes les années (active=true, non supprimées)
                $anneesScolaires = AnneeScolaire::where('active', true)
                    ->orderBy('date_debut', 'desc')
            ->get();
            } else {
                // Pour Admin et Prof: UNIQUEMENT l'année actuelle
                $anneeActuelle = AnneeScolaire::getActive();
                $anneesScolaires = $anneeActuelle ? collect([$anneeActuelle]) : collect();
            }

            // Convertir la Collection en tableau pour éviter les problèmes de sérialisation
            $anneesArray = $anneesScolaires->values()->all();

            return response()->json([
                'success' => true,
                'data' => $anneesArray
            ]);
        } catch (\Exception $e) {
            // En cas d'erreur, retourner au moins l'année active
            Log::error('Erreur dans withStatut: ' . $e->getMessage());
            $anneeActive = AnneeScolaire::getActive();
            $data = $anneeActive ? [$anneeActive] : [];

        return response()->json([
            'success' => true,
                'data' => $data
        ]);
        }
    }



    /**

     * Créer une nouvelle année scolaire (Admin seulement)

     */

    public function store(Request $request): JsonResponse

    {

        try {

            // Pré-check: si une année identique existe déjà masquée, informer de la restauration
            if ($request->filled('nom')) {
                $exist = AnneeScolaire::where('nom', $request->nom)->first();
                if ($exist && !$exist->active) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cette année scolaire existe déjà mais est masquée (Enregistrements Supprimés). Veuillez la restaurer.',
                        'data' => [ 'id' => $exist->id ]
                    ], 422);
                }
            }

            $validated = $request->validate(

                AnneeScolaire::validationRules(),

                AnneeScolaire::validationMessages()

            );



            // Ajouter les champs supplémentaires
            if (!isset($validated['description'])) {
            $validated['description'] = 'Année scolaire ' . $validated['nom'];
            }

            // Visible par défaut (soft-delete flag)
            $validated['active'] = true;



            $anneeScolaire = AnneeScolaire::create($validated);



            return response()->json([

                'success' => true,

                'message' => 'Année scolaire créée avec succès',

                'data' => $anneeScolaire

            ], 201);



        } catch (ValidationException $e) {

            return response()->json([

                'success' => false,

                'message' => 'Erreur de validation',

                'errors' => $e->errors()

            ], 422);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'message' => 'Erreur lors de la création de l\'année scolaire',

                'error' => $e->getMessage()

            ], 500);

        }

    }



    /**

     * Afficher une année scolaire spécifique

     */

    public function show(AnneeScolaire $anneeScolaire): JsonResponse

    {

        return response()->json([

            'success' => true,

            'data' => $anneeScolaire

        ]);

    }



    /**

     * Mettre à jour une année scolaire

     */

    public function update(Request $request, AnneeScolaire $anneeScolaire): JsonResponse

    {

        try {

            $validated = $request->validate(

                AnneeScolaire::validationRules($anneeScolaire->id),

                AnneeScolaire::validationMessages()

            );



            // Ajouter les champs supplémentaires
            if (!isset($validated['description'])) {
                $validated['description'] = 'Année scolaire ' . ($validated['nom'] ?? $anneeScolaire->nom);
            }

            $anneeScolaire->update($validated);



            return response()->json([

                'success' => true,

                'message' => 'Année scolaire mise à jour avec succès',

                'data' => $anneeScolaire->fresh()

            ]);



        } catch (ValidationException $e) {

            return response()->json([

                'success' => false,

                'message' => 'Erreur de validation',

                'errors' => $e->errors()

            ], 422);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'message' => 'Erreur lors de la mise à jour de l\'année scolaire',

                'error' => $e->getMessage()

            ], 500);

        }

    }



    /**

     * Supprimer (soft delete) une année scolaire

     */

    public function destroy(AnneeScolaire $anneeScolaire): JsonResponse

    {

        try {

            // Vérifier si c'est l'année scolaire actuelle (basée sur la date système)
            $anneeActuelle = AnneeScolaire::getCurrent();
            if ($anneeActuelle && $anneeActuelle->id === $anneeScolaire->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer l\'année scolaire actuelle. L\'année actuelle est déterminée par la date système (date du jour entre date_debut et date_fin).'
                ], 422);
            }

            // Soft delete: on masque simplement (active=false)
            $anneeScolaire->softDelete();

            return response()->json([
                'success' => true,
                'message' => 'Année scolaire "' . $anneeScolaire->nom . '" a été supprimée avec succès'
            ]);

        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'message' => 'Erreur lors de la suppression de l\'année scolaire',

                'error' => $e->getMessage()

            ], 500);

        }

    }



    /**

     * Activer une année scolaire (méthode désactivée)
     * L'année actuelle est déterminée automatiquement par la date système
     * active = true/false est utilisé SEULEMENT pour soft delete (visible/hidden)
     */

    public function activer(AnneeScolaire $anneeScolaire): JsonResponse

    {

        // L'année actuelle est déterminée automatiquement par getCurrent() basée sur la date système
        // active = true/false est utilisé SEULEMENT pour soft delete
        // Pour changer l'année actuelle, il faut modifier les dates (date_debut, date_fin)

            return response()->json([
                'success' => false,
            'message' => 'L\'année scolaire actuelle est déterminée automatiquement par la date système. La date du jour doit être entre date_debut et date_fin pour que l\'année soit considérée comme actuelle. Modifiez les dates (date_debut, date_fin) pour définir la période de l\'année scolaire.',
        ], 400);

    }



    /**

     * Obtenir les statistiques d'une année scolaire

     */

    public function statistics(AnneeScolaire $anneeScolaire): JsonResponse

    {

        try {

            $statistics = [

                'id' => $anneeScolaire->id,

                'nom' => $anneeScolaire->nom,

                'active' => $anneeScolaire->active,

                'classes_count' => $anneeScolaire->classes()->count(),

                'eleves_count' => $anneeScolaire->eleves()->count(),

                'paiements_count' => 0,

                'notes_count' => 0,

                'created_at' => $anneeScolaire->created_at,

                'updated_at' => $anneeScolaire->updated_at,

            ];



            return response()->json([

                'success' => true,

                'data' => $statistics

            ]);



        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'message' => 'Erreur lors de la récupération des statistiques',

                'error' => $e->getMessage()

            ], 500);

        }

    }

}
