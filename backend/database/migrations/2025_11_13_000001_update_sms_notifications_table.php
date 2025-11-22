<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sms_notifications', function (Blueprint $table) {
            // Make destinataire_id nullable to support 'tous' and 'personnalise' types
            $table->bigInteger('destinataire_id')->unsigned()->nullable()->change();
            
            // Make telephone nullable since we'll handle it differently
            $table->string('telephone')->nullable()->change();
            
            // Add new column for custom phone numbers
            $table->text('numeros_personnalises')->nullable()->after('message');
            
            // Update statut enum to match frontend expectations
            $table->enum('statut', ['en_attente', 'envoye', 'livre', 'echoue'])->default('en_attente')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sms_notifications', function (Blueprint $table) {
            $table->bigInteger('destinataire_id')->unsigned()->nullable(false)->change();
            $table->string('telephone')->nullable(false)->change();
            $table->dropColumn('numeros_personnalises');
            $table->enum('statut', ['en_attente', 'envoye', 'livre', 'echec'])->default('en_attente')->change();
        });
    }
};
