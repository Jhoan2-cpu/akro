<?php

namespace App\Http\Middleware;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'toast' => $request->session()->get('toast'),
                'ticket' => $request->session()->get('ticket'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notifications' => $this->buildSidebarNotifications($request),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildSidebarNotifications(Request $request): array
    {
        $user = $request->user();

        if ($user === null) {
            return [
                'low_stock_count' => 0,
                'expired_count' => 0,
                'near_expiry_count' => 0,
                'items' => [],
            ];
        }

        $today = Carbon::today();
        $nearLimit = Carbon::today()->addDays(30);

        $baseQuery = Inventory::query()
            ->with(['medicine:id,name,barcode', 'branch:id,name'])
            ->when(($user->role ?? null) !== 'superuser', function (Builder $builder) use ($user): void {
                if ($user->branch_id === null) {
                    $builder->whereRaw('1 = 0');

                    return;
                }

                $builder->where('branch_id', $user->branch_id);
            });

        $expiredCount = (clone $baseQuery)
            ->whereDate('expiration_date', '<', $today)
            ->count();

        $lowStockCount = (clone $baseQuery)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->count();

        $nearExpiryCount = (clone $baseQuery)
            ->whereDate('expiration_date', '>=', $today)
            ->whereDate('expiration_date', '<', $nearLimit)
            ->count();

        $items = (clone $baseQuery)
            ->where(function (Builder $builder) use ($today, $nearLimit): void {
                $builder
                    ->whereColumn('current_stock', '<=', 'minimum_stock')
                    ->orWhereDate('expiration_date', '<', $today)
                    ->orWhere(function (Builder $nearBuilder) use ($today, $nearLimit): void {
                        $nearBuilder
                            ->whereDate('expiration_date', '>=', $today)
                            ->whereDate('expiration_date', '<', $nearLimit);
                    });
            })
            ->orderByRaw('CASE WHEN current_stock <= minimum_stock THEN 0 ELSE 1 END')
            ->orderBy('current_stock')
            ->orderBy('expiration_date')
            ->limit(6)
            ->get()
            ->map(function (Inventory $inventory) use ($today): array {
                $days = $today->diffInDays($inventory->expiration_date, false);
                $isExpired = $days < 0;
                $isLowStock = $inventory->current_stock <= $inventory->minimum_stock;
                $isNearExpiry = $days >= 0 && $days < 30;

                $status = $isExpired
                    ? 'expired'
                    : ($isLowStock ? 'low-stock' : 'near-expiry');

                $message = match ($status) {
                    'expired' => sprintf('%s está vencido.', $inventory->medicine?->name ?? 'Este producto'),
                    'low-stock' => sprintf(
                        '%s tiene stock bajo (%d/%d).',
                        $inventory->medicine?->name ?? 'Este producto',
                        (int) $inventory->current_stock,
                        (int) $inventory->minimum_stock,
                    ),
                    default => sprintf('%s caduca en %d día(s).', $inventory->medicine?->name ?? 'Este producto', $days),
                };

                return [
                    'id' => $inventory->id,
                    'medicine_name' => $inventory->medicine?->name ?? 'Medicamento',
                    'branch_name' => $inventory->branch?->name ?? 'Sin sucursal',
                    'status' => $status,
                    'current_stock' => (int) $inventory->current_stock,
                    'minimum_stock' => (int) $inventory->minimum_stock,
                    'days_to_expire' => $days,
                    'is_expired' => $isExpired,
                    'is_near_expiry' => $isNearExpiry,
                    'message' => $message,
                ];
            })
            ->values();

        return [
            'low_stock_count' => $lowStockCount,
            'expired_count' => $expiredCount,
            'near_expiry_count' => $nearExpiryCount,
            'items' => $items,
        ];
    }
}
