<?php

namespace App\Automation;

use App\Models\AutomationRun;
use App\Models\Contact;
use App\Models\Conversation;

class AutomationContext
{
    public function forRun(AutomationRun $run): array
    {
        $contact = null;
        $conversation = null;

        if ($run->subject_type === 'contact') {
            $contact = Contact::withoutGlobalScopes()->where('tenant_id', $run->tenant_id)
                ->with(['tags', 'conversations.channel'])->find($run->subject_id);
            $conversation = $contact?->conversations->sortByDesc('created_at')->first();
        } else {
            $conversation = Conversation::withoutGlobalScopes()->where('tenant_id', $run->tenant_id)
                ->with(['tags', 'contact', 'channel'])->find($run->subject_id);
            $contact = $conversation?->contact;
        }

        return [
            'contact' => $contact?->toArray(),
            'conversation' => $conversation?->toArray(),
            'event' => $run->context,
            'old' => $run->context['old'] ?? [],
            'new' => $run->context['new'] ?? [],
        ];
    }
}
