<?php

namespace App\Http\Controllers;

use App\Http\Requests\Matiere\StoreMatiereRequest;
use App\Http\Resources\MatiereResource;
use App\Models\Matiere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MatiereController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Matiere::class, 'matiere');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Matiere::query();

        // Par défaut, afficher seulement les matières actives
        if (!$request->filled('active') || $request->boolean('active')) {
            $query->where('active', true);
        } elseif ($request->boolean('active') === false) {
            $query->where('active', false);
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $matieres = $query->with('niveau')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => MatiereResource::collection($matieres->items()),
            'meta' => [
                'current_page' => $matieres->currentPage(),
                'per_page' => $matieres->perPage(),
                'total' => $matieres->total(),
                'last_page' => $matieres->lastPage(),
            ],
        ]);
    }

    /**
     * Liste des matières actives pour les emplois du temps
     */
    public function active(): JsonResponse
    {
        $matieres = Matiere::where('active', true)
            ->orderBy('nom')
            ->get(['id', 'nom', 'code', 'coleur']);

        return response()->json([
            'success' => true,
            'data' => $matieres,
        ]);
    }

    /**
     * Liste publique des matières pour les emplois du temps
     */
    public function listForTimetable(): JsonResponse
    {
        $matieres = Matiere::where('active', true)
            ->select('id', 'nom', 'code', 'coleur')
            ->orderBy('nom')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $matieres,
            'message' => 'Liste des matières récupérée avec succès'
        ]);
    }

    public function store(StoreMatiereRequest $request): JsonResponse
    {
        $matiere = Matiere::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Matière créée avec succès',
            'data' => new MatiereResource($matiere->load('niveau')),
        ], 201);
    }

    public function show(Matiere $matiere): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new MatiereResource($matiere->load('niveau')),
        ]);
    }

    public function update(Request $request, Matiere $matiere): JsonResponse
    {
        $validated = $request->validate([
            'nom' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('matieres', 'nom')
                    ->where(fn($q) => $q
                        ->where('niveau_id', $request->input('niveau_id', $matiere->niveau_id))
                        ->where('active', true)
                    )
                    ->ignore($matiere->id),
            ],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('matieres', 'code')
                    ->where(fn($q) => $q
                        ->where('niveau_id', $request->input('niveau_id', $matiere->niveau_id))
                        ->where('active', true)
                    )
                    ->ignore($matiere->id),
            ],
            'description' => 'nullable|string|max:500',
            'coleur' => 'nullable|string|max:20',
            'coefficient' => 'nullable|numeric|min:0',
            'niveau_id' => 'nullable|exists:niveaux,id',
            'active' => 'sometimes|boolean',
        ]);

        $matiere->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Matière mise à jour avec succès',
            'data' => new MatiereResource($matiere->fresh()->load('niveau')),
        ]);
    }

    public function destroy(Matiere $matiere): JsonResponse
    {
        // Soft delete via active flag to align with global soft delete logic
        if (method_exists($matiere, 'softDelete')) {
            $matiere->softDelete();
        } else {
            $matiere->update(['active' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Matière supprimée avec succès',
        ]);
    }
}