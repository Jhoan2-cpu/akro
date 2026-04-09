<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicamento_principios', function (Blueprint $table): void {
            $table->foreignId('medicamento_id')->constrained('medicamentos')->cascadeOnDelete();
            $table->foreignId('principio_id')->constrained('principios_activos')->cascadeOnDelete();
            $table->primary(['medicamento_id', 'principio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicamento_principios');
    }
};