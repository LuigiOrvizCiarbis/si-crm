<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Message;
use Illuminate\Http\JsonResponse;

class ContactHistoryController extends Controller
{
    /**
     * Get complete message history for a contact across all conversations and channels
     */
    public function show(Contact $contact): JsonResponse
    {
        // Get all conversations for this contact
        $conversations = $contact->conversations()
            ->with(['channel'])
            ->get();

        // Get all messages from all conversations, grouped by channel
        $historyByChannel = [];

        foreach ($conversations as $conversation) {
            $channelType = $conversation->channel->type->name; // e.g., 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK'
            $channelName = $conversation->channel->name;
            $channelId = $conversation->channel->id;

            if (!isset($historyByChannel[$channelId])) {
                $historyByChannel[$channelId] = [
                    'channel_id' => $channelId,
                    'channel_name' => $channelName,
                    'channel_type' => $channelType,
                    'messages' => [],
                    'message_count' => 0,
                ];
            }

            $messages = Message::where('conversation_id', $conversation->id)
                ->orderBy('delivered_at', 'asc')
                ->get();

            if ($messages->isNotEmpty()) {
                foreach ($messages as $message) {
                    $historyByChannel[$channelId]['messages'][] = [
                        'id' => $message->id,
                        'content' => $message->content,
                        'direction' => $message->direction->name,
                        'sender_type' => $message->sender_type->name,
                        'delivered_at' => $message->delivered_at,
                        'read_at' => $message->read_at,
                        'created_at' => $message->created_at,
                        'conversation_id' => $conversation->id,
                    ];
                }

                $historyByChannel[$channelId]['message_count'] += $messages->count();
            }
        }

        // Sort messages within each channel by delivered_at
        foreach ($historyByChannel as &$channel) {
            usort($channel['messages'], function ($a, $b) {
                return strtotime($a['delivered_at']) <=> strtotime($b['delivered_at']);
            });
        }

        // Convert to array and sort by message count (most active channels first)
        $historyByChannel = array_values($historyByChannel);
        usort($historyByChannel, function ($a, $b) {
            return $b['message_count'] <=> $a['message_count'];
        });

        return response()->json([
            'contact' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'phone' => $contact->phone,
                'email' => $contact->email,
            ],
            'total_conversations' => $conversations->count(),
            'total_messages' => array_sum(array_column($historyByChannel, 'message_count')),
            'history_by_channel' => $historyByChannel,
        ]);
    }
}
