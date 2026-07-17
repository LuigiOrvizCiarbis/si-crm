<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AutomationRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'automation_rule_id' => $this->automation_rule_id,
            'rule_version' => $this->rule_version,
            'status' => $this->status->value,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'recurrence_number' => $this->recurrence_number,
            'context' => $this->context,
            'result' => $this->result,
            'error' => $this->error,
            'scheduled_for' => $this->scheduled_for?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'finished_at' => $this->finished_at?->toIso8601String(),
            'attempts' => $this->attempts,
            'action_runs' => $this->whenLoaded('actionRuns', fn () => $this->actionRuns->map(fn ($item) => [
                'id' => $item->id,
                'position' => $item->position,
                'status' => $item->status->value,
                'attempts' => $item->attempts,
                'delivery_key' => $item->delivery_key,
                'delivery_started_at' => $item->delivery_started_at?->toIso8601String(),
                'delivery_confirmed_at' => $item->delivery_confirmed_at?->toIso8601String(),
                'result' => $item->result,
                'error' => $item->error,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
