<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\JsonResponse;

class TaskController extends Controller
{
    private const EAGER_LOAD = [
        'assignedUser:id,name,email',
        'contact:id,name,phone,email,source',
        'conversation:id,contact_id,channel_id,last_message_content,last_message_at',
        'conversation.channel:id,name,type',
        'opportunity:id,title,status,value',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Task::query()
            ->with(self::EAGER_LOAD)
            ->orderByRaw('deadline IS NULL')
            ->orderBy('deadline')
            ->orderByDesc('updated_at');

        $this->applyVisibility($query, $request);
        $this->applyFilters($query, $request);

        $tasks = $query->paginate((int) $request->query('per_page', 100));

        return response()->json([
            'data' => $tasks->items(),
            'meta' => [
                'total' => $tasks->total(),
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules($request));

        $task = Task::create($this->payload($validated));
        $task->load(self::EAGER_LOAD);

        return response()->json(['data' => $task], 201);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request, $task);

        return response()->json(['data' => $task->load(self::EAGER_LOAD)]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request, $task);

        $validated = $request->validate($this->rules($request, $task));
        $task->fill($this->payload($validated, true));

        if (($validated['status'] ?? null) === TaskStatus::DONE->value && ! $task->completed_at) {
            $task->completed_at = now();
        }

        if (array_key_exists('status', $validated) && $validated['status'] !== TaskStatus::DONE->value) {
            $task->completed_at = $validated['completed_at'] ?? null;
        }

        $task->save();
        $task->load(self::EAGER_LOAD);

        return response()->json(['data' => $task]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request, $task);

        $task->delete();

        return response()->json(['message' => 'Tarea eliminada']);
    }

    private function applyVisibility(Builder $query, Request $request): void
    {
        $user = $request->user();

        if ($user->role === UserRole::EMPLOYEE) {
            $query->where(function (Builder $builder) use ($user): void {
                $builder->whereNull('assigned_to')
                    ->orWhere('assigned_to', $user->id);
            });
        }
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        foreach (['status', 'priority', 'type'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        if ($request->filled('assigned_to')) {
            $request->query('assigned_to') === 'none'
                ? $query->whereNull('assigned_to')
                : $query->where('assigned_to', $request->integer('assigned_to'));
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->integer('contact_id'));
        }

        if ($request->filled('conversation_id')) {
            $query->where('conversation_id', $request->integer('conversation_id'));
        }

        if ($request->filled('opportunity_id')) {
            $query->where('opportunity_id', $request->integer('opportunity_id'));
        }
    }

    private function rules(Request $request, ?Task $task = null): array
    {
        $tenantId = $request->user()->tenant_id;
        $required = $task ? ['sometimes'] : ['required'];

        return [
            'name' => [...$required, 'string', 'max:255'],
            'status' => [$task ? 'sometimes' : 'nullable', Rule::enum(TaskStatus::class)],
            'priority' => [$task ? 'sometimes' : 'nullable', Rule::enum(TaskPriority::class)],
            'type' => [$task ? 'sometimes' : 'nullable', Rule::enum(TaskType::class)],
            'deadline' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId))],
            'contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId))],
            'conversation_id' => ['nullable', 'integer', Rule::exists('conversations', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId))],
            'opportunity_id' => ['nullable', 'integer', Rule::exists('opportunities', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId))],
            'reminders' => ['nullable', 'array'],
            'recurrence' => ['nullable', 'string', 'max:255'],
            'depends_on' => ['nullable', 'array'],
            'checklist' => ['nullable', 'array'],
            'attachments' => ['nullable', 'array'],
            'synced_calendars' => ['nullable', 'array'],
            'completed_at' => ['nullable', 'date'],
        ];
    }

    private function payload(array $validated, bool $partial = false): array
    {
        $defaults = $partial ? [] : [
            'status' => TaskStatus::NEW->value,
            'priority' => TaskPriority::MEDIUM->value,
            'type' => TaskType::FOLLOW_UP->value,
            'reminders' => [],
            'depends_on' => [],
            'checklist' => [],
            'attachments' => [],
            'synced_calendars' => [],
        ];

        $payload = array_merge($defaults, $validated);

        if (($payload['status'] ?? null) === TaskStatus::DONE->value && ! array_key_exists('completed_at', $payload)) {
            $payload['completed_at'] = now();
        }

        return $payload;
    }

    private function authorizeTaskAccess(Request $request, Task $task): void
    {
        $user = $request->user();

        if ($user->role === UserRole::EMPLOYEE && $task->assigned_to !== null && (int) $task->assigned_to !== (int) $user->id) {
            abort(404);
        }
    }
}
