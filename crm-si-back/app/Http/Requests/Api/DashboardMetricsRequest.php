<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DashboardMetricsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'periodo' => ['nullable', 'string', Rule::in(['hoy', 'esta-semana', 'este-mes', 'este-trimestre', 'este-ano'])],
            'canal' => ['nullable'],
            'owner' => ['nullable'],
        ];
    }

    public function periodo(): string
    {
        return (string) ($this->validated('periodo') ?? 'este-mes');
    }

    public function canalId(): ?int
    {
        $canal = $this->validated('canal');

        if ($canal === null || $canal === '' || $canal === 'todos' || $canal === 'all') {
            return null;
        }

        return is_numeric($canal) ? (int) $canal : null;
    }

    public function ownerId(): ?int
    {
        $owner = $this->validated('owner');

        if ($owner === null || $owner === '' || $owner === 'todos' || $owner === 'all' || $owner === 'dueno') {
            return null;
        }

        return is_numeric($owner) ? (int) $owner : null;
    }
}
