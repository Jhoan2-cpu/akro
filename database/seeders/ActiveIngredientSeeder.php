<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ActiveIngredient;
use Illuminate\Database\Seeder;

class ActiveIngredientSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = [
            'Ibuprofeno',
            'Paracetamol',
            'Amoxicilina',
            'Diphenhydramine',
            'Cetirizina',
            'Ácido Acetilsalicílico',
            'Loratadina',
            'Naproxeno',
            'Vitamina C',
            'Vitamina D',
            'Ácido Fólico',
            'Calcio',
        ];

        foreach ($ingredients as $ingredient) {
            ActiveIngredient::firstOrCreate(['name' => $ingredient]);
        }
    }
}
