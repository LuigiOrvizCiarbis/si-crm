<?php

namespace App\Automation\Contracts;

use App\Models\AutomationAction;
use App\Models\AutomationRun;

interface ActionHandler
{
    public function type(): string;

    /** @return array<string, mixed> */
    public function metadata(): array;

    /** @return array<string, array<int, string>|string> */
    public function validate(array $config, int $tenantId): array;

    /** @return array<string, mixed> */
    public function preview(AutomationAction $action, AutomationRun $run): array;

    /** @return array<string, mixed> */
    public function execute(AutomationAction $action, AutomationRun $run): array;
}
