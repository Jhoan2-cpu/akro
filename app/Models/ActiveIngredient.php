<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name'])]
class ActiveIngredient extends Model
{
    /** @use HasFactory<\Database\Factories\ActiveIngredientFactory> */
    use HasFactory;

    public function medicines(): BelongsToMany
    {
        return $this->belongsToMany(Medicine::class)
            ->withTimestamps();
    }
}