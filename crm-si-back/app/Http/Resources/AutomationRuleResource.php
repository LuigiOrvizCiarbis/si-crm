<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AutomationRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status->value,
            'version' => $this->version,
            'trigger_type' => $this->trigger_type,
            'trigger_config' => $this->trigger_config,
            'conditions' => $this->conditions,
            'timezone' => $this->timezone,
            'activated_at' => $this->activated_at?->toIso8601String(),
            'actions' => $this->whenLoaded('actions', fn () => $this->actions->map(fn ($action) => [
                'id' => $action->id,
                'position' => $action->position,
                'type' => $action->type,
                'config' => $action->config,
            ])),
            'runs_count' => $this->whenCounted('runs'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
