<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Medicine;
use App\Models\BranchMedicinePrice;
use Illuminate\Database\Seeder;

class BranchMedicinePriceSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();
        $medicines = Medicine::all();

        foreach ($medicines as $medicine) {
            foreach ($branches as $branch) {
                // Calculate sale price from tax_rate
                // Assuming the price is gross (includes tax)
                $basePriceGross = rand(50, 500) / 10; // Price between 5.0 and 50.0
                
                BranchMedicinePrice::firstOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'medicine_id' => $medicine->id,
                    ],
                    [
                        'sale_price' => $basePriceGross,
                    ]
                );
            }
        }
    }
}
