<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            BranchSeeder::class,
            CategorySeeder::class,
            ActiveIngredientSeeder::class,
            MedicineSeeder::class,
            InventorySeeder::class,
            BranchMedicinePriceSeeder::class,
            UserSeeder::class,
            SaleSeeder::class,
        ]);
    }
}
