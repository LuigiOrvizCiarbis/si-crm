<?php

namespace App\Automation;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ConditionEvaluator
{
    public function evaluate(?array $node, array $context): bool
    {
        if ($node === null || $node === []) {
            return true;
        }

        if (isset($node['conditions'])) {
            if ($node['conditions'] === []) {
                return true;
            }

            $results = array_map(fn (array $child) => $this->evaluate($child, $context), $node['conditions']);

            return strtoupper($node['operator'] ?? 'AND') === 'OR'
                ? in_array(true, $results, true)
                : ! in_array(false, $results, true);
        }

        $actual = Arr::get($context, (string) ($node['field'] ?? ''));
        $expected = $node['value'] ?? null;

        return match ($node['operator'] ?? 'equals') {
            'equals' => $this->normalize($actual) === $this->normalize($expected),
            'not_equals' => $this->normalize($actual) !== $this->normalize($expected),
            'greater_than' => $this->compare($actual, $expected) > 0,
            'greater_or_equal' => $this->compare($actual, $expected) >= 0,
            'less_than' => $this->compare($actual, $expected) < 0,
            'less_or_equal' => $this->compare($actual, $expected) <= 0,
            'empty' => $actual === null || $actual === '' || $actual === [],
            'not_empty' => ! ($actual === null || $actual === '' || $actual === []),
            'contains' => is_array($actual) ? in_array($expected, $actual, true) : Str::contains(mb_strtolower((string) $actual), mb_strtolower((string) $expected)),
            'in' => in_array($this->normalize($actual), array_map($this->normalize(...), (array) $expected), true),
            'has_tag' => collect((array) $actual)->contains(fn ($tag) => (string) (is_array($tag) ? ($tag['id'] ?? $tag['slug'] ?? '') : $tag) === (string) $expected),
            'stage_is' => (string) $actual === (string) $expected,
            default => false,
        };
    }

    private function normalize(mixed $value): mixed
    {
        if (is_bool($value) || $value === null || is_array($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (string) $value;
        }

        return mb_strtolower(trim((string) $value));
    }

    private function compare(mixed $actual, mixed $expected): int
    {
        if (is_numeric($actual) && is_numeric($expected)) {
            return (float) $actual <=> (float) $expected;
        }
        $actualTime = is_string($actual) ? strtotime($actual) : false;
        $expectedTime = is_string($expected) ? strtotime($expected) : false;
        if ($actualTime !== false && $expectedTime !== false) {
            return $actualTime <=> $expectedTime;
        }

        return strcmp((string) $actual, (string) $expected);
    }
}
