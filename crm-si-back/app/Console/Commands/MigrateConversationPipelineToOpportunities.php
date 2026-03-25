<?php

namespace App\Console\Commands;

use App\Models\Conversation;
use App\Models\Opportunity;
use Illuminate\Console\Command;

class MigrateConversationPipelineToOpportunities extends Command
{
    protected $signature = 'opportunities:migrate-conversation-pipeline {--dry-run : Show what would be migrated without writing records}';

    protected $description = 'Migrates conversation pipeline assignments into opportunities';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $existingConversationIds = Opportunity::withoutGlobalScopes()
            ->whereNotNull('conversation_id')
            ->pluck('conversation_id')
            ->flip()
            ->all();

        $total = 0;
        $created = 0;
        $skipped = 0;

        Conversation::withoutGlobalScopes()
            ->with('contact:id,name')
            ->whereNotNull('pipeline_stage_id')
            ->chunkById(500, function ($conversations) use ($dryRun, &$total, &$created, &$skipped, $existingConversationIds) {
                foreach ($conversations as $conversation) {
                    $total++;

                    if (isset($existingConversationIds[$conversation->id])) {
                        $skipped++;
                        continue;
                    }

                    if (!$dryRun) {
                        Opportunity::withoutGlobalScopes()->create([
                            'tenant_id' => $conversation->tenant_id,
                            'contact_id' => $conversation->contact_id,
                            'conversation_id' => $conversation->id,
                            'pipeline_stage_id' => $conversation->pipeline_stage_id,
                            'assigned_to' => $conversation->assigned_to,
                            'title' => 'Oportunidad - '.($conversation->contact?->name ?? 'Sin nombre'),
                            'status' => 'open',
                            'source_type' => 'conversation',
                            'last_activity_at' => $conversation->last_message_at ?? $conversation->updated_at,
                            'created_at' => $conversation->created_at,
                            'updated_at' => $conversation->updated_at,
                        ]);
                    }

                    $created++;
                }
            });

        $this->info(sprintf('Processed %d conversations. Created: %d. Skipped: %d.', $total, $created, $skipped));

        return self::SUCCESS;
    }
}
