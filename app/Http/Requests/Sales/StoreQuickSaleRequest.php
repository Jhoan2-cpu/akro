<?php

declare(strict_types=1);

namespace App\Http\Requests\Sales;

use App\Concerns\QuickSaleValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreQuickSaleRequest extends FormRequest
{
    use QuickSaleValidationRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => $this->itemsRules(),
            'items.*.medicine_id' => $this->itemMedicineRules(),
            'items.*.quantity' => $this->itemQuantityRules(),
            'items.*.unit_price' => $this->itemUnitPriceRules(),
            'items.*.is_price_overridden' => $this->itemPriceOverriddenRules(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Debe agregar al menos un medicamento a la venta.',
            'items.min' => 'Debe agregar al menos un medicamento a la venta.',
            'items.*.medicine_id.required' => 'El medicamento es obligatorio.',
            'items.*.medicine_id.exists' => 'El medicamento seleccionado no existe.',
            'items.*.medicine_id.distinct' => 'El medicamento no puede repetirse en la misma venta.',
            'items.*.quantity.required' => 'La cantidad es obligatoria.',
            'items.*.quantity.min' => 'La cantidad debe ser al menos 1.',
            'items.*.unit_price.required' => 'El precio unitario es obligatorio.',
            'items.*.unit_price.min' => 'El precio unitario debe ser mayor que cero.',
            'items.*.is_price_overridden.boolean' => 'El indicador de precio editado no es válido.',
        ];
    }
}
