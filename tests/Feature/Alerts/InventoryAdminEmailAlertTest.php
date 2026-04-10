<?php

declare(strict_types=1);

namespace Tests\Feature\Alerts;

use App\Actions\Alerts\SendInventoryAdminEmailAlertsAction;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Medicine;
use App\Models\User;
use App\Notifications\InventoryRiskAlertNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class InventoryAdminEmailAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_alert_email_to_verified_admin_in_same_branch(): void
    {
        Notification::fake();

        $branch = Branch::query()->create([
            'name' => 'Sucursal Centro',
            'address' => 'Av. Principal 123',
        ]);

        $category = Category::query()->create([
            'name' => 'Analgesics',
            'description' => null,
        ]);

        $medicine = Medicine::query()->create([
            'category_id' => $category->id,
            'name' => 'Paracetamol 500',
            'barcode' => '750000000001',
            'description' => 'Pain relief',
            'tax_rate' => 0,
        ]);

        Inventory::query()->create([
            'branch_id' => $branch->id,
            'medicine_id' => $medicine->id,
            'current_stock' => 2,
            'minimum_stock' => 10,
            'expiration_date' => Carbon::today()->addDays(12)->toDateString(),
        ]);

        User::factory()->create([
            'branch_id' => $branch->id,
            'role' => 'admin',
            'verification_email' => 'admin-centro@example.com',
            'verification_email_verified_at' => now(),
        ]);

        app(SendInventoryAdminEmailAlertsAction::class)->execute();

        Notification::assertSentOnDemand(
            InventoryRiskAlertNotification::class,
            function (InventoryRiskAlertNotification $notification, array $channels, object $notifiable): bool {
                return in_array('mail', $channels, true)
                    && (($notifiable->routes['mail'] ?? null) === 'admin-centro@example.com');
            }
        );
    }

    public function test_it_sends_on_every_execute_to_verified_users_in_branch(): void
    {
        Notification::fake();

        $branch = Branch::query()->create([
            'name' => 'Sucursal Norte',
            'address' => 'Calle 10',
        ]);

        $otherBranch = Branch::query()->create([
            'name' => 'Sucursal Sur',
            'address' => 'Calle 20',
        ]);

        $category = Category::query()->create([
            'name' => 'Antibiotics',
            'description' => null,
        ]);

        $medicine = Medicine::query()->create([
            'category_id' => $category->id,
            'name' => 'Amoxicillin',
            'barcode' => '750000000002',
            'description' => 'Antibiotic',
            'tax_rate' => 0,
        ]);

        Inventory::query()->create([
            'branch_id' => $branch->id,
            'medicine_id' => $medicine->id,
            'current_stock' => 1,
            'minimum_stock' => 5,
            'expiration_date' => Carbon::today()->addDays(3)->toDateString(),
        ]);

        User::factory()->create([
            'branch_id' => $branch->id,
            'role' => 'admin',
            'verification_email' => 'admin-norte@example.com',
            'verification_email_verified_at' => now(),
        ]);

        User::factory()->create([
            'branch_id' => $branch->id,
            'role' => 'employee',
            'verification_email' => 'employee@example.com',
            'verification_email_verified_at' => now(),
        ]);

        User::factory()->create([
            'branch_id' => $branch->id,
            'role' => 'admin',
            'verification_email' => 'admin-unverified@example.com',
            'verification_email_verified_at' => null,
        ]);

        User::factory()->create([
            'branch_id' => $otherBranch->id,
            'role' => 'admin',
            'verification_email' => 'admin-otra-sucursal@example.com',
            'verification_email_verified_at' => now(),
        ]);

        app(SendInventoryAdminEmailAlertsAction::class)->execute();
        app(SendInventoryAdminEmailAlertsAction::class)->execute();

        Notification::assertSentOnDemandTimes(InventoryRiskAlertNotification::class, 4);
    }

    public function test_it_sends_superuser_alerts_for_every_branch_with_low_stock(): void
    {
        Notification::fake();

        $branchNorth = Branch::query()->create([
            'name' => 'Sucursal Norte',
            'address' => 'Av. Norte 10',
        ]);

        $branchSouth = Branch::query()->create([
            'name' => 'Sucursal Sur',
            'address' => 'Av. Sur 20',
        ]);

        $category = Category::query()->create([
            'name' => 'General',
            'description' => null,
        ]);

        $medicineNorth = Medicine::query()->create([
            'category_id' => $category->id,
            'name' => 'Ibuprofeno',
            'barcode' => '750000000003',
            'description' => 'Analgesic',
            'tax_rate' => 0,
        ]);

        $medicineSouth = Medicine::query()->create([
            'category_id' => $category->id,
            'name' => 'Loratadina',
            'barcode' => '750000000004',
            'description' => 'Antihistamine',
            'tax_rate' => 0,
        ]);

        Inventory::query()->create([
            'branch_id' => $branchNorth->id,
            'medicine_id' => $medicineNorth->id,
            'current_stock' => 1,
            'minimum_stock' => 8,
            'expiration_date' => Carbon::today()->addDays(7)->toDateString(),
        ]);

        Inventory::query()->create([
            'branch_id' => $branchSouth->id,
            'medicine_id' => $medicineSouth->id,
            'current_stock' => 2,
            'minimum_stock' => 9,
            'expiration_date' => Carbon::today()->addDays(15)->toDateString(),
        ]);

        User::factory()->create([
            'branch_id' => $branchNorth->id,
            'role' => 'superuser',
            'verification_email' => 'superuser@example.com',
            'verification_email_verified_at' => now(),
        ]);

        app(SendInventoryAdminEmailAlertsAction::class)->execute();

        Notification::assertSentOnDemand(
            InventoryRiskAlertNotification::class,
            function (InventoryRiskAlertNotification $notification, array $channels, object $notifiable): bool {
                return in_array('mail', $channels, true)
                    && (($notifiable->routes['mail'] ?? null) === 'superuser@example.com');
            }
        );

        Notification::assertSentOnDemandTimes(InventoryRiskAlertNotification::class, 2);
    }
}
