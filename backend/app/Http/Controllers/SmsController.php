<?php

namespace App\Http\Controllers;

use App\Http\Requests\Sms\SendSmsRequest;
use App\Models\Eleve;
use App\Models\ParentEleve;
use App\Models\SmsNotification;
use App\Jobs\SendSmsJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsController extends Controller
{
    public function send(SendSmsRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Handle destinataire_id - may be null for 'tous' or 'personnalise'
        $destinataireId = $data['destinataire_id'] ?? null;
        
        // Default telephone (will be populated by job based on type)
        $telephone = 'pending'; // Placeholder value
        if (isset($data['numeros_personnalises']) && is_array($data['numeros_personnalises'])) {
            $telephone = implode(',', $data['numeros_personnalises']);
        }

        $notification = SmsNotification::create([
            'destinataire_type' => $data['destinataire_type'],
            'destinataire_id' => $destinataireId,
            'telephone' => $telephone,
            'message' => $data['message'],
            'statut' => 'en_attente',
            'date_envoi' => now(),
            'type' => 'general',
            'urgent' => false,
            'numeros_personnalises' => isset($data['numeros_personnalises']) ? json_encode($data['numeros_personnalises']) : null,
        ]);

        if (class_exists(SendSmsJob::class)) {
            dispatch(new SendSmsJob($notification->id));
        }

        return response()->json([
            'success' => true,
            'message' => 'SMS en cours d\'envoi',
            'data' => $notification,
        ], 202);
    }

    public function history(Request $request): JsonResponse
    {
        $query = SmsNotification::query();
        if ($request->filled('destinataire_type')) {
            $query->where('destinataire_type', $request->input('destinataire_type'));
        }
        if ($request->filled('statut')) {
            $query->whereIn('statut', array_map('trim', explode(',', (string) $request->input('statut'))));
        }

        $perPage = (int) $request->input('per_page', 15);
        $items = $query->orderByDesc('date_envoi')->paginate($perPage);

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
}
