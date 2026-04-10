<?php

use App\Http\Controllers\CloudinaryTestController;
use App\Http\Controllers\ActiveIngredientController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\SaleController;
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
    Route::get('medicines/stock', [MedicineController::class, 'stock'])->name('medicines.stock');
    Route::get('sales/quick', [SaleController::class, 'index'])->name('sales.quick');
    Route::get('sales/history', [SaleController::class, 'history'])->name('sales.history');
    Route::get('sales/search', [SaleController::class, 'search'])->name('sales.search');
    Route::get('sales/{sale}/ticket', [SaleController::class, 'ticket'])->name('sales.ticket');
    Route::post('sales', [SaleController::class, 'store'])->name('sales.store');
});

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::resource('users', UserController::class)->except(['show', 'destroy']);
    Route::patch('users/{user}/suspend', [UserController::class, 'suspend'])->name('users.suspend');
    Route::post('categories/quick-store', [CategoryController::class, 'storeInline'])->name('categories.quick-store');
    Route::post('active-ingredients/quick-store', [ActiveIngredientController::class, 'storeInline'])->name('active-ingredients.quick-store');
    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('branches', BranchController::class)->except(['show', 'create', 'edit']);
    Route::resource('medicines', MedicineController::class)->except(['show']);
});

require __DIR__.'/settings.php';
