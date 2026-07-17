<?php

namespace Tests\Feature;

use App\Automation\AutomationEngine;
use App\Automation\DateAutomationScheduler;
use App\Enums\AutomationRuleStatus;
use App\Enums\AutomationRunStatus;
use App\Enums\ChannelType;
use App\Enums\SenderType;
use App\Enums\TemplateCategory;
use App\Enums\TemplateStatus;
use App\Enums\UserRole;
use App\Jobs\EvaluateAutomationEventJob;
use App\Models\AutomationRule;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WhatsAppConfig;
use App\Models\WhatsAppTemplate;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AutomationEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_permissions_and_foreign_tenant_references_are_enforced(): void
    {
        [$owner, $channel, $template] = $this->context();
        [$otherOwner, $otherChannel, $otherTemplate] = $this->context();
        $member = User::factory()->create(['tenant_id' => $owner->tenant_id, 'role' => UserRole::EMPLOYEE]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($owner->tenant_id);
        $member->assignRole('Member');

        Sanctum::actingAs($member);
        $this->getJson('/api/automations')->assertForbidden();

        Sanctum::actingAs($owner);
        $this->postJson('/api/automations', $this->payload($otherChannel->id, $otherTemplate->id))->assertUnprocessable();
        $this->postJson('/api/automations', $this->payload($channel->id, $template->id))
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_legacy_timezone_aliases_are_canonicalized_before_validation(): void
    {
        [$owner, $channel, $template] = $this->context();
        Sanctum::actingAs($owner);

        $this->postJson('/api/automations', [...$this->payload($channel->id, $template->id), 'timezone' => 'America/Buenos_Aires'])
            ->assertCreated()
            ->assertJsonPath('data.timezone', 'America/Argentina/Buenos_Aires');

        $this->postJson('/api/automations', [...$this->payload($channel->id, $template->id), 'timezone' => 'Not/AZone'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('timezone');
    }

    public function test_event_evaluation_is_deduplicated_for_concurrent_delivery(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Ada', 'phone' => '5491112345678', 'source' => 'manual']);
        $rule = $this->activeRule($owner, $channel, $template);
        Queue::fake();
        $event = ['id' => (string) Str::uuid(), 'type' => 'contact.created', 'subject_type' => 'contact', 'subject_id' => $contact->id, 'changed_fields' => [], 'old' => [], 'new' => []];

        app()->call([new EvaluateAutomationEventJob($owner->tenant_id, $event), 'handle']);
        app()->call([new EvaluateAutomationEventJob($owner->tenant_id, $event), 'handle']);

        $this->assertSame(1, $rule->runs()->count());
    }

    public function test_date_rules_only_schedule_current_or_future_bounded_occurrences(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Grace', 'phone' => '5491111111111', 'source' => 'manual', 'custom_data' => ['renewal' => now()->addDay()->toDateString()]]);
        $rule = $this->activeRule($owner, $channel, $template, 'date.reached', [
            'subject' => 'contact', 'field' => 'custom_data.renewal', 'offset_value' => 0,
            'offset_unit' => 'days', 'offset_direction' => 'after', 'local_time' => '09:00',
            'recurrence' => ['enabled' => true, 'every' => 1, 'unit' => 'weeks', 'max_occurrences' => 3],
        ]);

        app(DateAutomationScheduler::class)->scheduleSubject($rule, $contact);

        $this->assertSame(3, $rule->runs()->where('status', AutomationRunStatus::Scheduled)->count());
        $this->assertSame(3, $rule->runs()->distinct('deduplication_key')->count('deduplication_key'));
    }

    public function test_whatsapp_action_creates_conversation_and_persists_system_sender(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Lin', 'phone' => '5491122222222', 'source' => 'manual']);
        $rule = $this->activeRule($owner, $channel, $template);
        $run = $rule->runs()->create([
            'tenant_id' => $owner->tenant_id, 'rule_version' => $rule->version, 'status' => AutomationRunStatus::Queued,
            'subject_type' => 'contact', 'subject_id' => $contact->id, 'event_id' => Str::uuid(),
            'deduplication_key' => hash('sha256', Str::uuid()), 'context' => ['old' => [], 'new' => []],
        ]);
        Http::fake(['https://graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.automation']]], 200)]);

        app(AutomationEngine::class)->execute($run);

        $this->assertDatabaseHas('messages', ['tenant_id' => $owner->tenant_id, 'sender_type' => SenderType::SYSTEM->value, 'sender_id' => null, 'external_id' => 'wamid.automation']);
        $this->assertDatabaseHas('conversations', ['tenant_id' => $owner->tenant_id, 'contact_id' => $contact->id, 'channel_id' => $channel->id]);
        $this->assertSame(AutomationRunStatus::Succeeded, $run->fresh()->status);
    }

    public function test_timeout_after_meta_call_is_marked_for_review_without_automatic_retry(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Timeout', 'phone' => '5491133333333', 'source' => 'manual']);
        $rule = $this->activeRule($owner, $channel, $template);
        $run = $this->queuedRun($rule, $contact);
        Http::fake(['https://graph.facebook.com/*' => Http::failedConnection()]);

        app(AutomationEngine::class)->execute($run);

        $this->assertSame(AutomationRunStatus::NeedsReview, $run->fresh()->status);
        $this->assertSame(AutomationRunStatus::NeedsReview, $run->actionRuns()->first()->status);
    }

    public function test_delivery_intent_is_persisted_before_the_external_action(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Intent', 'phone' => '5491133333334', 'source' => 'manual']);
        $rule = $this->activeRule($owner, $channel, $template);
        $run = $this->queuedRun($rule, $contact);
        $expectedKey = hash('sha256', "automation-action:{$run->deduplication_key}:{$rule->actions->first()->id}");

        Http::fake(function () use ($run, $expectedKey) {
            $actionRun = $run->actionRuns()->first();

            $this->assertNotNull($actionRun);
            $this->assertSame(AutomationRunStatus::Running, $actionRun->status);
            $this->assertSame($expectedKey, $actionRun->delivery_key);
            $this->assertNotNull($actionRun->delivery_started_at);
            $this->assertNull($actionRun->delivery_confirmed_at);

            return Http::response(['messages' => [['id' => 'wamid.intent']]], 200);
        });

        app(AutomationEngine::class)->execute($run);

        $actionRun = $run->actionRuns()->first();
        $this->assertSame(AutomationRunStatus::Succeeded, $actionRun->status);
        $this->assertNotNull($actionRun->delivery_confirmed_at);
    }

    public function test_redelivery_does_not_repeat_an_unconfirmed_external_action(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Redelivery', 'phone' => '5491133333335', 'source' => 'manual']);
        $rule = $this->activeRule($owner, $channel, $template);
        $run = $this->queuedRun($rule, $contact);
        $action = $rule->actions->first();
        $run->actionRuns()->create([
            'automation_action_id' => $action->id,
            'position' => $action->position,
            'status' => AutomationRunStatus::Running,
            'attempts' => 1,
            'delivery_key' => hash('sha256', "automation-action:{$run->deduplication_key}:{$action->id}"),
            'delivery_started_at' => now()->subMinute(),
            'input' => $action->config,
        ]);
        Http::fake();

        app(AutomationEngine::class)->execute($run);

        $this->assertSame(AutomationRunStatus::NeedsReview, $run->fresh()->status);
        $this->assertSame('delivery_outcome_unknown', $run->fresh()->error);
        $this->assertSame(AutomationRunStatus::NeedsReview, $run->actionRuns()->first()->status);
        Http::assertNothingSent();
    }

    public function test_retry_continues_from_first_unconfirmed_action(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'Retry', 'phone' => '5491144444444', 'source' => 'manual']);
        $rule = $this->activeRule($owner, $channel, $template);
        $rule->actions()->create(['position' => 1, 'type' => 'whatsapp_template', 'config' => $rule->actions->first()->config]);
        $run = $this->queuedRun($rule, $contact);
        Http::fakeSequence()
            ->push(['messages' => [['id' => 'wamid.first']]], 200)
            ->push(['error' => ['message' => 'invalid request']], 400)
            ->push(['messages' => [['id' => 'wamid.second']]], 200);

        app(AutomationEngine::class)->execute($run);
        $this->assertSame(AutomationRunStatus::Failed, $run->fresh()->status);
        $run->update(['status' => AutomationRunStatus::Queued, 'finished_at' => null]);
        app(AutomationEngine::class)->execute($run->fresh());

        $this->assertSame(AutomationRunStatus::Succeeded, $run->fresh()->status);
        $this->assertDatabaseCount('messages', 2);
        Http::assertSentCount(3);
    }

    public function test_missing_phone_skips_action_with_an_auditable_reason(): void
    {
        [$owner, $channel, $template] = $this->context();
        $contact = Contact::create(['tenant_id' => $owner->tenant_id, 'name' => 'No phone', 'source' => 'manual']);
        $run = $this->queuedRun($this->activeRule($owner, $channel, $template), $contact);
        Http::fake();

        app(AutomationEngine::class)->execute($run);

        $this->assertSame(AutomationRunStatus::Skipped, $run->fresh()->status);
        $this->assertSame('contact_phone_missing', $run->fresh()->error);
        Http::assertNothingSent();
    }

    private function payload(int $channelId, int $templateId): array
    {
        return [
            'name' => 'Bienvenida', 'trigger_type' => 'contact.created', 'trigger_config' => [], 'conditions' => null, 'timezone' => 'America/Argentina/Buenos_Aires',
            'actions' => [['type' => 'whatsapp_template', 'config' => ['channel_id' => $channelId, 'template_id' => $templateId, 'parameters' => [['name' => 'nombre', 'source' => 'field', 'path' => 'contact.name']]]]],
        ];
    }

    private function activeRule(User $owner, Channel $channel, WhatsAppTemplate $template, string $trigger = 'contact.created', array $config = []): AutomationRule
    {
        $rule = AutomationRule::create(['tenant_id' => $owner->tenant_id, 'created_by' => $owner->id, 'name' => 'Rule', 'status' => AutomationRuleStatus::Active, 'trigger_type' => $trigger, 'trigger_config' => $config, 'timezone' => 'America/Argentina/Buenos_Aires', 'activated_at' => now()]);
        $rule->actions()->create(['position' => 0, 'type' => 'whatsapp_template', 'config' => ['channel_id' => $channel->id, 'template_id' => $template->id, 'parameters' => [['name' => 'nombre', 'source' => 'field', 'path' => 'contact.name']]]]);

        return $rule->load('actions');
    }

    private function queuedRun(AutomationRule $rule, Contact $contact)
    {
        return $rule->runs()->create([
            'tenant_id' => $rule->tenant_id,
            'rule_version' => $rule->version,
            'status' => AutomationRunStatus::Queued,
            'subject_type' => 'contact',
            'subject_id' => $contact->id,
            'event_id' => Str::uuid(),
            'deduplication_key' => hash('sha256', Str::uuid()),
            'context' => ['old' => [], 'new' => []],
        ]);
    }

    /** @return array{User, Channel, WhatsAppTemplate} */
    private function context(): array
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $registrar->forgetCachedPermissions();
        $tenant = Tenant::create(['name' => 'Tenant '.Str::random(8), 'timezone' => 'America/Argentina/Buenos_Aires']);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);
        $owner = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::ADMIN]);
        $owner->assignRole('Owner');
        $config = WhatsAppConfig::create(['phone_number_id' => Str::random(12), 'display_phone_number' => '+541100000000', 'waba_id' => Str::random(10), 'bussines_token' => Crypt::encryptString('token')]);
        $channel = Channel::create(['tenant_id' => $tenant->id, 'user_id' => $owner->id, 'type' => ChannelType::WHATSAPP, 'name' => 'WhatsApp', 'status' => 'active', 'whatsapp_config_id' => $config->id]);
        $template = WhatsAppTemplate::create(['tenant_id' => $tenant->id, 'whatsapp_config_id' => $config->id, 'external_id' => Str::uuid(), 'name' => 'hello', 'language' => 'es_AR', 'category' => TemplateCategory::Utility, 'status' => TemplateStatus::Approved, 'components' => [['type' => 'BODY', 'text' => 'Hola {{nombre}}']]]);

        return [$owner, $channel, $template];
    }
}
