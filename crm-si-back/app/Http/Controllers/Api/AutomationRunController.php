<?php

namespace App\Http\Controllers\Api;

use App\Enums\AutomationRunStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AutomationRunResource;
use App\Jobs\ExecuteAutomationRunJob;
use App\Models\AutomationRun;
use Illuminate\Http\Request;

class AutomationRunController extends Controller
{
    public function show(Request $request, AutomationRun $run): AutomationRunResource
    {
        abort_unless($request->user()?->can('automations.view'), 403);

        return new AutomationRunResource($run->load(['rule', 'actionRuns.action']));
    }

    public function retry(Request $request, AutomationRun $run): AutomationRunResource
    {
        abort_unless($request->user()?->can('automations.manage'), 403);
        abort_unless(in_array($run->status, [AutomationRunStatus::Failed, AutomationRunStatus::Skipped, AutomationRunStatus::NeedsReview], true), 422, 'La ejecución no se puede reintentar en su estado actual.');
        $run->update(['status' => AutomationRunStatus::Queued, 'queued_at' => now(), 'finished_at' => null, 'error' => null]);
        ExecuteAutomationRunJob::dispatch($run->id);

        return new AutomationRunResource($run->fresh('actionRuns'));
    }
}
