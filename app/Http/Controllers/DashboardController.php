<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $isSuperuser = ($user?->role ?? null) === 'superuser';
        $isAdmin = $isSuperuser || ($user?->role ?? null) === 'admin';
        $branchId = $user?->branch_id;

        $todayStart = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();
        $yesterdayStart = Carbon::yesterday();
        $yesterdayEnd = Carbon::yesterday()->endOfDay();
        $last30Start = Carbon::today()->subDays(29)->startOfDay();
        $last7Start = Carbon::today()->subDays(6)->startOfDay();
        $nearExpiryLimit = Carbon::today()->addDays(30);

        $scopeSales = function (Builder $builder) use ($isAdmin, $branchId): void {
            if ($isAdmin) {
                return;
            }

            if ($branchId === null) {
                $builder->whereRaw('1 = 0');

                return;
            }

            $builder->where('branch_id', $branchId);
        };

        $scopeInventory = function (Builder $builder) use ($isAdmin, $branchId): void {
            if ($isAdmin) {
                return;
            }

            if ($branchId === null) {
                $builder->whereRaw('1 = 0');

                return;
            }

            $builder->where('branch_id', $branchId);
        };

        $todaySales = Sale::query()
            ->when(true, $scopeSales)
            ->whereBetween('created_at', [$todayStart, $todayEnd]);

        $yesterdaySales = Sale::query()
            ->when(true, $scopeSales)
            ->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd]);

        $todaySummary = [
            'total' => (float) (clone $todaySales)->sum('total'),
            'subtotal' => (float) (clone $todaySales)->sum('subtotal'),
            'total_tax' => (float) (clone $todaySales)->sum('total_tax'),
            'tickets' => (int) (clone $todaySales)->count(),
        ];

        $todaySummary['average_ticket'] = $todaySummary['tickets'] > 0
            ? round($todaySummary['total'] / $todaySummary['tickets'], 2)
            : 0.0;

        $yesterdayTotal = (float) (clone $yesterdaySales)->sum('total');
        $changeVsYesterday = $yesterdayTotal > 0
            ? round((($todaySummary['total'] - $yesterdayTotal) / $yesterdayTotal) * 100, 2)
            : null;

        $openShift = Shift::query()
            ->where('user_id', $user?->id)
            ->whereNull('clock_out_at')
            ->latest('clock_in_at')
            ->first();

        $inventoryBase = Inventory::query()
            ->with(['medicine:id,name', 'branch:id,name'])
            ->when(true, $scopeInventory);

        $lowStockCount = (clone $inventoryBase)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->count();

        $expiredCount = (clone $inventoryBase)
            ->whereDate('expiration_date', '<', Carbon::today())
            ->count();

        $nearExpiryCount = (clone $inventoryBase)
            ->whereDate('expiration_date', '>=', Carbon::today())
            ->whereDate('expiration_date', '<', $nearExpiryLimit)
            ->count();

        $criticalAlerts = (clone $inventoryBase)
            ->where(function (Builder $builder) use ($nearExpiryLimit): void {
                $builder
                    ->whereColumn('current_stock', '<=', 'minimum_stock')
                    ->orWhereDate('expiration_date', '<', Carbon::today())
                    ->orWhere(function (Builder $nearBuilder) use ($nearExpiryLimit): void {
                        $nearBuilder
                            ->whereDate('expiration_date', '>=', Carbon::today())
                            ->whereDate('expiration_date', '<', $nearExpiryLimit);
                    });
            })
            ->orderByRaw('CASE WHEN current_stock <= minimum_stock THEN 0 ELSE 1 END')
            ->orderBy('expiration_date')
            ->limit(5)
            ->get()
            ->map(function (Inventory $inventory): array {
                return [
                    'id' => $inventory->id,
                    'medicine' => $inventory->medicine?->name ?? 'Medicamento',
                    'branch' => $inventory->branch?->name ?? 'Sucursal',
                    'current_stock' => (int) $inventory->current_stock,
                    'minimum_stock' => (int) $inventory->minimum_stock,
                    'expiration_date' => optional($inventory->expiration_date)?->toDateString(),
                ];
            })
            ->values();

        $salesByHourRaw = Sale::query()
            ->when(true, $scopeSales)
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->selectRaw('EXTRACT(HOUR FROM created_at) as hour')
            ->selectRaw('COALESCE(SUM(total),0) as total_amount')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->mapWithKeys(fn (object $row): array => [(int) $row->hour => (float) $row->total_amount]);

        $salesByHour = collect(range(0, 23))
            ->map(fn (int $hour): array => [
                'hour' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00',
                'total_amount' => round((float) ($salesByHourRaw[$hour] ?? 0), 2),
            ])
            ->values();

        $salesByDay = Sale::query()
            ->when(true, $scopeSales)
            ->whereBetween('created_at', [$last30Start, $todayEnd])
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COALESCE(SUM(total),0) as total_amount')
            ->selectRaw('COUNT(*) as tickets')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn (object $row): array => [
                'day' => (string) $row->day,
                'total_amount' => round((float) $row->total_amount, 2),
                'tickets' => (int) $row->tickets,
            ])
            ->values();

        $branchOptions = Branch::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Branch $branch): array => [
                'id' => (int) $branch->id,
                'name' => (string) $branch->name,
            ])
            ->values();

        $salesByHourBranchRows = Sale::query()
            ->join('branches', 'branches.id', '=', 'sales.branch_id')
            ->whereBetween('sales.created_at', [$todayStart, $todayEnd])
            ->selectRaw('branches.id as branch_id')
            ->selectRaw('branches.name as branch_name')
            ->selectRaw('EXTRACT(HOUR FROM sales.created_at) as hour')
            ->selectRaw('COALESCE(SUM(sales.total),0) as total_amount')
            ->groupBy('branches.id', 'branches.name', 'hour')
            ->orderBy('branches.name')
            ->orderBy('hour')
            ->get();

        $salesByHourByBranch = $branchOptions
            ->map(function (array $branch) use ($salesByHourBranchRows): array {
                $rows = $salesByHourBranchRows
                    ->where('branch_id', $branch['id'])
                    ->mapWithKeys(fn (object $row): array => [(int) $row->hour => (float) $row->total_amount]);

                $series = collect(range(0, 23))
                    ->map(fn (int $hour): array => [
                        'hour' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00',
                        'total_amount' => round((float) ($rows[$hour] ?? 0), 2),
                    ])
                    ->values();

                return [
                    'branch_id' => $branch['id'],
                    'branch_name' => $branch['name'],
                    'series' => $series,
                ];
            })
            ->values();

        $salesByDayBranchRows = Sale::query()
            ->join('branches', 'branches.id', '=', 'sales.branch_id')
            ->whereBetween('sales.created_at', [$last30Start, $todayEnd])
            ->selectRaw('branches.id as branch_id')
            ->selectRaw('branches.name as branch_name')
            ->selectRaw('DATE(sales.created_at) as day')
            ->selectRaw('COALESCE(SUM(sales.total),0) as total_amount')
            ->selectRaw('COUNT(sales.id) as tickets')
            ->groupBy('branches.id', 'branches.name', 'day')
            ->orderBy('branches.name')
            ->orderBy('day')
            ->get();

        $salesByDayByBranch = $branchOptions
            ->map(function (array $branch) use ($salesByDayBranchRows): array {
                $rows = $salesByDayBranchRows->where('branch_id', $branch['id'])->values();

                return [
                    'branch_id' => $branch['id'],
                    'branch_name' => $branch['name'],
                    'series' => $rows
                        ->map(fn (object $row): array => [
                            'day' => (string) $row->day,
                            'total_amount' => round((float) $row->total_amount, 2),
                            'tickets' => (int) $row->tickets,
                        ])
                        ->values(),
                ];
            })
            ->values();

        $topMedicines = SaleDetail::query()
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->join('medicines', 'medicines.id', '=', 'sale_details.medicine_id')
            ->when(true, function (Builder $builder) use ($scopeSales): void {
                $scopeSales($builder);
            })
            ->whereBetween('sales.created_at', [$last30Start, $todayEnd])
            ->selectRaw('medicines.name as medicine_name')
            ->selectRaw('SUM(sale_details.quantity) as quantity')
            ->selectRaw('COALESCE(SUM(sale_details.unit_price * sale_details.quantity),0) as total_amount')
            ->groupBy('medicines.name')
            ->orderByDesc('quantity')
            ->limit(6)
            ->get()
            ->map(fn (object $row): array => [
                'medicine_name' => (string) $row->medicine_name,
                'quantity' => (int) $row->quantity,
                'total_amount' => round((float) $row->total_amount, 2),
            ])
            ->values();

        $branchPerformance = $isAdmin
            ? Sale::query()
                ->join('branches', 'branches.id', '=', 'sales.branch_id')
                ->whereBetween('sales.created_at', [$last7Start, $todayEnd])
                ->selectRaw('branches.id as branch_id')
                ->selectRaw('branches.name as branch_name')
                ->selectRaw('COALESCE(SUM(sales.total),0) as total_amount')
                ->selectRaw('COUNT(sales.id) as tickets')
                ->groupBy('branches.id', 'branches.name')
                ->orderByDesc('total_amount')
                ->limit(6)
                ->get()
                ->map(fn (object $row): array => [
                    'branch_id' => (int) $row->branch_id,
                    'branch_name' => (string) $row->branch_name,
                    'total_amount' => round((float) $row->total_amount, 2),
                    'tickets' => (int) $row->tickets,
                ])
                ->values()
            : collect();

        $employeesByBranch = User::query()
            ->join('branches', 'branches.id', '=', 'users.branch_id')
            ->where('users.role', 'employee')
            ->where(function (Builder $builder): void {
                $builder->whereNull('users.status')->orWhere('users.status', 'active');
            })
            ->selectRaw('branches.id as branch_id')
            ->selectRaw('branches.name as branch_name')
            ->selectRaw('COUNT(users.id) as employees_count')
            ->groupBy('branches.id', 'branches.name')
            ->orderBy('branches.name')
            ->get()
            ->map(fn (object $row): array => [
                'branch_id' => (int) $row->branch_id,
                'branch_name' => (string) $row->branch_name,
                'employees_count' => (int) $row->employees_count,
            ])
            ->values();

        $branchScopeLabel = $isAdmin
            ? 'Vista global de sucursales'
            : ((string) optional(Branch::query()->find($branchId))->name ?: 'Tu sucursal');

        $priceOverridesToday = SaleDetail::query()
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->when(true, function (Builder $builder) use ($scopeSales): void {
                $scopeSales($builder);
            })
            ->whereBetween('sales.created_at', [$todayStart, $todayEnd])
            ->where('sale_details.is_price_overridden', true)
            ->count();

        $restockCandidates = (clone $inventoryBase)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->orderByRaw('(minimum_stock - current_stock) DESC')
            ->limit(5)
            ->get()
            ->map(fn (Inventory $inventory): array => [
                'id' => $inventory->id,
                'medicine' => $inventory->medicine?->name ?? 'Medicamento',
                'branch' => $inventory->branch?->name ?? 'Sucursal',
                'current_stock' => (int) $inventory->current_stock,
                'minimum_stock' => (int) $inventory->minimum_stock,
                'missing_units' => max(0, (int) $inventory->minimum_stock - (int) $inventory->current_stock),
            ])
            ->values();

        $tasks = collect();

        if ($expiredCount > 0) {
            $tasks->push('Retira productos vencidos del inventario hoy.');
        }

        if ($lowStockCount > 0) {
            $tasks->push('Genera solicitud de compra para productos con bajo stock.');
        }

        if ($nearExpiryCount > 0) {
            $tasks->push('Aplica rotación FEFO para productos próximos a vencer.');
        }

        if ($openShift === null) {
            $tasks->push('No tienes turno abierto: registra apertura para comenzar operaciones.');
        }

        if ($priceOverridesToday > 0) {
            $tasks->push('Revisa ventas con precio manual para auditoría fiscal.');
        }

        return Inertia::render('dashboard', [
            'scope' => [
                'is_admin' => $isAdmin,
                'branch_label' => $branchScopeLabel,
                'branch_id' => $branchId,
            ],
            'kpis' => [
                'today' => $todaySummary,
                'yesterday_total' => round($yesterdayTotal, 2),
                'change_vs_yesterday' => $changeVsYesterday,
            ],
            'operations' => [
                'open_shift' => $openShift === null
                    ? null
                    : [
                        'clock_in_at' => optional($openShift->clock_in_at)?->toDateTimeString(),
                    ],
                'alerts' => [
                    'low_stock_count' => $lowStockCount,
                    'expired_count' => $expiredCount,
                    'near_expiry_count' => $nearExpiryCount,
                    'critical_items' => $criticalAlerts,
                ],
                'price_overrides_today' => (int) $priceOverridesToday,
            ],
            'analytics' => [
                'sales_by_hour' => $salesByHour,
                'sales_by_hour_by_branch' => $salesByHourByBranch,
                'sales_by_day' => $salesByDay,
                'sales_by_day_by_branch' => $salesByDayByBranch,
                'branch_options' => $branchOptions,
                'top_medicines' => $topMedicines,
                'branch_performance' => $branchPerformance,
            ],
            'inventory' => [
                'restock_candidates' => $restockCandidates,
            ],
            'teams' => [
                'employees_by_branch' => $employeesByBranch,
            ],
            'tasks' => $tasks->values(),
        ]);
    }
}
