<?php

declare(strict_types=1);

namespace App\Http\Requests\Medicines;

use App\Concerns\MedicineValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicineRequest extends FormRequest
{
    use MedicineValidationRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $medicineId = (int) $this->route('medicine')->id;

        return [
            'category_id' => $this->categoryRules(),
            'name' => $this->nameRules(),
            'barcode' => $this->barcodeRules($medicineId),
            'description' => $this->descriptionRules(),
            'image' => $this->imageRules(),
            'active_ingredient_ids' => $this->activeIngredientIdsRules(),
            'active_ingredient_ids.*' => $this->activeIngredientItemRules(),
            'stocks' => $this->stocksRules(),
            'stocks.*.branch_id' => $this->stockBranchRules(),
            'stocks.*.current_stock' => $this->stockCurrentRules(),
            'stocks.*.minimum_stock' => $this->stockMinimumRules(),
            'stocks.*.expiration_date' => $this->stockExpirationRules(),
        ];
    }
}