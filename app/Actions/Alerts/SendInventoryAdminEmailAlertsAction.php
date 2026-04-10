<?php

declare(strict_types=1);

namespace App\Actions\Alerts;

use App\Models\Inventory;
use App\Models\User;
use App\Notifications\InventoryRiskAlertNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

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
            ->whereIn('role', ['superuser', 'admin'])
            ->where(function ($query): void {
                $query
                    ->whereNull('status')
                    ->orWhere('status', 'active');
            })
            ->where(function ($query): void {
                $query
                    ->where(function ($verificationEmailQuery): void {
                        $verificationEmailQuery
                            ->whereNotNull('verification_email')
                            ->whereNotNull('verification_email_verified_at');
                    })
                    ->orWhere(function ($loginEmailQuery): void {
                        $loginEmailQuery
                            ->whereNotNull('email')
                            ->whereNotNull('email_verified_at');
                    });
            })
            ->get(['id', 'name', 'email', 'email_verified_at', 'verification_email', 'verification_email_verified_at', 'role', 'branch_id']);

        if ($recipients->isEmpty()) {
            Log::warning('inventory_alert_recipients_empty', [
                'reason' => 'No active admin/superuser with verified profile email or verified login email.',
            ]);
        }

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

            $cacheKey = sprintf('alerts:inventory-email:%d:%s', (int) $recipient->id, $today->toDateString());

            if (! Cache::add($cacheKey, true, $today->copy()->endOfDay())) {
                $skippedDuplicates++;

                continue;
            }

            $verificationEmail = $this->resolveRecipientEmail($recipient);

            if ($verificationEmail === null) {
                Log::warning('inventory_alert_recipient_without_verified_email', [
                    'recipient_id' => (int) $recipient->id,
                    'recipient_name' => (string) $recipient->name,
                    'recipient_role' => (string) $recipient->role,
                ]);

                continue;
            }

            try {
                if ($this->sendViaBrevoApi(
                    email: $verificationEmail,
                    recipientName: (string) $recipient->name,
                    branchSummaries: $branchSummaries,
                    totals: $totals,
                )) {
                    $sentRecipients++;

                    continue;
                }

                Notification::route('mail', $verificationEmail)->notify(new InventoryRiskAlertNotification(
                    recipientName: $recipient->name,
                    branchSummaries: $branchSummaries,
                    totals: $totals,
                ));
                $sentRecipients++;
            } catch (Throwable $exception) {
                Log::error('inventory_alert_email_send_failed', [
                    'recipient_id' => (int) $recipient->id,
                    'recipient_email' => $verificationEmail,
                    'recipient_role' => (string) $recipient->role,
                    'exception_class' => $exception::class,
                    'exception_message' => $exception->getMessage(),
                ]);
            }
        }

        Log::info('inventory_alert_dispatch_summary', [
            'alerts' => (int) $alertsByBranch->sum(fn (array $summary): int =>
                count($summary['out_of_stock_items'])
                + count($summary['low_stock_items'])
                + count($summary['expired_items'])
                + count($summary['near_expiry_items'])
            ),
            'recipients_total' => $recipients->count(),
            'recipients_sent' => $sentRecipients,
            'recipients_skipped_duplicates' => $skippedDuplicates,
        ]);

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

    /**
     * @param array<int, array{
     *   branch_name: string,
     *   out_of_stock_items: array<int, array{medicine_name: string, current_stock: int, minimum_stock: int}>,
     *   low_stock_items: array<int, array{medicine_name: string, current_stock: int, minimum_stock: int}>,
     *   expired_items: array<int, array{medicine_name: string, expiration_date: string, days_to_expire: int}>,
     *   near_expiry_items: array<int, array{medicine_name: string, expiration_date: string, days_to_expire: int}>
     * }> $branchSummaries
     * @param array{out_of_stock: int, low_stock: int, expired: int, near_expiry: int} $totals
     */
    protected function sendViaBrevoApi(
        string $email,
        string $recipientName,
        array $branchSummaries,
        array $totals,
    ): bool {
        $brevoApiKey = (string) config('services.brevo.key', '');

        if ($brevoApiKey === '') {
            return false;
        }

        $fromAddress = (string) config('mail.from.address');
        $fromName = (string) config('mail.from.name');
        $subject = sprintf(
            'Alerta de inventario consolidada - %d agotados, %d bajo stock, %d vencidos, %d por vencer',
            $totals['out_of_stock'],
            $totals['low_stock'],
            $totals['expired'],
            $totals['near_expiry'],
        );

        $htmlContent = view('emails.inventory-risk-alert', [
            'recipientName' => $recipientName,
            'branchSummaries' => $branchSummaries,
            'totals' => $totals,
            'stockUrl' => url('/medicines/stock'),
            'logoUrl' => asset('images/logo.png'),
        ])->render();

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'accept' => 'application/json',
                    'api-key' => $brevoApiKey,
                    'content-type' => 'application/json',
                ])
                ->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => [
                        'name' => $fromName,
                        'email' => $fromAddress,
                    ],
                    'to' => [[
                        'email' => $email,
                        'name' => $recipientName,
                    ]],
                    'subject' => $subject,
                    'htmlContent' => $htmlContent,
                ]);

            if ($response->failed()) {
                Log::error('inventory_alert_email_brevo_failed', [
                    'recipient_email' => $email,
                    'status' => $response->status(),
                    'response' => mb_substr($response->body(), 0, 1200),
                ]);

                return false;
            }

            Log::info('inventory_alert_email_sent', [
                'recipient_email' => $email,
                'mailer' => 'brevo_api',
                'branch_count' => count($branchSummaries),
                'out_of_stock' => $totals['out_of_stock'],
                'low_stock' => $totals['low_stock'],
                'expired' => $totals['expired'],
                'near_expiry' => $totals['near_expiry'],
            ]);

            return true;
        } catch (Throwable $exception) {
            Log::error('inventory_alert_email_brevo_exception', [
                'recipient_email' => $email,
                'exception_class' => $exception::class,
                'exception_message' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    protected function resolveRecipientEmail(User $recipient): ?string
    {
        $verificationEmail = trim((string) ($recipient->verification_email ?? ''));
        $loginEmail = trim((string) ($recipient->email ?? ''));

        if ($verificationEmail !== '' && $recipient->verification_email_verified_at !== null) {
            return $verificationEmail;
        }

        if ($loginEmail !== '' && $recipient->email_verified_at !== null) {
            return $loginEmail;
        }

        return null;
    }
}
