<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ContactTimelineController extends Controller
{
    private const ALL_TYPES = ['note', 'task', 'message', 'stage'];

    /**
     * Aggregate a chronological activity feed for a contact: notes, tasks,
     * message milestones and opportunity/stage events, ordered newest first.
     */
    public function show(Request $request, Contact $contact): JsonResponse
    {
        $this->authorize('view', $contact);

        $types = $this->requestedTypes($request);

        $events = collect();

        if (in_array('note', $types, true)) {
            $events = $events->merge($this->noteEvents($contact));
        }

        if (in_array('task', $types, true)) {
            $events = $events->merge($this->taskEvents($contact, $request));
        }

        if (in_array('message', $types, true)) {
            $events = $events->merge($this->messageEvents($contact));
        }

        if (in_array('stage', $types, true)) {
            $events = $events->merge($this->stageEvents($contact));
        }

        $data = $events
            ->sortByDesc(fn (array $event) => $event['occurred_at'])
            ->values()
            ->all();

        return response()->json(['data' => $data]);
    }

    /**
     * @return list<string>
     */
    private function requestedTypes(Request $request): array
    {
        $raw = trim((string) $request->query('types', ''));

        if ($raw === '') {
            return self::ALL_TYPES;
        }

        $requested = array_filter(array_map('trim', explode(',', $raw)));
        $valid = array_values(array_intersect(self::ALL_TYPES, $requested));

        return $valid === [] ? self::ALL_TYPES : $valid;
    }

    private function noteEvents(Contact $contact): Collection
    {
        return $contact->notes()
            ->with('author:id,name,email')
            ->get()
            ->map(fn ($note) => [
                'type' => 'note',
                'id' => "note-{$note->id}",
                'occurred_at' => $note->created_at?->toIso8601String(),
                'body' => $note->body,
                'author' => $note->author?->name,
            ]);
    }

    private function taskEvents(Contact $contact, Request $request): Collection
    {
        $conversationIds = $contact->conversations()->pluck('id')->all();

        return Task::query()
            ->visibleTo($request->user())
            ->where('tenant_id', $contact->tenant_id)
            ->where(function ($query) use ($contact, $conversationIds) {
                $query->where('contact_id', $contact->id)
                    ->orWhereIn('conversation_id', $conversationIds);
            })
            ->with('assignedUser:id,name')
            ->get()
            ->map(fn ($task) => [
                'type' => 'task',
                'id' => "task-{$task->id}",
                'occurred_at' => $task->created_at?->toIso8601String(),
                'name' => $task->name,
                'task_type' => $task->type?->value,
                'status' => $task->status?->value,
                'deadline' => $task->deadline?->toIso8601String(),
                'assignee' => $task->assignedUser?->name,
            ]);
    }

    private function messageEvents(Contact $contact): Collection
    {
        $conversations = $contact->conversations()->with('channel:id,name,type')->get();

        return $conversations->flatMap(function ($conversation) {
            $first = Message::query()
                ->where('conversation_id', $conversation->id)
                ->orderBy('created_at')
                ->orderBy('id')
                ->first();

            $last = Message::query()
                ->where('conversation_id', $conversation->id)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->first();

            $milestones = collect([$first, $last])
                ->filter()
                ->unique('id');

            return $milestones->map(fn (Message $message) => [
                'type' => 'message',
                'id' => "message-{$message->id}",
                'occurred_at' => $message->created_at?->toIso8601String(),
                'direction' => $message->direction?->value,
                'content' => $message->conversationPreviewContent(),
                'channel' => $conversation->channel?->name,
            ]);
        });
    }

    private function stageEvents(Contact $contact): Collection
    {
        return $contact->opportunities()
            ->with('pipelineStage:id,name')
            ->get()
            ->map(fn ($opportunity) => [
                'type' => 'stage',
                'id' => "opportunity-{$opportunity->id}",
                'occurred_at' => ($opportunity->last_activity_at ?? $opportunity->created_at)?->toIso8601String(),
                'title' => $opportunity->title,
                'stage' => $opportunity->pipelineStage?->name,
                'status' => $opportunity->status,
            ]);
    }
}
