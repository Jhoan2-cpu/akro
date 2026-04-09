<?php

declare(strict_types=1);

namespace App\Concerns;

trait QuickSaleValidationRules
{
    /**
     * Get the validation rules for sale items.
     *
     * @return array<string, array<int, string>|string>
     */
    protected function itemsRules(): array
    {
        return ['required', 'array', 'min:1'];
    }

    /**
     * @return array<int, string>
     */
    protected function itemMedicineRules(): array
    {
        return ['required', 'integer', 'distinct', 'exists:medicines,id'];
    }

    /**
     * @return array<int, string>
     */
    protected function itemQuantityRules(): array
    {
        return ['required', 'integer', 'min:1'];
    }

    /**
     * @return array<int, string>
     */
    protected function itemUnitPriceRules(): array
    {
        return ['required', 'numeric', 'min:0.01'];
    }
}
