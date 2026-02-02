<?php

namespace App\Observers;

use App\Models\Message;

class MessageObserver
{
    public function created(Message $message): void
    {
        // Solo actualizar si es mensaje de texto
        if ($message->type === 'text') {
            $this->updateConversationLastMessage($message);
        }
    }

    public function updated(Message $message): void
    {
        // Solo actualizar si es mensaje de texto y es el más reciente
        if ($message->type === 'text') {
            $latestMessage = $message->conversation->messages()
                ->where('type', 'text')
                ->latest()
                ->first();

            if ($latestMessage && $latestMessage->id === $message->id) {
                $this->updateConversationLastMessage($message);
            }
        }
    }

    private function updateConversationLastMessage(Message $message): void
    {
        $message->conversation->update([
            'last_message_at' => $message->created_at,
            'last_message_content' => $message->content,
        ]);
    }
}
