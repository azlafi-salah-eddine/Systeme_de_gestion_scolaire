<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use App\Traits\HandlesActiveRecords;
use App\Traits\SoftDeleteActive;

class PaiementEleve extends Model
{
    use HandlesActiveRecords, SoftDeleteActive;

    protected $table = 'paiements_eleves';

    protected $fillable = [
        'eleve_id',
        'frais_scolaire_id',
        'mois',
        'montant_du',
        'montant_paye',
        'montant_restant',
        'statut',
        'date_echeance',
        'annee_scolaire_id',
        'active'
    ];

    protected $appends = [
        'statut_label',
    ];

    protected $casts = [
        'montant_du' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'montant_restant' => 'decimal:2',
        'date_echeance' => 'date',
        'active' => 'boolean'
    ];

    // Relations
    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }

    public function fraisScolaire(): BelongsTo
    {
        return $this->belongsTo(FraisScolaire::class);
    }

    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function historiquePaiements(): HasMany
    {
        return $this->hasMany(HistoriquePaiement::class);
    }

    // Scopes
    public function scopeByEleve($query, $eleveId)
    {
        return $query->where('eleve_id', $eleveId);
    }

    public function scopeByMois($query, $mois)
    {
        return $query->where('mois', $mois);
    }

    public function scopeByStatut($query, $statut)
    {
        return $query->where('statut', $statut);
    }

    public function scopeEnRetard($query)
    {
        return $query->where('statut', 'en_retard')
                    ->orWhere(function($q) {
                        $q->where('statut', 'en_attente')
                          ->where('date_echeance', '<', now());
                    });
    }

    // Accessors
    public function getStatutLabelAttribute()
    {
        // Si le montant restant est 0 ou négatif, le paiement est réglé
        $montantRestant = (float) ($this->montant_restant ?? 0);
        if ($montantRestant <= 0 && ($this->montant_paye ?? 0) > 0) {
            return 'Réglé';
        }
        
        if (!$this->statut) {
            return 'En Attente';
        }
        
        $statuts = [
            'en_attente' => 'En Attente',
            'partiel' => 'Paiement Partiel',
            'regle' => 'Réglé',
            'en_retard' => 'En Retard'
        ];

        return $statuts[$this->statut] ?? $this->statut;
    }

    // Méthodes utilitaires
    public function calculerStatut()
    {
        $montantDu = (float) ($this->montant_du ?? 0);
        $montantPaye = (float) ($this->montant_paye ?? 0);
        $montantRestant = $montantDu - $montantPaye;
        
        if ($montantRestant <= 0 && $montantPaye > 0) {
            $this->statut = 'regle';
            $this->montant_restant = 0;
        } elseif ($montantPaye > 0) {
            $this->statut = 'partiel';
            $this->montant_restant = max(0, $montantRestant);
        } else {
            if ($this->date_echeance && $this->date_echeance < now()) {
                $this->statut = 'en_retard';
            } else {
                $this->statut = 'en_attente';
            }
            $this->montant_restant = $montantDu;
        }

        $this->save();
    }

    public function ajouterPaiement($montant, $modePaiement, $notes = null, $utilisateurId = null)
    {
        $this->montant_paye += $montant;
        $this->calculerStatut();

        // Créer l'historique
        if (Schema::hasTable('historique_paiements')) {
            HistoriquePaiement::create([
                'paiement_eleve_id' => $this->id,
                'montant' => $montant,
                'date_paiement' => now(),
                'mode_paiement' => $modePaiement,
                'notes' => $notes,
                'utilisateur_id' => $utilisateurId,
                'annee_scolaire_id' => $this->annee_scolaire_id
            ]);
        }

        return $this;
    }
}