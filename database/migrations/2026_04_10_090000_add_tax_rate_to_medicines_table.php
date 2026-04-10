<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('medicines') || Schema::hasColumn('medicines', 'tax_rate')) {
            return;
        }

        Schema::table('medicines', function (Blueprint $table): void {
            $table->decimal('tax_rate', 5, 2)->default(0.00)->after('description');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('medicines') || ! Schema::hasColumn('medicines', 'tax_rate')) {
            return;
        }

        Schema::table('medicines', function (Blueprint $table): void {
            $table->dropColumn('tax_rate');
        });
    }
};
