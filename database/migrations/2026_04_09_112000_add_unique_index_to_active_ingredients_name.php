<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('active_ingredients') || ! Schema::hasColumn('active_ingredients', 'name') || $this->indexExists('active_ingredients_name_unique')) {
            return;
        }

        Schema::table('active_ingredients', function (Blueprint $table): void {
            $table->unique('name');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('active_ingredients') || ! $this->indexExists('active_ingredients_name_unique')) {
            return;
        }

        Schema::table('active_ingredients', function (Blueprint $table): void {
            $table->dropUnique('active_ingredients_name_unique');
        });
    }

    private function indexExists(string $indexName): bool
    {
        return DB::table('pg_indexes')
            ->where('schemaname', 'public')
            ->where('tablename', 'active_ingredients')
            ->where('indexname', $indexName)
            ->exists();
    }
};
