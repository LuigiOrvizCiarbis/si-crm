<?php

namespace Tests\Unit;

use App\Automation\ConditionEvaluator;
use PHPUnit\Framework\TestCase;

class AutomationConditionEvaluatorTest extends TestCase
{
    public function test_it_evaluates_nested_typed_and_or_groups(): void
    {
        $tree = [
            'operator' => 'AND',
            'conditions' => [
                ['field' => 'contact.custom_data.score', 'operator' => 'greater_or_equal', 'value' => 80],
                [
                    'operator' => 'OR',
                    'conditions' => [
                        ['field' => 'conversation.status', 'operator' => 'equals', 'value' => 'open'],
                        ['field' => 'contact.tags', 'operator' => 'has_tag', 'value' => 7],
                    ],
                ],
            ],
        ];

        $matches = app(ConditionEvaluator::class)->evaluate($tree, [
            'contact' => ['custom_data' => ['score' => 91], 'tags' => []],
            'conversation' => ['status' => 'open'],
        ]);

        $this->assertTrue($matches);
    }

    public function test_it_supports_empty_contains_and_previous_event_values(): void
    {
        $evaluator = new ConditionEvaluator;
        $this->assertTrue($evaluator->evaluate(['field' => 'contact.email', 'operator' => 'empty'], ['contact' => ['email' => null]]));
        $this->assertTrue($evaluator->evaluate(['field' => 'contact.name', 'operator' => 'contains', 'value' => 'gar'], ['contact' => ['name' => 'Edgar']]));
        $this->assertTrue($evaluator->evaluate(['field' => 'old.status', 'operator' => 'not_equals', 'value' => 'open'], ['old' => ['status' => 'closed']]));
    }
}
