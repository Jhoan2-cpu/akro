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
        if (! Schema::hasTable('categories') || ! Schema::hasColumn('categories', 'name') || $this->indexExists('categories_name_unique')) {
            return;
        }

        Schema::table('categories', function (Blueprint $table): void {
            $table->unique('name');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('categories') || ! $this->indexExists('categories_name_unique')) {
            return;
        }

        Schema::table('categories', function (Blueprint $table): void {
            $table->dropUnique('categories_name_unique');
        });
    }

    private function indexExists(string $indexName): bool
    {
        return DB::table('pg_indexes')
            ->where('schemaname', 'public')
            ->where('tablename', 'categories')
            ->where('indexname', $indexName)
            ->exists();
    }
};
