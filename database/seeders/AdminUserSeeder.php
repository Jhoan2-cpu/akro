<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $defaultBranchId = DB::table('sucursales')->value('id');

        if ($defaultBranchId === null) {
            $defaultBranchId = DB::table('sucursales')->insertGetId([
                'nombre' => 'Sucursal Principal',
                'direccion' => 'Sin direccion',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $admin = User::query()->firstOrNew([
            'email' => (string) env('ADMIN_EMAIL', 'admin@sanlucas.local'),
        ]);

        $admin->forceFill([
            'name' => (string) env('ADMIN_NAME', 'Administrador'),
            'password' => (string) env('ADMIN_PASSWORD', 'Admin12345!'),
            'role' => 'admin',
            'sucursal_id' => $defaultBranchId,
            'email_verified_at' => now(),
        ])->save();
    }
}