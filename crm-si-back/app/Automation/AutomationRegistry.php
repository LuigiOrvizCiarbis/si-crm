<?php

namespace App\Automation;

use App\Automation\Contracts\ActionHandler;
use App\Automation\Contracts\TriggerHandler;
use InvalidArgumentException;

class AutomationRegistry
{
    /** @param iterable<TriggerHandler> $triggers @param iterable<ActionHandler> $actions */
    public function __construct(private iterable $triggers, private iterable $actions) {}

    public function trigger(string $type): TriggerHandler
    {
        foreach ($this->triggers as $handler) {
            if ($handler->type() === $type) {
                return $handler;
            }
        }
        throw new InvalidArgumentException("Disparador no permitido: {$type}");
    }

    public function action(string $type): ActionHandler
    {
        foreach ($this->actions as $handler) {
            if ($handler->type() === $type) {
                return $handler;
            }
        }
        throw new InvalidArgumentException("Acción no permitida: {$type}");
    }

    public function metadata(): array
    {
        return [
            'triggers' => array_map(fn (TriggerHandler $handler) => ['type' => $handler->type(), ...$handler->metadata()], [...$this->triggers]),
            'actions' => array_map(fn (ActionHandler $handler) => ['type' => $handler->type(), ...$handler->metadata()], [...$this->actions]),
        ];
    }
}
