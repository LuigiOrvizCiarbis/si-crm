<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class MessageSent implements ShouldBroadcast
{
    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {

        return [
            new PrivateChannel('conversations.' . $this->message->conversation_id)
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'content' => $this->message->content,
            'direction' => $this->message->direction instanceof \BackedEnum ? $this->message->direction->value : $this->message->direction,
            'sender_type' => $this->message->sender_type instanceof \BackedEnum ? $this->message->sender_type->value : $this->message->sender_type,
            'created_at' => $this->message->created_at?->toISOString(),
        ];
    }
}
