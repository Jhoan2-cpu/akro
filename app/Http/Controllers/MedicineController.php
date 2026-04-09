<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Cloudinary\Api\Upload\UploadApi;
use App\Http\Requests\Medicines\StoreMedicineRequest;
use App\Http\Requests\Medicines\UpdateMedicineRequest;
use App\Models\ActiveIngredient;
use App\Models\BranchMedicinePrice;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Medicine;
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
        $query = trim((string) $request->input('query', ''));
        $medicine = null;
        $inventories = [];

        if ($query !== '') {
            $medicine = Medicine::query()
                ->with(['category', 'activeIngredients'])
                ->where(function (Builder $builder) use ($query): void {
                    $builder
                        ->where('barcode', $query)
                        ->orWhere('name', 'ilike', "%{$query}%");
                })
                ->first();

            if ($medicine !== null) {
                $inventories = $medicine->inventories()
                    ->with('branch')
                    ->orderBy('branch_id')
                    ->get()
                    ->map(function (Inventory $inventory): array {
                        $daysToExpire = Carbon::today()->diffInDays($inventory->expiration_date, false);

                        return [
                            'branch_name' => $inventory->branch?->name,
                            'current_stock' => $inventory->current_stock,
                            'minimum_stock' => $inventory->minimum_stock,
                            'expiration_date' => (string) $inventory->expiration_date,
                            'is_low_stock' => $inventory->current_stock <= $inventory->minimum_stock,
                            'is_near_expiry' => $daysToExpire >= 0 && $daysToExpire < 30,
                            'is_out_of_stock' => $inventory->current_stock === 0,
                        ];
                    })
                    ->values()
                    ->all();
            }
        }

        return Inertia::render('medicines/stock', [
            'query' => $query,
            'medicine' => $medicine ? [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'barcode' => $medicine->barcode,
                'category' => $medicine->category?->name,
                'description' => $medicine->description,
                'image_path' => $medicine->image_path,
                'active_ingredients' => $medicine->activeIngredients->pluck('name')->values(),
            ] : null,
            'inventories' => $inventories,
            'notFound' => $query !== '' && $medicine === null,
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
                'warning' => 'El medicamento se guardó, pero la imagen no pudo subirse.',
            ];
        }
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