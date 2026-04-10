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
            return;
        }

        Schema::table('sale_details', function (Blueprint $table): void {
            if (! Schema::hasColumn('sale_details', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0.00)->after('unit_price');
            }

            if (! Schema::hasColumn('sale_details', 'tax_amount')) {
                $table->decimal('tax_amount', 10, 2)->default(0.00)->after('subtotal');
            }

            if (! Schema::hasColumn('sale_details', 'is_price_overridden')) {
                $table->boolean('is_price_overridden')->default(false)->after('tax_amount');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('sale_details')) {
            return;
        }

        Schema::table('sale_details', function (Blueprint $table): void {
            $columns = [];

            if (Schema::hasColumn('sale_details', 'subtotal')) {
                $columns[] = 'subtotal';
            }

            if (Schema::hasColumn('sale_details', 'tax_amount')) {
                $columns[] = 'tax_amount';
            }

            if (Schema::hasColumn('sale_details', 'is_price_overridden')) {
                $columns[] = 'is_price_overridden';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
