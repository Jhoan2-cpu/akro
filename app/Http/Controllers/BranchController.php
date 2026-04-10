<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Branches\StoreBranchRequest;
use App\Http\Requests\Branches\UpdateBranchRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    /**
     * Display a listing of the branches.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $branches = Branch::query()
            ->when($search !== '', fn($q) => $q->where('name', 'ilike', "%{$search}%")
                ->orWhere('address', 'ilike', "%{$search}%"))
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Store a newly created branch in storage.
     */
    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Branch::query()->create([
            'name' => $validated['name'],
            'address' => $validated['address'],
        ]);

        return to_route('branches.index')->with('toast', [
            'type' => 'success',
            'message' => 'Sucursal registrada correctamente.',
        ]);
    }

    /**
     * Update the specified branch in storage.
     */
    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $validated = $request->validated();

        $branch->update([
            'name' => $validated['name'],
            'address' => $validated['address'],
        ]);

        return to_route('branches.index')->with('toast', [
            'type' => 'success',
            'message' => 'Sucursal actualizada correctamente.',
        ]);
    }

    /**
     * Remove the specified branch from storage.
     */
    public function destroy(Branch $branch): RedirectResponse
    {
        $branch->delete();

        return to_route('branches.index')->with('toast', [
            'type' => 'success',
            'message' => 'Sucursal eliminada correctamente.',
        ]);
    }
}
