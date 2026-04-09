<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sale_details')) {
            Schema::create('sale_details', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('sale_id')->constrained('sales');
                $table->foreignId('medicine_id')->constrained('medicines');
                $table->integer('quantity');
                $table->decimal('unit_price', 10, 2);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_details');
    }
};