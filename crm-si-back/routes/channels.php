<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversations.{conversationId}', function ($user, $conversationId) {
    return $user->tenant_id === Conversation::find($conversationId)?->tenant_id;
});

Broadcast::channel('messages.{messageId}', function (User $user, int $messageId) {
    return $user->id === Message::findOrNew($messageId)->user_id;
});
