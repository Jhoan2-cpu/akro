<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ActiveIngredients\StoreInlineActiveIngredientRequest;
use App\Models\ActiveIngredient;
use Illuminate\Http\JsonResponse;

class ActiveIngredientController extends Controller
{
    public function storeInline(StoreInlineActiveIngredientRequest $request): JsonResponse
    {
        $name = trim((string) $request->validated('name'));

        $activeIngredient = ActiveIngredient::query()
            ->whereRaw('LOWER(name) = LOWER(?)', [$name])
            ->first();

        $created = false;

        if ($activeIngredient === null) {
            $activeIngredient = ActiveIngredient::query()->create([
                'name' => $name,
            ]);

            $created = true;
        }

        return response()->json([
            'item' => [
                'id' => $activeIngredient->id,
                'name' => $activeIngredient->name,
            ],
            'created' => $created,
        ], $created ? 201 : 200);
    }
}
