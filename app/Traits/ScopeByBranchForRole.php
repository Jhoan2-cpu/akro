<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ScopeByBranchForRole
{
    protected function scopeQueryByUserBranch(Builder $builder, Request $request): Builder
    {
        $user = $request->user();

        // Superuser: sin restricción de sucursal
        if ($user?->role === 'superuser') {
            return $builder;
        }

        // Admin y empleados: solo datos de su sucursal
        $branchId = $user?->branch_id;

        if ($branchId === null) {
            // Sin sucursal asignada: no mostrar nada
            return $builder->whereRaw('1 = 0');
        }

        return $builder->where('branch_id', $branchId);
    }

    protected function isSuperuser(Request $request): bool
    {
        return $request->user()?->role === 'superuser';
    }

    protected function isAdminOrSuperuser(Request $request): bool
    {
        $role = $request->user()?->role;

        return $role === 'admin' || $role === 'superuser';
    }
}
