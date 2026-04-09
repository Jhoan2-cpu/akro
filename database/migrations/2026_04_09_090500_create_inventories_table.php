<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('inventories')) {
            Schema::create('inventories', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches');
                $table->foreignId('medicine_id')->constrained('medicines');
                $table->integer('current_stock');
                $table->integer('minimum_stock');
                $table->date('expiration_date');
                $table->timestamps();

                $table->unique(['branch_id', 'medicine_id'], 'inventories_branch_medicine_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};