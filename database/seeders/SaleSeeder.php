<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleDetail;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            $employees = User::where('branch_id', $branch->id)
                ->where('role', 'employee')
                ->get();

            if ($employees->isEmpty()) {
                continue;
            }

            // Create 5 sales per branch
            for ($i = 0; $i < 5; $i++) {
                $employee = $employees->random();
                $inventories = Inventory::where('branch_id', $branch->id)
                    ->with('medicine')
                    ->where('current_stock', '>', 0)
                    ->inRandomOrder()
                    ->limit(rand(2, 5))
                    ->get();

                if ($inventories->isEmpty()) {
                    continue;
                }

                $subtotal = 0;
                $totalTax = 0;
                $details = [];

                foreach ($inventories as $inventory) {
                    $quantity = rand(1, 5);
                    $unitPrice = $inventory->medicine->branchPrices()
                        ->where('branch_id', $branch->id)
                        ->first()?->sale_price ?? 10.00;

                    $unitPriceGross = (float) $unitPrice;
                    $taxRate = (float) $inventory->medicine->tax_rate;
                    
                    // Calculate base price (untaxed)
                    $base = $unitPriceGross / (1 + $taxRate);
                    $taxAmount = $unitPriceGross - $base;
                    $itemSubtotal = $base * $quantity;
                    $itemTax = $taxAmount * $quantity;

                    $subtotal += $itemSubtotal;
                    $totalTax += $itemTax;

                    $details[] = [
                        'medicine_id' => $inventory->medicine->id,
                        'quantity' => $quantity,
                        'unit_price' => number_format($unitPriceGross, 2),
                        'subtotal' => number_format($itemSubtotal, 2),
                        'tax_amount' => number_format($itemTax, 2),
                        'is_price_overridden' => false,
                    ];
                }

                $total = $subtotal + $totalTax;

                $sale = Sale::create([
                    'branch_id' => $branch->id,
                    'user_id' => $employee->id,
                    'subtotal' => number_format($subtotal, 2),
                    'total_tax' => number_format($totalTax, 2),
                    'total' => number_format($total, 2),
                       'created_at' => now()->subDays(rand(1, 30)),
                ]);

                foreach ($details as $detail) {
                    SaleDetail::create(array_merge($detail, ['sale_id' => $sale->id]));
                }
            }
        }
    }
}
