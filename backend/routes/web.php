<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Route pour servir les images des élèves
Route::get('/storage/{path}', function ($path) {
    $fullPath = 'public/' . $path;
    
    // Debug: Log the path being requested
    \Log::info('Storage path requested: ' . $path);
    \Log::info('Full path: ' . $fullPath);
    \Log::info('File exists: ' . (Storage::exists($fullPath) ? 'YES' : 'NO'));
    
    if (!Storage::exists($fullPath)) {
        \Log::error('File not found: ' . $fullPath);
        abort(404);
    }
    
    $file = Storage::get($fullPath);
    $mimeType = Storage::mimeType($fullPath);
    
    return response($file, 200)->header('Content-Type', $mimeType);
})->where('path', '.*');

require __DIR__.'/auth.php';
