<?php

declare(strict_types=1);

namespace App\Concerns;

trait BranchValidationRules
{
    /**
     * Get name validation rules
     *
     * @return array<string, string|object>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'min:3', 'max:100'];
    }

    /**
     * Get address validation rules
     *
     * @return array<string, string|object>
     */
    protected function addressRules(): array
    {
        return ['required', 'string', 'min:5', 'max:255'];
    }
}
