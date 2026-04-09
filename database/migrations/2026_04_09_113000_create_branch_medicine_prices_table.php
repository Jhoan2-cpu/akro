<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('branch_medicine_prices')) {
            Schema::create('branch_medicine_prices', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
                $table->decimal('sale_price', 10, 2);
                $table->timestamps();

                $table->unique(['branch_id', 'medicine_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_medicine_prices');
    }
};