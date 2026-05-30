<?php

namespace App\Http\Resources;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Contact
 */
class ContactResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'source' => $this->source,
            'branch_id' => $this->branch_id,
            'custom_data' => $this->custom_data ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'tags' => $this->whenLoaded('tags'),
            'conversations' => $this->whenLoaded('conversations', fn () => $this->conversations->map(fn ($conversation) => [
                'id' => $conversation->id,
                'last_message_at' => $conversation->last_message_at?->toIso8601String(),
                'last_message_content' => $conversation->last_message_content,
            ])),
        ];
    }
}
