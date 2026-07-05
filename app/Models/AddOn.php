<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AddOn extends Model
{
    protected $fillable = [
        'module',
        'name',
        'label',
        'icon',
        'color',
        'monthly_price',
        'yearly_price',
        'is_enable',
    ];

    protected $casts = [
        'is_enable' => 'boolean',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2'
    ];
}
