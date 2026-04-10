<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Analgésicos', 'description' => 'Medicamentos para el dolor'],
            ['name' => 'Antibióticos', 'description' => 'Medicamentos para infecciones bacterianas'],
            ['name' => 'Antihistamínicos', 'description' => 'Medicamentos para alergias'],
            ['name' => 'Antitérmicos', 'description' => 'Medicamentos para la fiebre'],
            ['name' => 'Vitaminas', 'description' => 'Suplementos vitamínicos'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name' => $category['name']],
                ['description' => $category['description']]
            );
        }
    }
}
