<?php

namespace App\Http\Controllers;

use App\Http\Requests\Paiement\StorePaiementRequest;
use App\Http\Resources\PaiementResource;
use App\Models\Eleve;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::query()->with('eleve');

        if ($request->filled('eleve_id')) {
            $query->where('eleve_id', (int) $request->input('eleve_id'));
        }
        if ($request->filled('type')) {
            $query->whereIn('type', array_map('trim', explode(',', (string) $request->input('type'))));
        }
        if ($request->filled('statut')) {
            $query->whereIn('statut', array_map('trim', explode(',', (string) $request->input('statut'))));
        }
        if ($request->filled('date_debut')) {
            $query->whereDate('date', '>=', $request->input('date_debut'));
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('date', '<=', $request->input('date_fin'));
        }

        // Access: parents/eleves only their own payments
        $user = $request->user();
        if ($user?->hasRole('eleve')) {
            $query->where('eleve_id', $user->eleve?->id ?? 0);
        } elseif ($user?->hasRole('parent')) {
            $eleveIds = $user->parentEleve?->eleves()->pluck('id') ?? collect([]);
            $query->whereIn('eleve_id', $eleveIds);
        }

        $perPage = (int) $request->input('per_page', 15);
        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PaiementResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StorePaiementRequest $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $paiement = Paiement::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Paiement créé',
            'data' => new PaiementResource($paiement->load('eleve')),
        ], 201);
    }

    public function show(Paiement $paiement): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new PaiementResource($paiement->load('eleve')),
        ]);
    }

    public function update(Request $request, Paiement $paiement): JsonResponse
    {
        $this->ensureAdmin($request);
        $validated = $request->validate([
            'eleve_id' => 'sometimes|required|integer|exists:eleves,id',
            'type' => 'sometimes|required|string|in:inscription,scolarite,transport,cantine',
            'montant' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
            'statut' => 'sometimes|required|string|in:en_attente,regle,annule',
        ]);
        $paiement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Paiement mis à jour',
            'data' => new PaiementResource($paiement->fresh()->load('eleve')),
        ]);
    }

    public function destroy(Request $request, Paiement $paiement): JsonResponse
    {
        $this->ensureAdmin($request);
        $paiement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paiement supprimé',
        ]);
    }

    public function elevePayments(Eleve $eleve): JsonResponse
    {
        $items = Paiement::where('eleve_id', $eleve->id)->orderByDesc('date')->get();

        return response()->json([
            'success' => true,
            'data' => PaiementResource::collection($items),
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        if (!$request->user()?->isAdmin()) {
            abort(403);
        }
    }
}
