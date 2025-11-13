<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Remove the global stateful middleware - it was causing CSRF issues
        // $middleware->api(prepend: [
        //     \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // ]);

        // Create a custom middleware group for API routes with session support but without CSRF
        $middleware->group('api-session', [
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'admin.only' => \App\Http\Middleware\AdminOnly::class,
            'superadmin.only' => \App\Http\Middleware\SuperAdminOnly::class,
            'clean.json' => \App\Http\Middleware\CleanJsonResponse::class,
            'annee.scolaire' => \App\Http\Middleware\AnneeScolaireFilter::class,
            'api.auth' => \App\Http\Middleware\ApiAuth::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function ($schedule) {
        // Créer automatiquement l'année scolaire chaque jour (vérifie si on est le 1er août ou après)
        $schedule->command('annee-scolaire:create-auto')->daily();
    })
    ->create();
