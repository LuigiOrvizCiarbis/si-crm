<?php

namespace App\Automation\Handlers;

use App\Automation\Contracts\TriggerHandler;
use App\Models\AutomationRule;

class EventTriggerHandler implements TriggerHandler
{
    public function __construct(private string $identifier, private string $label, private string $subject, private bool $fieldConfig = false) {}

    public function type(): string
    {
        return $this->identifier;
    }

    public function metadata(): array
    {
        return ['label' => $this->label, 'subject' => $this->subject, 'kind' => 'event', 'config_fields' => $this->fieldConfig ? ['field'] : []];
    }

    public function validate(array $config): array
    {
        if ($this->fieldConfig && empty($config['field'])) {
            return ['field' => ['El campo es obligatorio para este disparador.']];
        }

        return [];
    }

    public function matches(AutomationRule $rule, array $event): bool
    {
        if (($event['type'] ?? null) !== $this->identifier || ($event['subject_type'] ?? null) !== $this->subject) {
            return false;
        }

        $configuredField = $rule->trigger_config['field'] ?? null;

        if (! $configuredField) {
            return true;
        }
        if (in_array($configuredField, $event['changed_fields'] ?? [], true)) {
            return true;
        }

        return str_starts_with($configuredField, 'custom_data.')
            && in_array('custom_data', $event['changed_fields'] ?? [], true);
    }
}
