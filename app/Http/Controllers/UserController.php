<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Cloudinary\Api\Upload\UploadApi;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', 'all');
        $branchId = (string) $request->input('branch_id', 'all');

        $usersQuery = User::query()
            ->with('branch')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhereHas('branch', function ($branchQuery) use ($search): void {
                            $branchQuery->where('name', 'ilike', "%{$search}%");
                        });
                });
            })
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($branchId !== 'all', fn ($query) => $query->where('branch_id', (int) $branchId))
            ->orderBy('name');

        return Inertia::render('users/index', [
            'users' => $usersQuery->paginate(10)->withQueryString(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'branch_id' => $branchId,
            ],
            'stats' => [
                'total' => User::query()->count(),
                'active' => User::query()->where('status', 'active')->count(),
                'suspended' => User::query()->where('status', 'suspended')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/create', [
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'profile_photo_path' => $this->uploadProfilePhoto($request->file('profile_photo')),
            'branch_id' => $request->validated('branch_id'),
            'role' => $request->validated('role'),
            'status' => $request->validated('status'),
            'password' => Hash::make((string) $request->validated('password')),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Usuario creado correctamente.',
        ]);

        return to_route('users.index');
    }

    public function edit(User $user): Response|RedirectResponse
    {
        $authUser = request()->user();

        if ($authUser !== null && $authUser->role === 'admin' && $authUser->is($user)) {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'No puedes editar tu propio usuario desde Gestión de usuarios. Usa tu Perfil.',
            ]);

            return to_route('users.index');
        }

        $user->load('branch');

        return Inertia::render('users/edit', [
            'user' => $user,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $authUser = $request->user();

        if ($authUser !== null && $authUser->role === 'admin' && $authUser->is($user)) {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'No puedes editar tu propio usuario desde Gestión de usuarios. Usa tu Perfil.',
            ]);

            return to_route('users.index');
        }

        $validated = $request->validated();

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'profile_photo_path' => $this->uploadProfilePhoto($request->file('profile_photo')) ?? $user->profile_photo_path,
            'branch_id' => $validated['branch_id'],
            'role' => $validated['role'],
            'status' => $validated['status'],
        ]);

        if (! empty($validated['password'])) {
            $user->password = Hash::make((string) $validated['password']);
        }

        $user->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Usuario actualizado correctamente.',
        ]);

        if ($authUser !== null && $authUser->is($user) && $user->role !== 'admin') {
            return to_route('dashboard');
        }

        return to_route('users.index');
    }

    public function suspend(User $user): RedirectResponse
    {
        $user->update(['status' => 'suspended']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Usuario suspendido correctamente.',
        ]);

        return to_route('users.index');
    }

    protected function uploadProfilePhoto(?UploadedFile $file): ?string
    {
        if ($file === null) {
            return null;
        }

        try {
            $uploadResult = (new UploadApi())->upload($file->getRealPath(), [
                'folder' => 'users/profile-photos',
                'public_id' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'use_filename' => true,
                'unique_filename' => true,
                'overwrite' => false,
            ]);

            return $uploadResult['secure_url'] ?? $uploadResult['url'] ?? null;
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'profile_photo' => 'Unable to upload the profile photo. Please try again.',
            ]);
        }
    }
}