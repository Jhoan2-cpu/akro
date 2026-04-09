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
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->restrictOnDelete();
            $table->enum('role', ['admin', 'employee'])->default('employee')->after('email');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('role');
            $table->string('profile_photo_path')->nullable()->after('password');
            $table->text('two_factor_secret')->nullable()->after('profile_photo_path');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            $table->softDeletes();
        });

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
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropColumn([
                'role',
                'status',
                'profile_photo_path',
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
            ]);
            $table->dropSoftDeletes();
        });
    }
};