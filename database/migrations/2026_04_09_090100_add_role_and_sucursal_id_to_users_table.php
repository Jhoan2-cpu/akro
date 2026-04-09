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
            $table->enum('role', ['admin', 'empleado'])->default('empleado')->after('email');
            $table->foreignId('sucursal_id')->nullable()->after('role')->constrained('sucursales')->restrictOnDelete();
            $table->string('foto_perfil_path')->nullable()->after('password');
        });

        $defaultSucursalId = DB::table('sucursales')->value('id');

        if ($defaultSucursalId === null) {
            $defaultSucursalId = DB::table('sucursales')->insertGetId([
                'nombre' => 'Sucursal Principal',
                'direccion' => 'Sin direccion',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('users')
            ->whereNull('sucursal_id')
            ->update(['sucursal_id' => $defaultSucursalId]);

        DB::statement('ALTER TABLE users ALTER COLUMN sucursal_id SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('sucursal_id');
            $table->dropColumn('foto_perfil_path');
            $table->dropColumn('role');
        });
    }
};