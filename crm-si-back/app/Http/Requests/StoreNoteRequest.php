<?php

namespace App\Http\Requests;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $this->canViewRelation($user, Contact::class, 'contact_id')
            && $this->canViewRelation($user, Conversation::class, 'conversation_id');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'body' => ['required', 'string', 'max:5000'],
            'contact_id' => [
                'nullable',
                'required_without:conversation_id',
                'integer',
                Rule::exists('contacts', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'conversation_id' => [
                'nullable',
                'required_without:contact_id',
                'integer',
                Rule::exists('conversations', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
        ];
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function canViewRelation(User $user, string $modelClass, string $input): bool
    {
        if (! $this->filled($input) || filter_var($this->input($input), FILTER_VALIDATE_INT) === false) {
            return true;
        }

        $model = $modelClass::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $user->tenant_id)
            ->find($this->integer($input));

        return $model === null || $user->can('view', $model);
    }
}
