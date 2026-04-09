<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('medicine_active_ingredient')) {
            Schema::create('medicine_active_ingredient', function (Blueprint $table): void {
                $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
                $table->foreignId('active_ingredient_id')->constrained('active_ingredients')->cascadeOnDelete();
                $table->primary(['medicine_id', 'active_ingredient_id']);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('medicine_active_ingredient');
    }
};