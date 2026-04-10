<?php

declare(strict_types=1);

namespace App\Actions\Alerts;

use App\Models\Inventory;
use App\Models\User;
use App\Notifications\InventoryRiskAlertNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

class SendInventoryAdminEmailAlertsAction
{
    /**
     * @return array{alerts: int, recipients: int, skipped_duplicates: int}
     */
    public function execute(): array
    {
        $today = Carbon::today();
        $nearExpiryLimit = Carbon::today()->addDays(30);

        $inventories = Inventory::query()
            ->with(['branch:id,name', 'medicine:id,name'])
            ->where(function ($query) use ($today, $nearExpiryLimit): void {
                $query
                    ->whereColumn('current_stock', '<=', 'minimum_stock')
                    ->orWhere(function ($expiringQuery) use ($today, $nearExpiryLimit): void {
                        $expiringQuery
                            ->whereDate('expiration_date', '>=', $today)
                            ->whereDate('expiration_date', '<', $nearExpiryLimit);
                    });
            })
            ->orderBy('branch_id')
            ->orderBy('expiration_date')
            ->get();

        if ($inventories->isEmpty()) {
            return [
                'alerts' => 0,
                'recipients' => 0,
                'skipped_duplicates' => 0,
            ];
        }

        $alertsByBranch = $inventories->groupBy('branch_id');
        $sentRecipients = 0;
        $skippedDuplicates = 0;

        foreach ($alertsByBranch as $branchId => $branchInventories) {
            $branchInventories = $branchInventories instanceof Collection
                ? $branchInventories
                : collect($branchInventories);

            $lowStockItems = $branchInventories
                ->filter(fn (Inventory $inventory): bool => $inventory->current_stock <= $inventory->minimum_stock)
                ->map(fn (Inventory $inventory): array => [
                    'medicine_name' => $inventory->medicine?->name ?? 'Medicine',
                    'current_stock' => (int) $inventory->current_stock,
                    'minimum_stock' => (int) $inventory->minimum_stock,
                ])
                ->values()
                ->all();

            $nearExpiryItems = $branchInventories
                ->filter(function (Inventory $inventory) use ($today, $nearExpiryLimit): bool {
                    if ($inventory->expiration_date === null) {
                        return false;
                    }

                    $expirationDate = Carbon::parse((string) $inventory->expiration_date);

                    return $expirationDate->betweenIncluded($today, $nearExpiryLimit->copy()->subDay());
                })
                ->map(function (Inventory $inventory) use ($today): array {
                    $expirationDate = Carbon::parse((string) $inventory->expiration_date);
                    $daysToExpire = $today->diffInDays($expirationDate, false);

                    return [
                        'medicine_name' => $inventory->medicine?->name ?? 'Medicine',
                        'expiration_date' => $expirationDate->toDateString(),
                        'days_to_expire' => $daysToExpire,
                    ];
                })
                ->values()
                ->all();

            if ($lowStockItems === [] && $nearExpiryItems === []) {
                continue;
            }

            $branchName = (string) ($branchInventories->first()?->branch?->name ?? 'Sucursal');

            $admins = User::query()
                ->where('role', 'admin')
                ->where('branch_id', (int) $branchId)
                ->whereNotNull('verification_email')
                ->whereNotNull('verification_email_verified_at')
                ->where(function ($query): void {
                    $query
                        ->whereNull('status')
                        ->orWhere('status', 'active');
                })
                ->get(['id', 'name', 'verification_email']);

            foreach ($admins as $admin) {
                $cacheKey = sprintf(
                    'alerts:inventory-admin-email:%d:%s',
                    $admin->id,
                    $today->toDateString(),
                );

                if (Cache::has($cacheKey)) {
                    $skippedDuplicates++;

                    continue;
                }

                $verificationEmail = (string) $admin->verification_email;

                Notification::route('mail', $verificationEmail)
                    ->notify(new InventoryRiskAlertNotification(
                        adminName: $admin->name,
                        branchName: $branchName,
                        lowStockItems: $lowStockItems,
                        nearExpiryItems: $nearExpiryItems,
                    ));

                Cache::put($cacheKey, true, $today->copy()->endOfDay());
                $sentRecipients++;
            }
        }

        return [
            'alerts' => $inventories->count(),
            'recipients' => $sentRecipients,
            'skipped_duplicates' => $skippedDuplicates,
        ];
    }
}
