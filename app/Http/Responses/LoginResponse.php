<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        $defaultPath = route('dashboard');
        $intendedUrl = $request->session()->pull('url.intended');
        $role = (string) ($request->user()?->role ?? '');
        $isAdminOrSuperuser = in_array($role, ['admin', 'superuser'], true);

        if (is_string($intendedUrl) && $intendedUrl !== '') {
            if (! $isAdminOrSuperuser && $this->isAdminOnlyPath($intendedUrl)) {
                return redirect()->to($defaultPath);
            }

            return redirect()->to($intendedUrl);
        }

        return redirect()->to($defaultPath);
    }

    private function isAdminOnlyPath(string $url): bool
    {
        $path = '/'.ltrim((string) parse_url($url, PHP_URL_PATH), '/');

        return Str::startsWith($path, [
            '/categories',
            '/active-ingredients',
            '/medicines',
            '/users',
            '/branches',
        ]);
    }
}