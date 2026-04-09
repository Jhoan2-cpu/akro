<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventario', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('medicamento_id')->constrained('medicamentos');
            $table->integer('stock_actual');
            $table->integer('stock_minimo');
            $table->date('caducidad');
            $table->timestamps();
            $table->unique(['sucursal_id', 'medicamento_id'], 'inventario_sucursal_medicamento_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventario');
    }
};