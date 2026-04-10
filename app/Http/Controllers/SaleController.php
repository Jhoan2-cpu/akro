<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Sales\StoreQuickSaleRequest;
use App\Models\BranchMedicinePrice;
use App\Models\Inventory;
use App\Models\Medicine;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use RuntimeException;
use Throwable;

class SaleController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $branch = $user?->branch;

        return Inertia::render('sales/index', [
            'branch' => $branch ? [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
            ] : null,
            'employee' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ] : null,
            'canSell' => $branch !== null,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $branchId = $request->user()?->branch_id;
        $query = trim((string) $request->input('query', ''));

        if ($branchId === null) {
            return response()->json([
                'message' => 'El empleado no tiene una sucursal asignada.',
            ], 409);
        }

        if ($query === '') {
            return response()->json([
                'message' => 'Debes ingresar un código de barras o nombre.',
            ], 422);
        }

        $medicine = Medicine::query()
            ->with(['category', 'activeIngredients'])
            ->where(function (Builder $builder) use ($query): void {
                $builder
                    ->where('barcode', $query)
                    ->orWhere('name', 'ilike', "%{$query}%");
            })
            ->orderBy('name')
            ->first();

        if ($medicine === null) {
            return response()->json([
                'message' => 'No se encontró el medicamento.',
            ], 404);
        }

        $inventory = Inventory::query()
            ->with('branch')
            ->where('branch_id', $branchId)
            ->where('medicine_id', $medicine->id)
            ->first();

        $salePrice = BranchMedicinePrice::query()
            ->where('branch_id', $branchId)
            ->where('medicine_id', $medicine->id)
            ->value('sale_price');

        if ($inventory === null) {
            return response()->json([
                'message' => 'El medicamento no tiene stock en la sucursal actual.',
                'medicine' => $this->medicinePayload($medicine, $salePrice),
                'inventory' => null,
            ], 404);
        }

        return response()->json([
            'medicine' => $this->medicinePayload($medicine, $salePrice),
            'inventory' => [
                'branch_name' => $inventory->branch?->name,
                'current_stock' => $inventory->current_stock,
                'minimum_stock' => $inventory->minimum_stock,
                'expiration_date' => (string) $inventory->expiration_date,
                'is_low_stock' => $inventory->current_stock <= $inventory->minimum_stock,
                'is_out_of_stock' => $inventory->current_stock === 0,
            ],
        ]);
    }

    public function history(Request $request): InertiaResponse
    {
        $user = $request->user();
        $search = trim((string) $request->input('search', ''));
        $from = trim((string) $request->input('from', ''));
        $to = trim((string) $request->input('to', ''));

        $baseHistoryQuery = function () use ($user, $search, $from, $to): Builder {
            $query = Sale::query();

            if (($user?->role ?? null) !== 'admin') {
                if ($user?->branch_id === null) {
                    $query->whereRaw('1 = 0');
                } else {
                    $query->where('branch_id', $user->branch_id);
                }
            }

            if ($search !== '') {
                $query->where(function (Builder $builder) use ($search): void {
                    $builder
                        ->whereHas('user', function (Builder $userBuilder) use ($search): void {
                            $userBuilder->where('name', 'ilike', "%{$search}%");
                        })
                        ->orWhereHas('branch', function (Builder $branchBuilder) use ($search): void {
                            $branchBuilder->where('name', 'ilike', "%{$search}%");
                        })
                        ->orWhereHas('details.medicine', function (Builder $medicineBuilder) use ($search): void {
                            $medicineBuilder
                                ->where('name', 'ilike', "%{$search}%")
                                ->orWhere('barcode', 'ilike', "%{$search}%");
                        });
                });
            }

            if ($from !== '') {
                $query->whereDate('created_at', '>=', $from);
            }

            if ($to !== '') {
                $query->whereDate('created_at', '<=', $to);
            }

            return $query;
        };

        $dailySales = $baseHistoryQuery()
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COUNT(*) as sales_count')
            ->selectRaw('COALESCE(SUM(total), 0) as total_amount')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn (object $row): array => [
                'day' => (string) $row->day,
                'sales_count' => (int) $row->sales_count,
                'total_amount' => round((float) $row->total_amount, 2),
            ])
            ->values();

        $salesQuery = $baseHistoryQuery()
            ->with([
                'branch:id,name',
                'user:id,name',
                'details.medicine:id,name,barcode',
            ])
            ->orderByDesc('created_at');

        $sales = $salesQuery
            ->paginate(12)
            ->withQueryString()
            ->through(function (Sale $sale): array {
                $lines = $sale->details->map(function (object $detail): array {
                    $quantity = (int) $detail->quantity;
                    $unitPrice = (float) $detail->unit_price;

                    return [
                        'medicine' => $detail->medicine?->name ?? 'Medicamento eliminado',
                        'barcode' => $detail->medicine?->barcode,
                        'quantity' => $quantity,
                        'unit_price' => number_format($unitPrice, 2, '.', ''),
                        'subtotal' => number_format((float) $detail->subtotal, 2, '.', ''),
                        'tax_amount' => number_format((float) $detail->tax_amount, 2, '.', ''),
                        'is_price_overridden' => (bool) $detail->is_price_overridden,
                    ];
                })->values();

                return [
                    'id' => $sale->id,
                    'created_at' => $sale->created_at?->format('Y-m-d H:i:s'),
                    'employee_name' => $sale->user?->name,
                    'branch_name' => $sale->branch?->name,
                    'subtotal' => number_format((float) $sale->subtotal, 2, '.', ''),
                    'total_tax' => number_format((float) $sale->total_tax, 2, '.', ''),
                    'total' => number_format((float) $sale->total, 2, '.', ''),
                    'items_count' => $sale->details->sum('quantity'),
                    'lines' => $lines,
                ];
            });

        return Inertia::render('sales/history', [
            'sales' => $sales,
            'dailySales' => $dailySales,
            'filters' => [
                'search' => $search,
                'from' => $from,
                'to' => $to,
            ],
        ]);
    }

    public function store(StoreQuickSaleRequest $request): RedirectResponse
    {
        $user = $request->user();
        $branchId = $user?->branch_id;
        $createdSaleId = null;

        if ($user === null || $branchId === null) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No se pudo identificar la sucursal del empleado.',
            ]);
        }

        $validated = $request->validated();
        $items = $validated['items'];
        $subtotal = 0.0;
        $totalTax = 0.0;
        $total = 0.0;
        $saleLines = [];

        try {
            DB::transaction(function () use (&$subtotal, &$totalTax, &$total, &$saleLines, &$createdSaleId, $items, $user, $branchId): void {
                foreach ($items as $item) {
                    $medicine = Medicine::query()->findOrFail((int) $item['medicine_id']);
                    $inventory = Inventory::query()
                        ->where('branch_id', $branchId)
                        ->where('medicine_id', $medicine->id)
                        ->lockForUpdate()
                        ->first();

                    if ($inventory === null) {
                        throw new RuntimeException("El medicamento {$medicine->name} no tiene stock en la sucursal actual.");
                    }

                    $quantity = (int) $item['quantity'];
                    $grossUnitPrice = (float) $item['unit_price'];
                    $taxRate = (float) ($medicine->tax_rate ?? 0.00);
                    $baseUnitPrice = $grossUnitPrice / (1 + $taxRate);
                    $lineSubtotal = round($baseUnitPrice * $quantity, 2);
                    $lineTaxAmount = round(($grossUnitPrice - $baseUnitPrice) * $quantity, 2);

                    if ($inventory->current_stock < $quantity) {
                        throw new RuntimeException("Stock insuficiente para {$medicine->name}.");
                    }

                    $saleLines[] = [
                        'medicine_id' => $medicine->id,
                        'quantity' => $quantity,
                        'unit_price' => round($grossUnitPrice, 2),
                        'subtotal' => $lineSubtotal,
                        'tax_amount' => $lineTaxAmount,
                        'is_price_overridden' => (bool) ($item['is_price_overridden'] ?? false),
                    ];

                    $subtotal += $lineSubtotal;
                    $totalTax += $lineTaxAmount;

                    $inventory->update([
                        'current_stock' => $inventory->current_stock - $quantity,
                    ]);
                }

                $subtotal = round($subtotal, 2);
                $totalTax = round($totalTax, 2);
                $total = round($subtotal + $totalTax, 2);

                $sale = Sale::query()->create([
                    'user_id' => $user->id,
                    'branch_id' => $branchId,
                    'subtotal' => $subtotal,
                    'total_tax' => $totalTax,
                    'total' => $total,
                ]);

                $createdSaleId = $sale->id;

                foreach ($saleLines as $saleLine) {
                    $sale->details()->create($saleLine);
                }
            });
        } catch (RuntimeException $exception) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => $exception->getMessage(),
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No se pudo registrar la venta.',
            ]);
        }

        return to_route('sales.quick')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Venta registrada correctamente.',
            ])
            ->with('ticket', [
                'sale_id' => $createdSaleId,
                'preview_url' => route('sales.ticket', ['sale' => $createdSaleId]),
                'print_url' => route('sales.ticket', ['sale' => $createdSaleId, 'print' => 1]),
                'download_url' => route('sales.ticket', ['sale' => $createdSaleId, 'download' => 1]),
            ]);
    }

    public function ticket(Request $request, Sale $sale): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if (($user->role ?? null) !== 'admin' && $user->branch_id !== $sale->branch_id) {
            abort(403);
        }

        $sale->load([
            'user:id,name',
            'branch:id,name,address',
            'details.medicine:id,name,barcode',
        ]);

        $pdf = Pdf::loadView('pdf.sales-ticket', [
            'sale' => $sale,
            'generatedAt' => now()->format('Y-m-d H:i:s'),
        ])->setPaper('letter');

        $filename = sprintf('ticket-venta-%d.pdf', $sale->id);

        if ($request->boolean('download')) {
            return $pdf->download($filename);
        }

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('inline; filename="%s"', $filename),
        ]);
    }

    private function medicinePayload(object $medicine, float|string|null $salePrice = null): array
    {
        return [
            'id' => $medicine->id,
            'name' => $medicine->name,
            'barcode' => $medicine->barcode,
            'category' => $medicine->category?->name,
            'description' => $medicine->description,
            'tax_rate' => number_format((float) ($medicine->tax_rate ?? 0), 2, '.', ''),
            'sale_price' => number_format((float) ($salePrice ?? 0), 2, '.', ''),
            'image_path' => $medicine->image_path,
            'active_ingredients' => $medicine->activeIngredients->pluck('name')->values(),
        ];
    }
}
