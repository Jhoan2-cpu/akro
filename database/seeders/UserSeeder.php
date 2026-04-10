<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $mainBranch = Branch::where('name', 'Main Branch')->first();
        $northBranch = Branch::where('name', 'North Branch')->first();
        $southBranch = Branch::where('name', 'South Branch')->first();

        // Create Superuser (only 1)
        User::firstOrCreate(
            ['email' => 'superuser@sanlucas.local'],
            [
                'name' => 'Super Usuario',
                'password' => Hash::make('SuperUser123!'),
                'role' => 'superuser',
                'status' => 'active',
                'branch_id' => $mainBranch?->id,
                'email_verified_at' => now(),
            ]
        );

        // Create Admins
        User::firstOrCreate(
            ['email' => 'admin@sanlucas.local'],
            [
                'name' => 'Administrador Principal',
                'password' => Hash::make('Admin123!'),
                'role' => 'admin',
                'status' => 'active',
                'branch_id' => $mainBranch?->id,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin.norte@sanlucas.local'],
            [
                'name' => 'Admin Sucursal Norte',
                'password' => Hash::make('AdminNorte123!'),
                'role' => 'admin',
                'status' => 'active',
                'branch_id' => $northBranch?->id,
                'email_verified_at' => now(),
            ]
        );

        // Create Employees
        User::firstOrCreate(
            ['email' => 'juan@sanlucas.local'],
            [
                'name' => 'Juan García',
                'password' => Hash::make('Juan123!'),
                'role' => 'employee',
                'status' => 'active',
                'branch_id' => $mainBranch?->id,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'maria@sanlucas.local'],
            [
                'name' => 'Maria López',
                'password' => Hash::make('Maria123!'),
                'role' => 'employee',
                'status' => 'active',
                'branch_id' => $mainBranch?->id,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'carlos@sanlucas.local'],
            [
                'name' => 'Carlos Rodríguez',
                'password' => Hash::make('Carlos123!'),
                'role' => 'employee',
                'status' => 'active',
                'branch_id' => $northBranch?->id,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'ana@sanlucas.local'],
            [
                'name' => 'Ana Martínez',
                'password' => Hash::make('Ana123!'),
                'role' => 'employee',
                'status' => 'active',
                'branch_id' => $southBranch?->id,
                'email_verified_at' => now(),
            ]
        );
    }
}
