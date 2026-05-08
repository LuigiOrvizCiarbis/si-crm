<?php

namespace App\Models\Concerns;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasTags
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')
            ->withPivot(['tenant_id', 'assigned_by'])
            ->withTimestamps()
            ->orderBy('name');
    }

    public function scopeWithTagSlugs($query, array $slugs)
    {
        $slugs = array_values(array_filter($slugs));

        if ($slugs === []) {
            return $query;
        }

        return $query->whereHas('tags', fn ($tagQuery) => $tagQuery->whereIn('slug', $slugs));
    }
}
