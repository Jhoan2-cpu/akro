<?php

declare(strict_types=1);

namespace App\Concerns;

use Illuminate\Validation\Rule;

trait MedicineValidationRules
{
    protected function categoryRules(): array
    {
        return ['required', 'integer', 'exists:categories,id'];
    }

    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    protected function barcodeRules(?int $ignoreMedicineId = null): array
    {
        $uniqueRule = Rule::unique('medicines', 'barcode');

        if ($ignoreMedicineId !== null) {
            $uniqueRule->ignore($ignoreMedicineId);
        }

        return ['required', 'string', 'max:255', $uniqueRule];
    }

    protected function descriptionRules(): array
    {
        return ['nullable', 'string', 'max:500'];
    }

    protected function imageRules(): array
    {
        return ['nullable', 'image', 'max:5120'];
    }

    protected function activeIngredientIdsRules(): array
    {
        return ['nullable', 'array'];
    }

    protected function activeIngredientItemRules(): array
    {
        return ['integer', 'exists:active_ingredients,id'];
    }

    protected function stocksRules(): array
    {
        return ['required', 'array', 'min:1'];
    }

    protected function stockBranchRules(): array
    {
        return ['required', 'integer', 'distinct', 'exists:branches,id'];
    }

    protected function stockCurrentRules(): array
    {
        return ['required', 'integer', 'min:0'];
    }

    protected function stockMinimumRules(): array
    {
        return ['required', 'integer', 'min:0'];
    }

    protected function stockExpirationRules(): array
    {
        return ['required', 'date'];
    }
}