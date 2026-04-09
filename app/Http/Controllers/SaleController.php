<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Sales\StoreQuickSaleRequest;
use App\Models\BranchMedicinePrice;
use App\Models\Inventory;
use App\Models\Medicine;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class SaleController extends Controller
{
    public function index(Request $request): Response
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

    public function store(StoreQuickSaleRequest $request): RedirectResponse
    {
        $user = $request->user();
        $branchId = $user?->branch_id;

        if ($user === null || $branchId === null) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No se pudo identificar la sucursal del empleado.',
            ]);
        }

        $validated = $request->validated();
        $items = $validated['items'];
        $total = 0.0;
        $saleLines = [];

        try {
            DB::transaction(function () use (&$total, &$saleLines, $items, $user, $branchId): void {
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
                    $unitPrice = (float) $item['unit_price'];

                    if ($inventory->current_stock < $quantity) {
                        throw new RuntimeException("Stock insuficiente para {$medicine->name}.");
                    }

                    $saleLines[] = [
                        'medicine_id' => $medicine->id,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                    ];

                    $total += round($quantity * $unitPrice, 2);

                    $inventory->update([
                        'current_stock' => $inventory->current_stock - $quantity,
                    ]);
                }

                $sale = Sale::query()->create([
                    'user_id' => $user->id,
                    'branch_id' => $branchId,
                    'total' => round($total, 2),
                ]);

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

        return to_route('sales.quick')->with('toast', [
            'type' => 'success',
            'message' => 'Venta registrada correctamente.',
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
            'sale_price' => number_format((float) ($salePrice ?? 0), 2, '.', ''),
            'image_path' => $medicine->image_path,
            'active_ingredients' => $medicine->activeIngredients->pluck('name')->values(),
        ];
    }
}
