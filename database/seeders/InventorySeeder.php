<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Medicine;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();
        $medicines = Medicine::all();

        foreach ($medicines as $medicine) {
            foreach ($branches as $branch) {
                Inventory::firstOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'medicine_id' => $medicine->id,
                    ],
                    [
                        'current_stock' => rand(10, 100),
                        'minimum_stock' => rand(5, 20),
                        'expiration_date' => now()->addMonths(rand(6, 12)),
                    ]
                );
            }
        }
    }
}
