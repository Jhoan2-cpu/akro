<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Medicine;
use App\Models\ActiveIngredient;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    public function run(): void
    {
        $medicines = [
            [
                'name' => 'Ibuprofeno 400mg',
                'barcode' => '111',
                'category' => 'Analgésicos',
                'description' => 'Analgésico y antiinflamatorio',
                'tax_rate' => 0.08,
                'ingredients' => ['Ibuprofeno'],
            ],
            [
                'name' => 'Ibuprofeno 600mg',
                'barcode' => '112',
                'category' => 'Analgésicos',
                'description' => 'Analgésico de mayor potencia',
                'tax_rate' => 0.08,
                'ingredients' => ['Ibuprofeno'],
            ],
            [
                'name' => 'Paracetamol 500mg',
                'barcode' => '113',
                'category' => 'Analgésicos',
                'description' => 'Analgésico y antitérmico',
                'tax_rate' => 0.08,
                'ingredients' => ['Paracetamol'],
            ],
            [
                'name' => 'Paracetamol 750mg',
                'barcode' => '114',
                'category' => 'Antitérmicos',
                'description' => 'Para fiebre y dolor moderado',
                'tax_rate' => 0.08,
                'ingredients' => ['Paracetamol'],
            ],
            [
                'name' => 'Amoxicilina 500mg',
                'barcode' => '115',
                'category' => 'Antibióticos',
                'description' => 'Antibiótico beta-lactámico',
                'tax_rate' => 0.08,
                'ingredients' => ['Amoxicilina'],
            ],
            [
                'name' => 'Amoxicilina 250mg',
                'barcode' => '116',
                'category' => 'Antibióticos',
                'description' => 'Antibiótico beta-lactámico (dosis pediátrica)',
                'tax_rate' => 0.08,
                'ingredients' => ['Amoxicilina'],
            ],
            [
                'name' => 'Benadryl 25mg',
                'barcode' => '117',
                'category' => 'Antihistamínicos',
                'description' => 'Antihistamínico de primera generación',
                'tax_rate' => 0.08,
                'ingredients' => ['Diphenhydramine'],
            ],
            [
                'name' => 'Cetirizina 10mg',
                'barcode' => '118',
                'category' => 'Antihistamínicos',
                'description' => 'Antihistamínico no sedante',
                'tax_rate' => 0.08,
                'ingredients' => ['Cetirizina'],
            ],
            [
                'name' => 'Loratadina 10mg',
                'barcode' => '119',
                'category' => 'Antihistamínicos',
                'description' => 'Antihistamínico de larga duración',
                'tax_rate' => 0.08,
                'ingredients' => ['Loratadina'],
            ],
            [
                'name' => 'Aspirina 500mg',
                'barcode' => '121',
                'category' => 'Analgésicos',
                'description' => 'Analgésico clásico',
                'tax_rate' => 0.08,
                'ingredients' => ['Ácido Acetilsalicílico'],
            ],
            [
                'name' => 'Naproxeno 250mg',
                'barcode' => '122',
                'category' => 'Analgésicos',
                'description' => 'AINE de larga duración',
                'tax_rate' => 0.08,
                'ingredients' => ['Naproxeno'],
            ],
            [
                'name' => 'Vitamina C 1000mg',
                'barcode' => '123',
                'category' => 'Vitaminas',
                'description' => 'Suplemento de vitamina C',
                'tax_rate' => 0.08,
                'ingredients' => ['Vitamina C'],
            ],
            [
                'name' => 'Vitamina D 1000IU',
                'barcode' => '124',
                'category' => 'Vitaminas',
                'description' => 'Suplemento de vitamina D',
                'tax_rate' => 0.08,
                'ingredients' => ['Vitamina D'],
            ],
            [
                'name' => 'Ácido Fólico 400mcg',
                'barcode' => '125',
                'category' => 'Vitaminas',
                'description' => 'Suplemento de ácido fólico',
                'tax_rate' => 0.08,
                'ingredients' => ['Ácido Fólico'],
            ],
            [
                'name' => 'Calcio 500mg',
                'barcode' => '126',
                'category' => 'Vitaminas',
                'description' => 'Suplemento de calcio',
                'tax_rate' => 0.08,
                'ingredients' => ['Calcio'],
            ],
            [
                'name' => 'Ibuprofeno Infantil 100mg',
                'barcode' => '127',
                'category' => 'Analgésicos',
                'description' => 'Para niños',
                'tax_rate' => 0.08,
                'ingredients' => ['Ibuprofeno'],
            ],
            [
                'name' => 'Amoxicilina 750mg',
                'barcode' => '128',
                'category' => 'Antibióticos',
                'description' => 'Dosis más alta',
                'tax_rate' => 0.08,
                'ingredients' => ['Amoxicilina'],
            ],
            [
                'name' => 'Cetirizina 5mg',
                'barcode' => '129',
                'category' => 'Antihistamínicos',
                'description' => 'Dosis infantil',
                'tax_rate' => 0.08,
                'ingredients' => ['Cetirizina'],
            ],
            [
                'name' => 'Paracetamol 1000mg',
                'barcode' => '131',
                'category' => 'Antitérmicos',
                'description' => 'Dosis máxima',
                'tax_rate' => 0.08,
                'ingredients' => ['Paracetamol'],
            ],
            [
                'name' => 'Loratadina 5mg',
                'barcode' => '132',
                'category' => 'Antihistamínicos',
                'description' => 'Dosis infantil',
                'tax_rate' => 0.08,
                'ingredients' => ['Loratadina'],
            ],
        ];

        foreach ($medicines as $medicineData) {
            $category = Category::where('name', $medicineData['category'])->first();
            
            if (!$category) {
                continue;
            }

            $medicine = Medicine::firstOrCreate(
                ['barcode' => $medicineData['barcode']],
                [
                    'name' => $medicineData['name'],
                    'category_id' => $category->id,
                    'description' => $medicineData['description'],
                    'tax_rate' => $medicineData['tax_rate'],
                ]
            );

            // Attach active ingredients
            $ingredients = $medicineData['ingredients'];
            foreach ($ingredients as $ingredientName) {
                $ingredient = ActiveIngredient::where('name', $ingredientName)->first();
                if ($ingredient && !$medicine->activeIngredients()->where('active_ingredient_id', $ingredient->id)->exists()) {
                    $medicine->activeIngredients()->attach($ingredient->id);
                }
            }
        }
    }
}
