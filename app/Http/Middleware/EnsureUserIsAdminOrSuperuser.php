<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdminOrSuperuser
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->user()?->role;

        if ($role !== 'admin' && $role !== 'superuser') {
            abort(403, 'Admin or superuser access required.');
        }

        return $next($request);
    }
}
