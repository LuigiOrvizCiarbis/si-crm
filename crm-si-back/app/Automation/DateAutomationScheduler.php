<?php

namespace App\Automation;

use App\Enums\AutomationRunStatus;
use App\Models\AutomationRule;
use App\Models\Contact;
use App\Models\Conversation;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class DateAutomationScheduler
{
    public function scheduleRule(AutomationRule $rule): void
    {
        $subject = $rule->trigger_config['subject'] ?? 'contact';
        $model = $subject === 'conversation' ? Conversation::class : Contact::class;
        $model::withoutGlobalScopes()->where('tenant_id', $rule->tenant_id)->select(['id', 'tenant_id', 'created_at', 'updated_at', ...($subject === 'contact' ? ['custom_data'] : [])])
            ->chunkById(250, fn ($subjects) => $subjects->each(fn (Model $item) => $this->scheduleSubject($rule, $item)));
    }

    public function scheduleSubject(AutomationRule $rule, Model $subject): void
    {
        $config = $rule->trigger_config;
        $target = $this->calculateTarget($rule, $subject);
        if (! $target) {
            return;
        }

        $recurrence = $config['recurrence'] ?? [];
        $enabled = (bool) ($recurrence['enabled'] ?? false);
        $maximum = $enabled ? min((int) ($recurrence['max_occurrences'] ?? 1000), 1000) : 1;
        $endsAt = ! empty($recurrence['ends_at']) ? CarbonImmutable::parse($recurrence['ends_at'], $rule->timezone)->endOfDay() : null;

        for ($occurrence = 0; $occurrence < $maximum; $occurrence++) {
            $scheduled = $target;
            if ($enabled && $occurrence > 0) {
                $scheduled = $target->{'add'.($recurrence['unit'] ?? 'days')}((int) $recurrence['every'] * $occurrence);
            }
            if ($endsAt && $scheduled->greaterThan($endsAt)) {
                break;
            }
            if ($scheduled->isPast()) {
                continue;
            }

            $dedup = hash('sha256', implode('|', [$rule->id, $rule->version, $subject->getMorphClass(), $subject->getKey(), $scheduled->utc()->toIso8601String(), $occurrence]));
            $rule->runs()->firstOrCreate(['deduplication_key' => $dedup], [
                'tenant_id' => $rule->tenant_id,
                'rule_version' => $rule->version,
                'status' => AutomationRunStatus::Scheduled,
                'subject_type' => $subject instanceof Contact ? 'contact' : 'conversation',
                'subject_id' => $subject->getKey(),
                'recurrence_number' => $occurrence,
                'scheduled_for' => $scheduled->utc(),
                'context' => ['type' => 'date.reached', 'target_date' => $scheduled->toIso8601String()],
            ]);
        }
    }

    public function calculateTarget(AutomationRule $rule, Model $subject): ?CarbonImmutable
    {
        $config = $rule->trigger_config;
        $path = preg_replace('/^(contact|conversation)\./', '', (string) ($config['field'] ?? 'created_at'));
        $rawDate = Arr::get($subject->toArray(), $path);
        if (! $rawDate) {
            return null;
        }

        try {
            $timezone = $rule->timezone ?: 'UTC';
            $base = CarbonImmutable::parse((string) $rawDate, $timezone);
            [$hour, $minute] = array_map('intval', explode(':', $config['local_time'] ?? '09:00'));
            $target = $base->setTimezone($timezone)->setTime($hour, $minute);
            $amount = max(0, (int) ($config['offset_value'] ?? 0));
            $method = ($config['offset_direction'] ?? 'after') === 'before' ? 'sub' : 'add';

            return $target->{$method.($config['offset_unit'] ?? 'days')}($amount);
        } catch (\Throwable) {
            return null;
        }
    }
}
