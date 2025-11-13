<?php

namespace App\Http\Controllers;

use App\Models\Salle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Salle::query();
        
        // Par défaut, afficher seulement les salles actives
        if (!$request->filled('active') || $request->boolean('active')) {
            $query->active();
        } elseif ($request->boolean('active') === false) {
            $query->inactive();
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }
        
        $salles = $query->orderBy('nom')->get();
        return response()->json(['success' => true, 'data' => $salles]);
    }

    /**
     * Liste publique des salles pour les emplois du temps
     */
    public function listForTimetable(): JsonResponse
    {
        $salles = Salle::where('active', true)
            ->select('id', 'nom', 'capacite', 'type', 'localisation')
            ->orderBy('nom')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $salles,
            'message' => 'Liste des salles récupérée avec succès'
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'capacite' => 'required|integer|min:1|max:200',
            'type' => 'required|string|in:classe,laboratoire,bibliotheque,salle_informatique,salle_art,gymnase,cantine,bureau',
            'localisation' => 'nullable|string|max:255',
            'equipements' => 'nullable|string',
            'active' => 'boolean',
        ]);
        $salle = Salle::create($validated);
        return response()->json(['success' => true, 'data' => $salle], 201);
    }

    public function show(Salle $salle): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $salle]);
    }

    public function update(Request $request, Salle $salle): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'capacite' => 'sometimes|required|integer|min:1|max:200',
            'type' => 'sometimes|required|string|in:classe,laboratoire,bibliotheque,salle_informatique,salle_art,gymnase,cantine,bureau',
            'localisation' => 'nullable|string|max:255',
            'equipements' => 'nullable|string',
            'active' => 'boolean',
        ]);
        $salle->update($validated);
        return response()->json(['success' => true, 'data' => $salle]);
    }

    public function destroy(Salle $salle): JsonResponse
    {
        $this->ensureAdmin();
        $salle->softDelete();
        return response()->json(['success' => true, 'message' => 'Salle supprimée']);
    }

    public function restore(Salle $salle): JsonResponse
    {
        $this->ensureAdmin();
        $salle->restore();
        return response()->json(['success' => true, 'message' => 'Salle restaurée']);
    }

    private function ensureAdmin(): void
    {
        if (!request()->user()?->isAdmin()) {
            abort(403, 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action.');
        }
    }
}