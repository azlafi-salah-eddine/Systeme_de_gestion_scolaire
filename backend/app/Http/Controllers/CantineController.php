<?php

namespace App\Http\Controllers;

use App\Http\Requests\Cantine\StoreCantineRequest;
use App\Http\Resources\CantineResource;
use App\Http\Resources\EleveResource;
use App\Models\Cantine;
use App\Models\Eleve;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CantineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Cantine::query()->active();
        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['menus', 'eleves'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $query->with($with);
            }
        }
        $perPage = (int) $request->input('per_page', 15);
        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => CantineResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StoreCantineRequest $request): JsonResponse
    {
        $this->ensureAdmin();
        $data = $request->validated();
        $data['active'] = true;
        $cantine = Cantine::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Cantine créée',
            'data' => new CantineResource($cantine),
        ], 201);
    }

    public function show(Request $request, Cantine $cantine): JsonResponse
    {
        if ($request->filled('with')) {
            $withParam = (string) $request->input('with');
            $with = array_filter(array_map('trim', explode(',', $withParam)));
            $allowed = ['menus', 'eleves'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $cantine->load($with);
            }
        }
        return response()->json([
            'success' => true,
            'data' => new CantineResource($cantine),
        ]);
    }

    public function update(Request $request, Cantine $cantine): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:150|unique:cantines,nom,' . $cantine->id,
            'capacite' => 'sometimes|required|integer|min:0',
            'localisation' => 'sometimes|required|string|max:255',
        ]);
        $cantine->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Cantine mise à jour',
            'data' => new CantineResource($cantine->fresh()),
        ]);
    }

    public function destroy(Cantine $cantine): JsonResponse
    {
        $this->ensureAdmin();
        $cantine->softDelete();
        return response()->json([
            'success' => true,
            'message' => 'Cantine "' . $cantine->nom . '" a été supprimée avec succès',
        ]);
    }

    public function inscrireEleve(Request $request, Cantine $cantine): JsonResponse
    {
        $this->ensureRole(['admin', 'parent', 'eleve']);
        $validated = $request->validate([
            'eleve_id' => 'required|integer|exists:eleves,id',
        ]);

        $eleve = Eleve::findOrFail($validated['eleve_id']);

        if ($cantine->eleves()->where('eleve_id', $eleve->id)->exists()) {
            throw ValidationException::withMessages([
                'eleve_id' => ['Élève déjà inscrit à cette cantine.'],
            ]);
        }

        // Ensure pivot table exists (supports either name based on env)
        $pivotTable = \Schema::hasTable('eleve_cantine') ? 'eleve_cantine' : (\Schema::hasTable('cantine_eleve') ? 'cantine_eleve' : null);
        if ($pivotTable === null) {
            abort(500, 'Pivot table for cantine-eleve relation is missing. Please run migrations.');
        }

        $cantine->eleves()->attach($eleve->id, [
            'date_inscription' => now(),
        ]);

        // Mettre à jour la référence directe pour reporting rapide
        try {
            $eleve->update(['cantine_id' => $cantine->id]);
        } catch (\Throwable $ignored) {}

        return response()->json([
            'success' => true,
            'message' => 'Élève inscrit à la cantine',
        ], 201);
    }

    public function desinscrireEleve(Cantine $cantine, Eleve $eleve): JsonResponse
    {
        $this->ensureRole(['admin', 'parent', 'eleve']);
        $cantine->eleves()->detach($eleve->id);

        return response()->json([
            'success' => true,
            'message' => 'Élève désinscrit de la cantine',
        ]);
    }

    private function ensureAdmin(): void
    {
        if (!request()->user()?->isAdmin()) {
            abort(403);
        }
    }

    private function ensureRole(array $roles): void
    {
        if (app()->environment('local')) {
            return;
        }
        $user = request()->user();
        foreach ($roles as $role) {
            if ($user?->hasRole($role)) {
                return;
            }
        }
        abort(403);
    }
}
