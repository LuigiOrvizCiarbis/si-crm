<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaAsset extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'uploaded_by',
        'name',
        'path',
        'mime_type',
        'size',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * URL pública absoluta del archivo, la que Meta descarga al enviar un
     * template con header de media. Se apoya en META_PUBLIC_MEDIA_BASE_URL,
     * el mismo mecanismo que ya usan las imágenes/audio salientes; en dev local
     * requiere un túnel porque Meta no alcanza localhost.
     */
    public function publicUrl(): string
    {
        $base = config('services.facebook.public_media_base_url') ?: config('app.url');

        return rtrim((string) $base, '/').'/storage/'.$this->path;
    }
}
