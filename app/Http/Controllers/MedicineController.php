<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Alerts\SendInventoryAdminEmailAlertsAction;
use Cloudinary\Api\Upload\UploadApi;
use App\Http\Requests\Medicines\StoreMedicineRequest;
use App\Http\Requests\Medicines\UpdateMedicineRequest;
use App\Models\ActiveIngredient;
use App\Models\BranchMedicinePrice;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Medicine;
use App\Traits\ScopeByBranchForRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class MedicineController extends Controller
{
    use ScopeByBranchForRole;

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $categoryId = (string) $request->input('category_id', 'all');
        $openCreate = filter_var($request->input('create', false), FILTER_VALIDATE_BOOLEAN);

        $query = Medicine::query()
            ->with(['category', 'activeIngredients', 'inventories'])
            ->when($search !== '', function (Builder $builder) use ($search): void {
                $builder->where(function (Builder $searchBuilder) use ($search): void {
                    $searchBuilder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('barcode', 'ilike', "%{$search}%");
                });
            })
            ->when($categoryId !== 'all', fn (Builder $builder) => $builder->where('category_id', (int) $categoryId))
            ->orderBy('name');

        // Scoping: admins/employees solo ven medicines con inventory en su sucursal
        if (!$this->isSuperuser($request)) {
            $userId = $request->user()?->id;
            $branchId = $request->user()?->branch_id;

            if ($branchId === null) {
                $query->whereRaw('1 = 0'); // Sin sucursal: no mostrar nada
            } else {
                $query->whereHas('inventories', fn (Builder $builder) => $builder->where('branch_id', $branchId));
            }
        }

        $medicines = $query->paginate(10)->withQueryString()->through(function (Medicine $medicine): array {
            $totalStock = (int) $medicine->inventories->sum('current_stock');
            $nearExpiry = $medicine->inventories->contains(function (Inventory $inventory): bool {
                $days = Carbon::today()->diffInDays($inventory->expiration_date, false);

                return $days >= 0 && $days < 30;
            });

            return [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'barcode' => $medicine->barcode,
                'category' => $medicine->category?->name,
                'description' => $medicine->description,
                'image_path' => $medicine->image_path,
                'active_ingredients' => $medicine->activeIngredients->pluck('name')->values(),
                'total_stock' => $totalStock,
                'low_stock' => $medicine->inventories->contains(fn (Inventory $inventory) => $inventory->current_stock <= $inventory->minimum_stock),
                'near_expiry' => $nearExpiry,
            ];
        });

        return Inertia::render('medicines/index', [
            'medicines' => $medicines,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'activeIngredients' => ActiveIngredient::query()->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
            ],
            'ui' => [
                'openCreateModal' => $openCreate,
            ],
        ]);
    }

    public function create(): RedirectResponse
    {
        return to_route('medicines.index', [
            'create' => '1',
        ]);
    }

    public function store(StoreMedicineRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $upload = $this->uploadMedicineImage($request->file('image'));

        if ($request->hasFile('image') && $upload['path'] === null) {
            return back()
                ->withErrors([
                    'image' => $upload['warning'] ?? 'No se pudo subir la imagen a Cloudinary.',
                ])
                ->withInput();
        }

        DB::transaction(function () use ($validated, $upload): void {
            $medicine = Medicine::query()->create([
                'category_id' => (int) $validated['category_id'],
                'name' => $validated['name'],
                'barcode' => $validated['barcode'],
                'description' => $validated['description'] ?? null,
                'image_path' => $upload['path'],
            ]);

            $medicine->activeIngredients()->sync($validated['active_ingredient_ids'] ?? []);
            $priceRows = [];

            foreach ($validated['stocks'] as $stockItem) {
                $medicine->inventories()->create([
                    'branch_id' => (int) $stockItem['branch_id'],
                    'current_stock' => (int) $stockItem['current_stock'],
                    'minimum_stock' => (int) $stockItem['minimum_stock'],
                    'expiration_date' => $stockItem['expiration_date'],
                ]);

                $priceRows[] = [
                    'branch_id' => (int) $stockItem['branch_id'],
                    'medicine_id' => $medicine->id,
                    'sale_price' => $stockItem['sale_price'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if ($priceRows !== []) {
                BranchMedicinePrice::query()->upsert(
                    $priceRows,
                    ['branch_id', 'medicine_id'],
                    ['sale_price', 'updated_at'],
                );
            }
        });

        app(SendInventoryAdminEmailAlertsAction::class)->execute();

        Inertia::flash('toast', [
            'type' => $upload['warning'] ? 'warning' : 'success',
            'message' => $upload['warning'] ?? 'Medicamento registrado correctamente.',
        ]);

        return to_route('medicines.index');
    }

    public function edit(Medicine $medicine): Response
    {
        $medicine->load(['activeIngredients', 'inventories.branch', 'branchPrices']);
        $pricesByBranch = $medicine->branchPrices->keyBy('branch_id');

        return Inertia::render('medicines/edit', [
            ...$this->baseFormPayload(),
            'medicine' => [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'barcode' => $medicine->barcode,
                'category_id' => $medicine->category_id,
                'description' => $medicine->description,
                'image_path' => $medicine->image_path,
                'active_ingredient_ids' => $medicine->activeIngredients->pluck('id')->values(),
                'stocks' => $medicine->inventories->map(function (Inventory $inventory) use ($pricesByBranch): array {
                    $salePrice = $pricesByBranch->get($inventory->branch_id)?->sale_price;

                    return [
                        'branch_id' => $inventory->branch_id,
                        'branch_name' => $inventory->branch?->name,
                        'current_stock' => $inventory->current_stock,
                        'minimum_stock' => $inventory->minimum_stock,
                        'expiration_date' => (string) $inventory->expiration_date,
                        'sale_price' => $salePrice !== null ? (string) $salePrice : '0.00',
                    ];
                })->values(),
            ],
        ]);
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine): RedirectResponse
    {
        $validated = $request->validated();
        $upload = $this->uploadMedicineImage($request->file('image'));

        if ($request->hasFile('image') && $upload['path'] === null) {
            return back()
                ->withErrors([
                    'image' => $upload['warning'] ?? 'No se pudo subir la imagen a Cloudinary.',
                ])
                ->withInput();
        }

        DB::transaction(function () use ($medicine, $validated, $upload): void {
            $previousImage = $medicine->image_path;

            $medicine->update([
                'category_id' => (int) $validated['category_id'],
                'name' => $validated['name'],
                'barcode' => $validated['barcode'],
                'description' => $validated['description'] ?? null,
                'image_path' => $upload['path'] ?? $medicine->image_path,
            ]);

            $medicine->activeIngredients()->sync($validated['active_ingredient_ids'] ?? []);
            $priceRows = [];

            foreach ($validated['stocks'] as $stockItem) {
                $medicine->inventories()->updateOrCreate(
                    [
                        'branch_id' => (int) $stockItem['branch_id'],
                    ],
                    [
                        'current_stock' => (int) $stockItem['current_stock'],
                        'minimum_stock' => (int) $stockItem['minimum_stock'],
                        'expiration_date' => $stockItem['expiration_date'],
                    ],
                );

                $priceRows[] = [
                    'branch_id' => (int) $stockItem['branch_id'],
                    'medicine_id' => $medicine->id,
                    'sale_price' => $stockItem['sale_price'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if ($priceRows !== []) {
                BranchMedicinePrice::query()->upsert(
                    $priceRows,
                    ['branch_id', 'medicine_id'],
                    ['sale_price', 'updated_at'],
                );
            }

            if ($upload['path'] !== null && $previousImage !== null && $previousImage !== $upload['path']) {
                $this->deleteMedicineImage($previousImage);
            }
        });

        app(SendInventoryAdminEmailAlertsAction::class)->execute();

        Inertia::flash('toast', [
            'type' => $upload['warning'] ? 'warning' : 'success',
            'message' => $upload['warning'] ?? 'Medicamento actualizado correctamente.',
        ]);

        return to_route('medicines.index');
    }

    public function destroy(Medicine $medicine): RedirectResponse
    {
        $medicine->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Medicamento dado de baja correctamente.',
        ]);

        return to_route('medicines.index');
    }

    public function stock(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $branchId = (string) $request->input('branch_id', 'all');
        $categoryId = (string) $request->input('category_id', 'all');
        $status = (string) $request->input('status', 'all');

        $baseQuery = Inventory::query()
            ->with(['branch:id,name', 'medicine:id,name,barcode,category_id', 'medicine.category:id,name'])
            ->when($search !== '', function (Builder $builder) use ($search): void {
                $builder->whereHas('medicine', function (Builder $medicineBuilder) use ($search): void {
                    $medicineBuilder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('barcode', 'ilike', "%{$search}%");
                });
            })
            ->when($branchId !== 'all', fn (Builder $builder) => $builder->where('branch_id', (int) $branchId))
            ->when($categoryId !== 'all', function (Builder $builder) use ($categoryId): void {
                $builder->whereHas('medicine', fn (Builder $medicineBuilder) => $medicineBuilder->where('category_id', (int) $categoryId));
            });

        $summaryQuery = clone $baseQuery;
        $today = Carbon::today();
        $nearExpiryLimit = Carbon::today()->addDays(30);

        $summary = [
            'total_records' => (clone $summaryQuery)->count(),
            'low_stock_records' => (clone $summaryQuery)->whereColumn('current_stock', '<=', 'minimum_stock')->count(),
            'out_of_stock_records' => (clone $summaryQuery)->where('current_stock', 0)->count(),
            'near_expiry_records' => (clone $summaryQuery)
                ->whereDate('expiration_date', '>=', $today)
                ->whereDate('expiration_date', '<', $nearExpiryLimit)
                ->count(),
        ];

        $stockQuery = clone $baseQuery;

        match ($status) {
            'out' => $stockQuery->where('current_stock', 0),
            'low' => $stockQuery->whereColumn('current_stock', '<=', 'minimum_stock'),
            'near-expiry' => $stockQuery
                ->whereDate('expiration_date', '>=', $today)
                ->whereDate('expiration_date', '<', $nearExpiryLimit),
            'healthy' => $stockQuery
                ->where('current_stock', '>', 0)
                ->whereColumn('current_stock', '>', 'minimum_stock')
                ->whereDate('expiration_date', '>=', $nearExpiryLimit),
            default => null,
        };

        $inventories = $stockQuery
            ->orderBy('branch_id')
            ->orderBy('medicine_id')
            ->paginate(15)
            ->withQueryString()
            ->through(function (Inventory $inventory) use ($today): array {
                $daysToExpire = $today->diffInDays($inventory->expiration_date, false);
                $isLowStock = $inventory->current_stock <= $inventory->minimum_stock;
                $isOutOfStock = $inventory->current_stock === 0;
                $isNearExpiry = $daysToExpire >= 0 && $daysToExpire < 30;

                return [
                    'id' => $inventory->id,
                    'branch_name' => $inventory->branch?->name,
                    'medicine_name' => $inventory->medicine?->name,
                    'barcode' => $inventory->medicine?->barcode,
                    'category' => $inventory->medicine?->category?->name,
                    'current_stock' => $inventory->current_stock,
                    'minimum_stock' => $inventory->minimum_stock,
                    'expiration_date' => substr((string) $inventory->expiration_date, 0, 10),
                    'days_to_expire' => $daysToExpire,
                    'is_low_stock' => $isLowStock,
                    'is_near_expiry' => $isNearExpiry,
                    'is_out_of_stock' => $isOutOfStock,
                ];
            });

        return Inertia::render('medicines/stock', [
            'inventories' => $inventories,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'branch_id' => $branchId,
                'category_id' => $categoryId,
                'status' => $status,
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * @return array{path: string|null, warning: string|null}
     */
    protected function uploadMedicineImage(?UploadedFile $file): array
    {
        if ($file === null) {
            return ['path' => null, 'warning' => null];
        }

        if (! $this->hasCloudinaryCredentials()) {
            return [
                'path' => null,
                'warning' => 'Cloudinary no está configurado correctamente. Verifica CLOUDINARY_CLOUD_NAME, CLOUDINARY_KEY y CLOUDINARY_SECRET.',
            ];
        }

        try {
            $uploadResult = (new UploadApi())->upload($file->getRealPath(), [
                'folder' => 'medicines/images',
                'public_id' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'use_filename' => true,
                'unique_filename' => true,
                'overwrite' => false,
            ]);

            return [
                'path' => $uploadResult['secure_url'] ?? $uploadResult['url'] ?? null,
                'warning' => null,
            ];
        } catch (Throwable $exception) {
            report($exception);

            return [
                'path' => null,
                'warning' => $this->buildCloudinaryUploadError($exception),
            ];
        }
    }

    protected function hasCloudinaryCredentials(): bool
    {
        return (string) config('cloudinary.cloud_name') !== ''
            && (string) config('cloudinary.key') !== ''
            && (string) config('cloudinary.secret') !== '';
    }

    protected function buildCloudinaryUploadError(Throwable $exception): string
    {
        $message = $exception->getMessage();

        if (str_contains($message, 'cURL error 60')) {
            return 'No se pudo conectar con Cloudinary por certificados SSL (cURL error 60). Configura cacert en tu PHP local.';
        }

        return 'No se pudo subir la imagen a Cloudinary. Revisa credenciales y conectividad.';
    }

    protected function deleteMedicineImage(string $imagePath): void
    {
        $publicId = $this->extractCloudinaryPublicId($imagePath);

        if ($publicId === null) {
            return;
        }

        try {
            (new UploadApi())->destroy($publicId);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    protected function extractCloudinaryPublicId(string $imagePath): ?string
    {
        if (! str_contains($imagePath, 'res.cloudinary.com')) {
            return null;
        }

        $path = parse_url($imagePath, PHP_URL_PATH);

        if (! is_string($path)) {
            return null;
        }

        $segments = array_values(array_filter(explode('/', $path)));
        $uploadIndex = array_search('upload', $segments, true);

        if ($uploadIndex === false) {
            return null;
        }

        $assetSegments = array_slice($segments, $uploadIndex + 1);

        if ($assetSegments === []) {
            return null;
        }

        if (isset($assetSegments[0]) && preg_match('/^v\d+$/', $assetSegments[0]) === 1) {
            array_shift($assetSegments);
        }

        if ($assetSegments === []) {
            return null;
        }

        $lastIndex = count($assetSegments) - 1;
        $assetSegments[$lastIndex] = pathinfo($assetSegments[$lastIndex], PATHINFO_FILENAME);

        return implode('/', $assetSegments);
    }

    /**
     * @return array{categories: \Illuminate\Database\Eloquent\Collection<int, Category>, activeIngredients: \Illuminate\Database\Eloquent\Collection<int, ActiveIngredient>, branches: \Illuminate\Database\Eloquent\Collection<int, Branch>}
     */
    protected function baseFormPayload(): array
    {
        return [
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'activeIngredients' => ActiveIngredient::query()->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ];
    }
}