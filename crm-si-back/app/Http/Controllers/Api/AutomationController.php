<?php

namespace App\Http\Controllers\Api;

use App\Automation\AutomationContext;
use App\Automation\AutomationRegistry;
use App\Automation\AutomationRuleService;
use App\Automation\ConditionEvaluator;
use App\Automation\DateAutomationScheduler;
use App\Enums\AutomationRunStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAutomationRequest;
use App\Http\Requests\UpdateAutomationRequest;
use App\Http\Resources\AutomationRuleResource;
use App\Http\Resources\AutomationRunResource;
use App\Models\AutomationRule;
use App\Models\AutomationRun;
use App\Models\Contact;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AutomationController extends Controller
{
    public function __construct(private AutomationRuleService $rules, private AutomationRegistry $registry) {}

    public function metadata(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('automations.view'), 403);

        return response()->json([
            ...$this->registry->metadata(),
            'condition_operators' => ['equals', 'not_equals', 'greater_than', 'greater_or_equal', 'less_than', 'less_or_equal', 'empty', 'not_empty', 'contains', 'in', 'has_tag', 'stage_is'],
            'statuses' => ['draft', 'active', 'paused'],
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('automations.view'), 403);

        return AutomationRuleResource::collection(AutomationRule::with('actions')->withCount('runs')->latest()->paginate(20));
    }

    public function store(StoreAutomationRequest $request): AutomationRuleResource
    {
        return new AutomationRuleResource($this->rules->create($request->validated(), $request->user()));
    }

    public function show(Request $request, AutomationRule $automation): AutomationRuleResource
    {
        abort_unless($request->user()?->can('automations.view'), 403);

        return new AutomationRuleResource($automation->load('actions')->loadCount('runs'));
    }

    public function update(UpdateAutomationRequest $request, AutomationRule $automation): AutomationRuleResource
    {
        return new AutomationRuleResource($this->rules->update($automation->load('actions'), $request->validated()));
    }

    public function destroy(Request $request, AutomationRule $automation): JsonResponse
    {
        abort_unless($request->user()?->can('automations.manage'), 403);
        abort_if($automation->status->value === 'active', 422, 'Pausá la automatización antes de eliminarla.');
        $automation->delete();

        return response()->json([], 204);
    }

    public function activate(Request $request, AutomationRule $automation): AutomationRuleResource
    {
        abort_unless($request->user()?->can('automations.manage'), 403);

        return new AutomationRuleResource($this->rules->activate($automation->load('actions')));
    }

    public function pause(Request $request, AutomationRule $automation): AutomationRuleResource
    {
        abort_unless($request->user()?->can('automations.manage'), 403);

        return new AutomationRuleResource($this->rules->pause($automation));
    }

    public function preview(Request $request, AutomationRule $automation, AutomationContext $context, ConditionEvaluator $conditions, DateAutomationScheduler $dateScheduler): JsonResponse
    {
        abort_unless($request->user()?->can('automations.view'), 403);
        $validated = $request->validate(['subject_type' => ['required', 'in:contact,conversation'], 'subject_id' => ['required', 'integer']]);
        $run = new AutomationRun([
            'tenant_id' => $automation->tenant_id,
            'automation_rule_id' => $automation->id,
            'rule_version' => $automation->version,
            'status' => AutomationRunStatus::Queued,
            'subject_type' => $validated['subject_type'],
            'subject_id' => $validated['subject_id'],
            'context' => ['type' => 'preview', 'old' => [], 'new' => []],
        ]);
        $run->setRelation('rule', $automation);
        $matches = $conditions->evaluate($automation->conditions, $context->forRun($run));
        $actions = [];
        foreach ($automation->load('actions')->actions as $action) {
            try {
                $actions[] = ['position' => $action->position, 'type' => $action->type, 'preview' => $this->registry->action($action->type)->preview($action, $run)];
            } catch (\Throwable $exception) {
                $actions[] = ['position' => $action->position, 'type' => $action->type, 'skipped' => true, 'reason' => $exception->getMessage()];
            }
        }
        $scheduledFor = null;
        if ($automation->trigger_type === 'date.reached') {
            $model = $validated['subject_type'] === 'contact' ? Contact::class : Conversation::class;
            $subject = $model::withoutGlobalScopes()->where('tenant_id', $automation->tenant_id)->find($validated['subject_id']);
            $scheduledFor = $subject ? $dateScheduler->calculateTarget($automation, $subject)?->toIso8601String() : null;
        }

        return response()->json(['matches_conditions' => $matches, 'scheduled_for' => $scheduledFor, 'actions' => $actions]);
    }

    public function runs(Request $request, AutomationRule $automation): AnonymousResourceCollection
    {
        abort_unless($request->user()?->can('automations.view'), 403);

        return AutomationRunResource::collection($automation->runs()->with('actionRuns')->latest()->paginate(25));
    }
}
