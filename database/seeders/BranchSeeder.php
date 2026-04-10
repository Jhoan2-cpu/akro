<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        Branch::firstOrCreate(
            ['name' => 'Main Branch'],
            [
                'address' => 'Calle Principal 123, San Lucas',
            ]
        );

        Branch::firstOrCreate(
            ['name' => 'North Branch'],
            [
                'address' => 'Av. Norte 456, San Lucas',
            ]
        );

        Branch::firstOrCreate(
            ['name' => 'South Branch'],
            [
                'address' => 'Av. Sur 789, San Lucas',
            ]
        );
    }
}
