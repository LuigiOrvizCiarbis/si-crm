<?php

namespace App\Models;

use App\Enums\TemplateCategory;
use App\Enums\TemplateStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppTemplate extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $table = 'whatsapp_templates';

    protected $fillable = [
        'tenant_id',
        'whatsapp_config_id',
        'external_id',
        'name',
        'language',
        'category',
        'status',
        'components',
        'synced_at',
    ];

    protected $casts = [
        'components' => 'array',
        'status' => TemplateStatus::class,
        'category' => TemplateCategory::class,
        'synced_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con WhatsAppConfig
     */
    public function whatsappConfig(): BelongsTo
    {
        return $this->belongsTo(WhatsAppConfig::class);
    }

    /**
     * Scope para templates aprobados
     */
    public function scopeApproved($query)
    {
        return $query->where('status', TemplateStatus::Approved);
    }
}
