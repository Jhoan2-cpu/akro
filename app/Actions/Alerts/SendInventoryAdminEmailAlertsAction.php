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

        $alertsByBranch = $inventories->groupBy('branch_id')
            ->map(function (Collection $branchInventories) use ($today, $nearExpiryLimit): array {
                $branchName = (string) ($branchInventories->first()?->branch?->name ?? 'Sucursal');

                $outOfStockItems = $branchInventories
                    ->filter(fn (Inventory $inventory): bool => (int) $inventory->current_stock === 0)
                    ->map(fn (Inventory $inventory): array => [
                        'medicine_name' => $inventory->medicine?->name ?? 'Medicamento',
                        'current_stock' => (int) $inventory->current_stock,
                        'minimum_stock' => (int) $inventory->minimum_stock,
                    ])
                    ->values()
                    ->all();

                $lowStockItems = $branchInventories
                    ->filter(fn (Inventory $inventory): bool => (int) $inventory->current_stock > 0 && (int) $inventory->current_stock <= (int) $inventory->minimum_stock)
                    ->map(fn (Inventory $inventory): array => [
                        'medicine_name' => $inventory->medicine?->name ?? 'Medicamento',
                        'current_stock' => (int) $inventory->current_stock,
                        'minimum_stock' => (int) $inventory->minimum_stock,
                    ])
                    ->values()
                    ->all();

                $expiredItems = $branchInventories
                    ->filter(function (Inventory $inventory) use ($today): bool {
                        if ($inventory->expiration_date === null) {
                            return false;
                        }

                        return Carbon::parse((string) $inventory->expiration_date)->lt($today);
                    })
                    ->map(function (Inventory $inventory) use ($today): array {
                        $expirationDate = Carbon::parse((string) $inventory->expiration_date);

                        return [
                            'medicine_name' => $inventory->medicine?->name ?? 'Medicamento',
                            'expiration_date' => $expirationDate->toDateString(),
                            'days_to_expire' => $today->diffInDays($expirationDate, false),
                        ];
                    })
                    ->values()
                    ->all();

                $nearExpiryItems = $branchInventories
                    ->filter(function (Inventory $inventory) use ($today, $nearExpiryLimit): bool {
                        if ($inventory->expiration_date === null) {
                            return false;
                        }

                        $expirationDate = Carbon::parse((string) $inventory->expiration_date);

                        return $expirationDate->betweenIncluded($today, $nearExpiryLimit);
                    })
                    ->map(function (Inventory $inventory) use ($today): array {
                        $expirationDate = Carbon::parse((string) $inventory->expiration_date);

                        return [
                            'medicine_name' => $inventory->medicine?->name ?? 'Medicamento',
                            'expiration_date' => $expirationDate->toDateString(),
                            'days_to_expire' => $today->diffInDays($expirationDate, false),
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'branch_name' => $branchName,
                    'out_of_stock_items' => $outOfStockItems,
                    'low_stock_items' => $lowStockItems,
                    'expired_items' => $expiredItems,
                    'near_expiry_items' => $nearExpiryItems,
                ];
            })
            ->filter(fn (array $summary): bool =>
                $summary['out_of_stock_items'] !== []
                || $summary['low_stock_items'] !== []
                || $summary['expired_items'] !== []
                || $summary['near_expiry_items'] !== []
            );

        if ($alertsByBranch->isEmpty()) {
            return [
                'alerts' => 0,
                'recipients' => 0,
                'skipped_duplicates' => 0,
            ];
        }

        $branchIdsWithAlerts = $alertsByBranch->keys()->map(fn ($id): int => (int) $id)->values()->all();
        $sentRecipients = 0;
        $skippedDuplicates = 0;

        $recipients = User::query()
            ->whereIn('role', ['superuser', 'admin', 'employee'])
            ->where(function ($query): void {
                $query
                    ->whereNull('status')
                    ->orWhere('status', 'active');
            })
            ->whereNotNull('verification_email')
            ->whereNotNull('verification_email_verified_at')
            ->get(['id', 'name', 'verification_email', 'role', 'branch_id']);

        foreach ($recipients as $recipient) {
            $recipientBranchAlerts = collect();

            if ($recipient->role === 'superuser') {
                $recipientBranchAlerts = $alertsByBranch;
            } elseif ($recipient->branch_id !== null && in_array((int) $recipient->branch_id, $branchIdsWithAlerts, true)) {
                $branchSummary = $alertsByBranch->get((string) $recipient->branch_id) ?? $alertsByBranch->get((int) $recipient->branch_id);

                if ($branchSummary !== null) {
                    $recipientBranchAlerts = collect([$branchSummary]);
                }
            }

            if ($recipientBranchAlerts->isEmpty()) {
                continue;
            }

            $branchSummaries = $recipientBranchAlerts->values()->all();

            $totals = [
                'out_of_stock' => (int) $recipientBranchAlerts->sum(fn (array $summary): int => count($summary['out_of_stock_items'])),
                'low_stock' => (int) $recipientBranchAlerts->sum(fn (array $summary): int => count($summary['low_stock_items'])),
                'expired' => (int) $recipientBranchAlerts->sum(fn (array $summary): int => count($summary['expired_items'])),
                'near_expiry' => (int) $recipientBranchAlerts->sum(fn (array $summary): int => count($summary['near_expiry_items'])),
            ];

            $snapshotHash = sha1(json_encode([
                'recipient_id' => (int) $recipient->id,
                'branches' => $branchSummaries,
                'totals' => $totals,
            ], JSON_THROW_ON_ERROR));

            $cacheKey = sprintf('alerts:inventory-email:%d:%s', (int) $recipient->id, $snapshotHash);

            if (Cache::has($cacheKey)) {
                $skippedDuplicates++;

                continue;
            }

            $verificationEmail = (string) $recipient->verification_email;

            Notification::route('mail', $verificationEmail)->notify(new InventoryRiskAlertNotification(
                recipientName: $recipient->name,
                branchSummaries: $branchSummaries,
                totals: $totals,
            ));

            Cache::put($cacheKey, true, $today->copy()->endOfDay());
            $sentRecipients++;
        }

        return [
            'alerts' => (int) $alertsByBranch->sum(fn (array $summary): int =>
                count($summary['out_of_stock_items'])
                + count($summary['low_stock_items'])
                + count($summary['expired_items'])
                + count($summary['near_expiry_items'])
            ),
            'recipients' => $sentRecipients,
            'skipped_duplicates' => $skippedDuplicates,
        ];
    }
}
