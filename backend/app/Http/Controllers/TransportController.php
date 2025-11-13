<?php

namespace App\Http\Controllers;

use App\Http\Resources\EleveResource;
use App\Models\Transport;
use App\Models\Eleve;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TransportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transport::query()->active();
        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['eleves', 'chauffeur', 'accompagnateur'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $query->with($with);
            }
        } else {
            // Par défaut, charger les relations chauffeur et accompagnateur
            $query->with(['chauffeur', 'accompagnateur']);
        }
        $perPage = (int) $request->input('per_page', 15);
        $items = $query->paginate($perPage);

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
            'ligne' => 'required|string|max:100|unique:transports,ligne',
            // Moroccan format: 1-5 digits, hyphen, 1 letter (Arabic or Latin), hyphen, 1-2 digits
            'matricule' => [
                'required', 'string', 'max:50', 'unique:transports,matricule',
                'regex:/^\d{1,5}-[A-Za-z\x{0600}-\x{06FF}]{1}-\d{1,2}$/u'
            ],
            'capacite' => 'required|integer|min:1',
            'chauffeur_id' => 'nullable|integer|exists:chauffeurs,id|unique:transports,chauffeur_id',
            'accompagnateur_id' => 'nullable|integer|exists:accompagnateurs,id|unique:transports,accompagnateur_id',
        ]);
        $transport = Transport::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Transport créé',
            'data' => $transport,
        ], 201);
    }

    public function show(Transport $transport): JsonResponse
    {
        $transport->load(['chauffeur', 'accompagnateur', 'eleves']);
        return response()->json([
            'success' => true,
            'data' => $transport,
        ]);
    }

    public function update(Request $request, Transport $transport): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'ligne' => 'sometimes|required|string|max:100|unique:transports,ligne,' . $transport->id,
            'matricule' => [
                'sometimes','required','string','max:50','unique:transports,matricule,' . $transport->id,
                'regex:/^\d{1,5}-[A-Za-z\x{0600}-\x{06FF}]{1}-\d{1,2}$/u'
            ],
            'capacite' => 'sometimes|required|integer|min:1',
            'chauffeur_id' => 'sometimes|nullable|integer|exists:chauffeurs,id|unique:transports,chauffeur_id,' . $transport->id,
            'accompagnateur_id' => 'sometimes|nullable|integer|exists:accompagnateurs,id|unique:transports,accompagnateur_id,' . $transport->id,
        ]);
        $transport->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Transport mis à jour',
            'data' => $transport->fresh(),
        ]);
    }

    public function destroy(Transport $transport): JsonResponse
    {
        $this->ensureAdmin();
        $transport->softDelete();

        return response()->json([
            'success' => true,
            'message' => 'Transport masqué (soft delete)',
        ]);
    }

    public function inscrireEleve(Request $request, Transport $transport): JsonResponse
    {
        $this->ensureRole(['admin', 'parent', 'eleve']);
        $validated = $request->validate([
            'eleve_id' => 'required|integer|exists:eleves,id',
        ]);
        $eleve = Eleve::findOrFail($validated['eleve_id']);

        if ($transport->eleves()->where('eleve_id', $eleve->id)->exists()) {
            throw ValidationException::withMessages([
                'eleve_id' => ['Élève déjà inscrit à ce transport.'],
            ]);
        }
        $transport->eleves()->attach($eleve->id, [
            'date_inscription' => now(),
        ]);

        // Mettre à jour la référence directe pour reporting rapide
        try {
            $eleve->update(['transport_id' => $transport->id]);
        } catch (\Throwable $ignored) {}

        return response()->json([
            'success' => true,
            'message' => 'Élève inscrit au transport',
        ], 201);
    }

    public function desinscrireEleve(Transport $transport, Eleve $eleve): JsonResponse
    {
        $this->ensureRole(['admin', 'parent', 'eleve']);
        $transport->eleves()->detach($eleve->id);

        return response()->json([
            'success' => true,
            'message' => 'Élève désinscrit du transport',
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
