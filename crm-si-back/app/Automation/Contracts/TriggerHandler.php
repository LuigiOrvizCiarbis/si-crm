<?php

namespace App\Automation\Contracts;

use App\Models\AutomationRule;

interface TriggerHandler
{
    public function type(): string;

    /** @return array<string, mixed> */
    public function metadata(): array;

    /** @return array<string, array<int, string>|string> */
    public function validate(array $config): array;

    /** @param array<string, mixed> $event */
    public function matches(AutomationRule $rule, array $event): bool;
}
