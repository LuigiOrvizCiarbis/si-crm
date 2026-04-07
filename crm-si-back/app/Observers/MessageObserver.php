<?php

namespace App\Observers;

use App\Models\Message;

class MessageObserver
{
    public function created(Message $message): void
    {
        $message->conversation?->syncLastMessageSummary();
    }

    public function updated(Message $message): void
    {
        $message->conversation?->syncLastMessageSummary();
    }

    public function deleted(Message $message): void
    {
        $message->conversation?->syncLastMessageSummary();
    }

    public function restored(Message $message): void
    {
        $message->conversation?->syncLastMessageSummary();
    }
}
