<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSuperuser
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'superuser') {
            abort(403, 'Superuser access required.');
        }

        return $next($request);
    }
}
