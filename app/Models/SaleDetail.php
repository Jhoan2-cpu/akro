<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sale_id', 'medicine_id', 'quantity', 'unit_price', 'subtotal', 'tax_amount', 'is_price_overridden'])]
class SaleDetail extends Model
{
    /** @use HasFactory<\Database\Factories\SaleDetailFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'is_price_overridden' => 'boolean',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
