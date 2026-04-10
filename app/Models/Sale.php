<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'branch_id', 'subtotal', 'total_tax', 'total'])]
class Sale extends Model
{
    /** @use HasFactory<\Database\Factories\SaleFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(SaleDetail::class);
    }
}
