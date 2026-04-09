<?php

use App\Http\Controllers\CloudinaryTestController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/cloudinary-test', [CloudinaryTestController::class, 'show'])
    ->name('cloudinary.test');

Route::post('/cloudinary-test', [CloudinaryTestController::class, 'store'])
    ->name('cloudinary.test.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('library-check', 'library-check')->name('library-check');
    Route::get('shifts', [ShiftController::class, 'index'])->name('shifts.index');
    Route::post('shifts/clock-in', [ShiftController::class, 'clockIn'])->name('shifts.clock-in');
    Route::post('shifts/clock-out', [ShiftController::class, 'clockOut'])->name('shifts.clock-out');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::resource('users', UserController::class)->except(['show', 'destroy']);
    Route::patch('users/{user}/suspend', [UserController::class, 'suspend'])->name('users.suspend');
});

require __DIR__.'/settings.php';
