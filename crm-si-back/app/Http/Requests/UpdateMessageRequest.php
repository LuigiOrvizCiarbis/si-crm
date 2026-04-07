<?php

namespace App\Http\Requests;

use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Enums\SenderType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $message = $this->route('message');

        return $message
            && $message->sender_type === SenderType::USER
            && $message->sender_id === $this->user()->id
            && $message->direction === MessageDirection::OUTBOUND
            && $message->message_type === MessageType::Text
            && $message->tenant_id === $this->user()->tenant_id;
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
