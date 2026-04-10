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
        // Add 'superuser' to the role enum type in PostgreSQL
        try {
            DB::statement("ALTER TYPE role ADD VALUE 'superuser'");
        } catch (\Exception $e) {
            // Value might already exist, continue
        }
    }

    public function down(): void
    {
        // PostgreSQL does not allow removing values from enums, so we leave this empty
    }
};
