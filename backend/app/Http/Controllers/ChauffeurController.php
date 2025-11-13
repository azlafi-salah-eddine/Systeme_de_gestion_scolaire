<?php

namespace App\Http\Controllers;

use App\Models\Chauffeur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChauffeurController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Chauffeur::query()->active()->paginate((int) $request->input('per_page', 15));
        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'telephone' => 'required|string|max:20|unique:chauffeurs,telephone',
            'permis' => 'required|string|max:50',
        ]);
        $item = Chauffeur::create(array_merge($validated, ['active' => true]));
        return response()->json(['success' => true, 'message' => 'Chauffeur créé', 'data' => $item], 201);
    }

    public function show(Chauffeur $chauffeur): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $chauffeur]);
    }

    public function update(Request $request, Chauffeur $chauffeur): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'telephone' => 'sometimes|required|string|max:20|unique:chauffeurs,telephone,' . $chauffeur->id,
            'permis' => 'sometimes|required|string|max:50',
        ]);
        $chauffeur->update($validated);
        return response()->json(['success' => true, 'message' => 'Chauffeur mis à jour', 'data' => $chauffeur->fresh()]);
    }

    public function destroy(Chauffeur $chauffeur): JsonResponse
    {
        $this->ensureAdmin();
        $chauffeur->softDelete();
        return response()->json(['success' => true, 'message' => 'Chauffeur masqué (soft delete)']);
    }

    private function ensureAdmin(): void
    {
        if (!request()->user()?->isAdmin()) {
            abort(403);
        }
    }
}
