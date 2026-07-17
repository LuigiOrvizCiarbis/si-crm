<?php

namespace App\Enums;

enum AutomationRunStatus: string
{
    case Scheduled = 'scheduled';
    case Queued = 'queued';
    case Running = 'running';
    case Succeeded = 'succeeded';
    case Skipped = 'skipped';
    case Failed = 'failed';
    case NeedsReview = 'needs_review';
    case Cancelled = 'cancelled';

    public function isPending(): bool
    {
        return in_array($this, [self::Scheduled, self::Queued, self::Running], true);
    }
}
