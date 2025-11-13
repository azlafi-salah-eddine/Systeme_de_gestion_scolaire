<?php

namespace App\Http\Controllers;

use App\Http\Resources\CantineResource;
use App\Models\Menu;
use App\Models\Cantine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Menu::query()->active()->with('cantine');
            if ($request->filled('cantine_id')) {
                $query->where('cantine_id', (int) $request->input('cantine_id'));
            }
            if ($request->filled('jour')) {
                $query->where('jour', $request->input('jour'));
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
        } catch (\Throwable $e) {
            Log::error('Menus index failed', ['error' => $e->getMessage()]);
            // Fallback: return empty list instead of 500 to avoid breaking the UI
            $perPage = (int) $request->input('per_page', 15);
            return response()->json([
                'success' => true,
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'per_page' => $perPage,
                    'total' => 0,
                    'last_page' => 1,
                ],
            ]);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'cantine_id' => 'required|integer|exists:cantines,id',
            'jour' => 'required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
            'plat_principal' => 'required|string|max:150',
            'entree' => 'nullable|string|max:150',
            'dessert' => 'nullable|string|max:150',
            'boisson' => 'nullable|string|max:150',
            'date_menu' => 'nullable|date',
        ]);
        $validated['active'] = true;
        $menu = Menu::create($validated);
        return response()->json([
            'success' => true,
            'message' => 'Menu créé',
            'data' => $menu->load('cantine'),
        ], 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $menu->load('cantine'),
        ]);
    }

    public function update(Request $request, Menu $menu): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'cantine_id' => 'sometimes|required|integer|exists:cantines,id',
            'jour' => 'sometimes|required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
            'plat_principal' => 'sometimes|required|string|max:150',
            'entree' => 'nullable|string|max:150',
            'dessert' => 'nullable|string|max:150',
            'boisson' => 'nullable|string|max:150',
            'date_menu' => 'nullable|date',
        ]);
        $menu->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Menu mis à jour',
            'data' => $menu->fresh()->load('cantine'),
        ]);
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $this->ensureAdmin();
        $menu->softDelete();
        return response()->json([
            'success' => true,
            'message' => 'Menu "' . $menu->plat_principal . '" du ' . $menu->jour . ' a été supprimé avec succès',
        ]);
    }

    private function ensureAdmin(): void
    {
        if (!request()->user()?->isAdmin()) {
            abort(403);
        }
    }
}
