<?php

declare(strict_types=1);

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

trait UserValidationRules
{
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    protected function branchRules(): array
    {
        return ['required', 'integer', Rule::exists('branches', 'id')];
    }

    protected function roleRules(): array
    {
        return ['required', Rule::in(['admin', 'employee'])];
    }

    protected function statusRules(): array
    {
        return ['required', Rule::in(['active', 'inactive', 'suspended'])];
    }

    protected function passwordRules(bool $required = false): array
    {
        return array_filter([
            $required ? 'required' : 'nullable',
            'string',
            Password::default(),
            'confirmed',
        ]);
    }
}