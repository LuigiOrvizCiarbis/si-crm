<?php

namespace App\Observers;

use App\Enums\AutomationRuleStatus;
use App\Jobs\EvaluateAutomationEventJob;
use App\Models\AutomationRule;
use App\Models\Contact;
use Illuminate\Support\Str;

class ContactAutomationObserver
{
    public bool $afterCommit = true;

    public function created(Contact $contact): void
    {
        $this->dispatch($contact, 'contact.created', [], $contact->getAttributes());
    }

    public function updated(Contact $contact): void
    {
        $changes = array_diff_key($contact->getChanges(), array_flip(['updated_at']));
        if ($changes === []) {
            return;
        }
        $old = array_intersect_key($contact->getOriginal(), $changes);
        $this->dispatch($contact, 'contact.field_changed', $old, $changes);
    }

    private function dispatch(Contact $contact, string $type, array $old, array $new): void
    {
        $hasRules = AutomationRule::withoutGlobalScopes()
            ->where('tenant_id', $contact->tenant_id)
            ->where('status', AutomationRuleStatus::Active)
            ->where(function ($query) use ($type): void {
                $query->where('trigger_type', $type)
                    ->orWhere(fn ($dateQuery) => $dateQuery->where('trigger_type', 'date.reached')->where('trigger_config->subject', 'contact'));
            })
            ->exists();
        if (! $hasRules) {
            return;
        }

        EvaluateAutomationEventJob::dispatch($contact->tenant_id, [
            'id' => (string) Str::uuid(),
            'type' => $type,
            'subject_type' => 'contact',
            'subject_id' => $contact->id,
            'changed_fields' => array_keys($new),
            'old' => $old,
            'new' => $new,
            'occurred_at' => now()->toIso8601String(),
        ])->afterCommit();
    }
}
