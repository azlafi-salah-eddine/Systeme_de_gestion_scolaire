<?php

namespace App\Http\Controllers;

use App\Models\Periode;
use App\Models\AnneeScolaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PeriodeController extends Controller
{
    /**
     * Display a listing of periods
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Periode::with('anneeScolaire');
            
            // Filter by academic year if provided
            if ($request->has('annee_scolaire_id') && $request->annee_scolaire_id) {
                $query->where('annee_scolaire_id', $request->annee_scolaire_id);
            }
            
            // Filter by active status
            if ($request->has('active')) {
                $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOL));
            }
            
            $periodes = $query->orderBy('date_debut')->get();
            
            return response()->json([
                'success' => true,
                'data' => $periodes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des périodes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the current active period
     */
    public function active(): JsonResponse
    {
        try {
            $today = Carbon::today();
            
            $periodeActive = Periode::where('active', true)
                ->where('date_debut', '<=', $today)
                ->where('date_fin', '>=', $today)
                ->with('anneeScolaire')
                ->first();
            
            if (!$periodeActive) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune période active trouvée'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $periodeActive,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la période active: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created period
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:100',
                'description' => 'nullable|string',
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
                'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
                'active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $periode = Periode::create($request->all());
            $periode->load('anneeScolaire');

            return response()->json([
                'success' => true,
                'data' => $periode,
                'message' => 'Période créée avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la période: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified period
     */
    public function show(Periode $periode): JsonResponse
    {
        try {
            $periode->load('anneeScolaire');
            
            return response()->json([
                'success' => true,
                'data' => $periode,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la période: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified period
     */
    public function update(Request $request, Periode $periode): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'sometimes|required|string|max:100',
                'description' => 'nullable|string',
                'date_debut' => 'sometimes|required|date',
                'date_fin' => 'sometimes|required|date|after:date_debut',
                'annee_scolaire_id' => 'sometimes|required|exists:annees_scolaires,id',
                'active' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $periode->update($request->all());
            $periode->load('anneeScolaire');

            return response()->json([
                'success' => true,
                'data' => $periode,
                'message' => 'Période mise à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la période: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified period
     */
    public function destroy(Periode $periode): JsonResponse
    {
        try {
            // Check if period has notes
            if ($periode->notes()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cette période car elle contient des notes'
                ], 422);
            }

            $periode->update(['active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Période supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la période: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get periods for a specific academic year
     */
    public function getByAnneeScolaire($anneeScolaireId): JsonResponse
    {
        try {
            $periodes = Periode::where('annee_scolaire_id', $anneeScolaireId)
                ->where('active', true)
                ->orderBy('date_debut')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $periodes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des périodes: ' . $e->getMessage()
            ], 500);
        }
    }
}
