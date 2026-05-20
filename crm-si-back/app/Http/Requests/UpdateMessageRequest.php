<?php

namespace App\Http\Requests;

use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Models\Message;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $message = $this->route('message');

        if (! $message instanceof Message) {
            return false;
        }

        // Only outbound text messages from this tenant are editable. These are
        // technical constraints (not authorization), so we still enforce them
        // here before delegating to the policy.
        if ($message->tenant_id !== $this->user()->tenant_id) {
            return false;
        }

        if ($message->direction !== MessageDirection::OUTBOUND) {
            return false;
        }

        if ($message->message_type !== MessageType::Text) {
            return false;
        }

        // Defer the actual permission check to MessagePolicy so the
        // messages.update_any permission is honored.
        return $this->user()->can('update', $message);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:4096'],
        ];
    }
}
