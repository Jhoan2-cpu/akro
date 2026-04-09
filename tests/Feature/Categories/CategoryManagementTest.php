<?php

declare(strict_types=1);

namespace Tests\Feature\Categories;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Medicine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_register_a_category(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)->post(route('categories.store'), [
            'name' => 'Analgésicos',
            'description' => 'Control de dolor y fiebre',
        ]);

        $response->assertRedirect(route('categories.index'));

        $this->assertDatabaseHas('categories', [
            'name' => 'Analgésicos',
            'description' => 'Control de dolor y fiebre',
        ]);
    }

    public function test_category_name_must_be_unique(): void
    {
        $admin = $this->createAdminUser();

        Category::query()->create([
            'name' => 'Antibióticos',
            'description' => 'Primera categoría',
        ]);

        $response = $this->actingAs($admin)->post(route('categories.store'), [
            'name' => 'Antibióticos',
            'description' => 'Duplicado',
        ]);

        $response->assertSessionHasErrors(['name']);

        $this->assertDatabaseCount('categories', 1);
    }

    public function test_category_with_medicines_cannot_be_deleted(): void
    {
        $admin = $this->createAdminUser();
        $category = Category::query()->create([
            'name' => 'Antihistamínicos',
            'description' => null,
        ]);

        Medicine::query()->create([
            'category_id' => $category->id,
            'name' => 'Loratadina 10mg',
            'barcode' => '1234567890123',
            'image_path' => null,
            'description' => null,
        ]);

        $response = $this->actingAs($admin)->delete(route('categories.destroy', $category));

        $response->assertRedirect();

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_category_without_medicines_can_be_deleted(): void
    {
        $admin = $this->createAdminUser();
        $category = Category::query()->create([
            'name' => 'Vitaminas',
            'description' => null,
        ]);

        $response = $this->actingAs($admin)->delete(route('categories.destroy', $category));

        $response->assertRedirect(route('categories.index'));

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    private function createAdminUser(): User
    {
        $branch = Branch::query()->create([
            'name' => 'Sucursal Centro',
            'address' => 'Dirección de prueba',
        ]);

        return User::factory()->create([
            'branch_id' => $branch->id,
            'role' => 'admin',
            'status' => 'active',
        ]);
    }
}
