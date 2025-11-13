<?php

namespace App\Http\Controllers;

use App\Models\Niveau;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class NiveauController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Niveau::query();

            // Filtre par statut actif si fourni
            if ($request->filled('active')) {
                $active = filter_var($request->input('active'), FILTER_VALIDATE_BOOL);
                $query->where('active', $active);
            }

            $niveaux = $query->orderBy('nom')->get();

            return response()->json([
                'success' => true,
                'data' => $niveaux
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des niveaux: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:150|unique:niveaux,nom',
                'description' => 'nullable|string|max:500',
                'bareme' => 'nullable|numeric|min:0.1|max:100',
                'active' => 'sometimes|boolean',
            ]);

            $niveau = Niveau::create([
                'nom' => $validated['nom'],
                'description' => $validated['description'] ?? null,
                'bareme' => $validated['bareme'] ?? 20.00,
                'active' => $validated['active'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Niveau créé avec succès',
                'data' => $niveau->fresh()
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du niveau: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Niveau $niveau): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $niveau
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du niveau: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Niveau $niveau): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nom' => 'sometimes|required|string|max:150|unique:niveaux,nom,' . $niveau->id,
                'description' => 'nullable|string|max:500',
                'bareme' => 'sometimes|numeric|min:0.1|max:100',
                'active' => 'sometimes|boolean',
            ]);

            $niveau->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Niveau mis à jour avec succès',
                'data' => $niveau->fresh()
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du niveau: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Niveau $niveau): JsonResponse
    {
        try {
            // Vérifier s'il y a des classes associées
            $classesCount = $niveau->classes()->count();
            
            if ($classesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer ce niveau car il est associé à {$classesCount} classe(s)"
                ], 400);
            }

            // Utiliser softDelete pour la suppression logique
            $niveau->softDelete();

            return response()->json([
                'success' => true,
                'message' => 'Niveau supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du niveau: ' . $e->getMessage()
            ], 500);
        }
    }
}

