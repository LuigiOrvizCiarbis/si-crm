<?php

namespace App\Observers;

use App\Enums\AutomationRuleStatus;
use App\Jobs\EvaluateAutomationEventJob;
use App\Models\AutomationRule;
use App\Models\Conversation;
use Illuminate\Support\Str;

class ConversationAutomationObserver
{
    public bool $afterCommit = true;

    public function created(Conversation $conversation): void
    {
        $this->dispatch($conversation, 'conversation.created', [], $conversation->getAttributes());
    }

    public function updated(Conversation $conversation): void
    {
        $changes = array_diff_key($conversation->getChanges(), array_flip(['updated_at', 'last_message_at', 'last_message_content']));
        $old = array_intersect_key($conversation->getOriginal(), $changes);
        if (array_key_exists('pipeline_stage_id', $changes)) {
            $this->dispatch($conversation, 'conversation.stage_changed', $old, $changes);
        }
        if (array_key_exists('status', $changes)) {
            $this->dispatch($conversation, 'conversation.status_changed', $old, $changes);
        }
    }

    private function dispatch(Conversation $conversation, string $type, array $old, array $new): void
    {
        $hasRules = AutomationRule::withoutGlobalScopes()
            ->where('tenant_id', $conversation->tenant_id)
            ->where('status', AutomationRuleStatus::Active)
            ->where(function ($query) use ($type): void {
                $query->where('trigger_type', $type)
                    ->orWhere(fn ($dateQuery) => $dateQuery->where('trigger_type', 'date.reached')->where('trigger_config->subject', 'conversation'));
            })
            ->exists();
        if (! $hasRules) {
            return;
        }

        EvaluateAutomationEventJob::dispatch($conversation->tenant_id, [
            'id' => (string) Str::uuid(),
            'type' => $type,
            'subject_type' => 'conversation',
            'subject_id' => $conversation->id,
            'changed_fields' => array_keys($new),
            'old' => $old,
            'new' => $new,
            'occurred_at' => now()->toIso8601String(),
        ])->afterCommit();
    }
}
