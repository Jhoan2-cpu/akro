<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Categories\StoreInlineCategoryRequest;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function storeInline(StoreInlineCategoryRequest $request): JsonResponse
    {
        $name = trim((string) $request->validated('name'));

        $category = Category::query()
            ->whereRaw('LOWER(name) = LOWER(?)', [$name])
            ->first();

        $created = false;

        if ($category === null) {
            $category = Category::query()->create([
                'name' => $name,
                'description' => null,
            ]);

            $created = true;
        }

        return response()->json([
            'item' => [
                'id' => $category->id,
                'name' => $category->name,
            ],
            'created' => $created,
        ], $created ? 201 : 200);
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $categories = Category::query()
            ->withCount('medicines')
            ->when($search !== '', function (Builder $builder) use ($search): void {
                $builder->where(function (Builder $searchBuilder) use ($search): void {
                    $searchBuilder
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('description', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('categories/index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Category::query()->create([
            'name' => trim((string) $validated['name']),
            'description' => isset($validated['description'])
                ? trim((string) $validated['description'])
                : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Categoría registrada correctamente.',
        ]);

        return to_route('categories.index');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        $category->update([
            'name' => trim((string) $validated['name']),
            'description' => isset($validated['description'])
                ? trim((string) $validated['description'])
                : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Categoría actualizada correctamente.',
        ]);

        return to_route('categories.index');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $medicinesCount = $category->medicines()->count();

        if ($medicinesCount > 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "No se puede eliminar la categoría porque está asignada a {$medicinesCount} medicamento(s).",
            ]);

            return back();
        }

        $category->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Categoría eliminada correctamente.',
        ]);

        return to_route('categories.index');
    }
}
