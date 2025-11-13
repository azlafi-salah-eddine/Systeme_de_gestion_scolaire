<?php

namespace App\Http\Controllers;

use App\Models\Accompagnateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccompagnateurController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Accompagnateur::query()->active()->paginate((int) $request->input('per_page', 15));
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
            'telephone' => 'required|string|max:20|unique:accompagnateurs,telephone',
        ]);
        $item = Accompagnateur::create(array_merge($validated, ['active' => true]));
        return response()->json(['success' => true, 'message' => 'Accompagnateur créé', 'data' => $item], 201);
    }

    public function show(Accompagnateur $accompagnateur): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $accompagnateur]);
    }

    public function update(Request $request, Accompagnateur $accompagnateur): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'telephone' => 'sometimes|required|string|max:20|unique:accompagnateurs,telephone,' . $accompagnateur->id,
        ]);
        $accompagnateur->update($validated);
        return response()->json(['success' => true, 'message' => 'Accompagnateur mis à jour', 'data' => $accompagnateur->fresh()]);
    }

    public function destroy(Accompagnateur $accompagnateur): JsonResponse
    {
        $this->ensureAdmin();
        $accompagnateur->softDelete();
        return response()->json(['success' => true, 'message' => 'Accompagnateur masqué (soft delete)']);
    }

    private function ensureAdmin(): void
    {
        if (!request()->user()?->isAdmin()) {
            abort(403);
        }
    }
}
