<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sales')) {
            return;
        }

        Schema::table('sales', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0.00)->after('branch_id');
            }

            if (! Schema::hasColumn('sales', 'total_tax')) {
                $table->decimal('total_tax', 10, 2)->default(0.00)->after('subtotal');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('sales')) {
            return;
        }

        Schema::table('sales', function (Blueprint $table): void {
            $columns = [];

            if (Schema::hasColumn('sales', 'subtotal')) {
                $columns[] = 'subtotal';
            }

            if (Schema::hasColumn('sales', 'total_tax')) {
                $columns[] = 'total_tax';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
