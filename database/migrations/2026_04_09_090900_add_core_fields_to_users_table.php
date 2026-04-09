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
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'branch_id') && Schema::hasTable('branches')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->restrictOnDelete();
            });
        }

        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->enum('role', ['admin', 'employee'])->default('employee')->after('email');
            });
        }

        if (! Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('role');
            });
        }

        if (! Schema::hasColumn('users', 'profile_photo_path')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('profile_photo_path')->nullable()->after('password');
            });
        }

        if (! Schema::hasColumn('users', 'two_factor_secret')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->text('two_factor_secret')->nullable()->after('profile_photo_path');
            });
        }

        if (! Schema::hasColumn('users', 'two_factor_recovery_codes')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            });
        }

        if (! Schema::hasColumn('users', 'two_factor_confirmed_at')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            });
        }

        if (! Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        if (! Schema::hasColumn('users', 'branch_id') || ! Schema::hasTable('branches')) {
            return;
        }

        $defaultBranchId = DB::table('branches')->value('id');

        if ($defaultBranchId === null) {
            $defaultBranchId = DB::table('branches')->insertGetId([
                'name' => 'Main Branch',
                'address' => 'Address pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('users')
            ->whereNull('branch_id')
            ->update(['branch_id' => $defaultBranchId]);

        DB::statement('ALTER TABLE users ALTER COLUMN branch_id SET NOT NULL');
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'branch_id')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('branch_id');
            });
        }

        $columns = [
            'role',
            'status',
            'profile_photo_path',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'two_factor_confirmed_at',
        ];

        $existingColumns = array_values(array_filter($columns, fn (string $column): bool => Schema::hasColumn('users', $column)));

        if ($existingColumns !== []) {
            Schema::table('users', function (Blueprint $table) use ($existingColumns): void {
                $table->dropColumn($existingColumns);
            });
        }

        if (Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropSoftDeletes();
            });
        }
    }
};