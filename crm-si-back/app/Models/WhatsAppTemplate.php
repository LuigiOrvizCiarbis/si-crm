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
        'rejected_reason',
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

    public function isApproved(): bool
    {
        return $this->status === TemplateStatus::Approved;
    }

    /**
     * Parámetros que el body del template exige, en orden de aparición.
     *
     * Meta admite dos estilos de variable, mutuamente excluyentes por template:
     * nombradas ({{cliente}}) o posicionales ({{1}}). Para las nombradas se
     * devuelve el nombre; para las posicionales, el índice como string ("1").
     * Es la fuente de verdad tanto para validar la acción como para prellenar
     * el formulario, así ambos lados cuentan lo mismo que después cuenta Meta.
     *
     * @return list<string>
     */
    public function expectedBodyParameters(): array
    {
        $body = collect($this->components ?? [])
            ->first(fn ($component) => strtoupper($component['type'] ?? '') === 'BODY');

        if (! $body || empty($body['text'])) {
            return [];
        }

        preg_match_all('/\{\{\s*([^}]+?)\s*\}\}/', (string) $body['text'], $matches);

        return array_values(array_unique($matches[1]));
    }

    /**
     * Formato del header cuando es de media (DOCUMENT/IMAGE/VIDEO), o null si el
     * template no tiene header o es de texto. Un header de media exige un
     * parámetro extra al enviar: la URL del archivo que Meta va a adjuntar.
     */
    public function headerMediaFormat(): ?string
    {
        $header = collect($this->components ?? [])
            ->first(fn ($component) => strtoupper($component['type'] ?? '') === 'HEADER');

        $format = strtoupper($header['format'] ?? '');

        return in_array($format, ['DOCUMENT', 'IMAGE', 'VIDEO'], true) ? $format : null;
    }
}
