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
                            ->whereDate('expiration_date', '<=', $nearExpiryLimit);
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

                    return $expirationDate->lessThanOrEqualTo($nearExpiryLimit);
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
            $snapshotHash = sha1(json_encode([
                'branch_id' => (int) $branchId,
                'low_stock_items' => $lowStockItems,
                'near_expiry_items' => $nearExpiryItems,
            ], JSON_THROW_ON_ERROR));

            $recipients = User::query()
                ->where(function ($query) use ($branchId): void {
                    $query
                        ->where('role', 'superuser')
                        ->orWhere(function ($branchQuery) use ($branchId): void {
                            $branchQuery
                                ->whereIn('role', ['admin', 'employee'])
                                ->where('branch_id', (int) $branchId);
                        });
                })
                ->where(function ($query): void {
                    $query
                        ->whereNull('status')
                        ->orWhere('status', 'active');
                })
                ->whereNotNull('verification_email')
                ->whereNotNull('verification_email_verified_at')
                ->get(['id', 'name', 'verification_email', 'role', 'branch_id']);

            foreach ($recipients as $recipient) {
                $cacheKey = sprintf(
                    'alerts:inventory-email:%d:%d:%s',
                    $recipient->id,
                    (int) $branchId,
                    $snapshotHash,
                );

                if (Cache::has($cacheKey)) {
                    $skippedDuplicates++;

                    continue;
                }

                $verificationEmail = (string) $recipient->verification_email;

                Notification::route('mail', $verificationEmail)->notify(new InventoryRiskAlertNotification(
                    recipientName: $recipient->name,
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
