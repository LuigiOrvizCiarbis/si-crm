<?php

namespace App\Automation\Handlers;

use App\Automation\AutomationContext;
use App\Automation\Contracts\ActionHandler;
use App\Automation\Exceptions\ActionSkippedException;
use App\Automation\Exceptions\AmbiguousDeliveryException;
use App\Automation\Exceptions\RetryableActionException;
use App\Enums\ChannelType;
use App\Models\AutomationAction;
use App\Models\AutomationRun;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\PipelineStage;
use App\Models\WhatsAppTemplate;
use App\Services\WhatsAppTemplateService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\RateLimiter;

class WhatsAppTemplateActionHandler implements ActionHandler
{
    public function __construct(private AutomationContext $context, private WhatsAppTemplateService $templates) {}

    public function type(): string
    {
        return 'whatsapp_template';
    }

    public function metadata(): array
    {
        return [
            'label' => 'Enviar template de WhatsApp',
            'config_fields' => ['channel_id', 'template_id', 'parameters'],
            'parameter_sources' => ['literal', 'field'],
        ];
    }

    public function validate(array $config, int $tenantId): array
    {
        $errors = [];
        $channel = Channel::withoutGlobalScopes()->where('tenant_id', $tenantId)->find($config['channel_id'] ?? null);
        if (! $channel || $channel->type !== ChannelType::WHATSAPP) {
            $errors['channel_id'][] = 'Seleccioná un canal de WhatsApp del espacio.';
        }

        $template = WhatsAppTemplate::withoutGlobalScopes()->where('tenant_id', $tenantId)->find($config['template_id'] ?? null);
        if (! $template) {
            $errors['template_id'][] = 'Seleccioná un template del espacio.';
        }
        if ($channel && $template && $channel->whatsapp_config_id !== $template->whatsapp_config_id) {
            $errors['template_id'][] = 'El template no pertenece a la cuenta del canal.';
        }

        foreach ($config['parameters'] ?? [] as $index => $parameter) {
            if (! in_array($parameter['source'] ?? null, ['literal', 'field'], true)) {
                $errors["parameters.{$index}.source"][] = 'La fuente no es válida.';
            }
            if (($parameter['source'] ?? null) === 'field' && empty($parameter['path'])) {
                $errors["parameters.{$index}.path"][] = 'La ruta del campo es obligatoria.';
            }
        }

        return $errors;
    }

    public function preview(AutomationAction $action, AutomationRun $run): array
    {
        [$channel, $template] = $this->resolveConfiguration($action, $run);
        $contact = $this->contact($run);
        $conversation = Conversation::where('contact_id', $contact->id)->where('channel_id', $channel->id)->first();

        return [
            'channel' => ['id' => $channel->id, 'name' => $channel->name, 'status' => $channel->status],
            'template' => ['id' => $template->id, 'name' => $template->name, 'status' => $template->status->value],
            'conversation' => $conversation ? ['id' => $conversation->id, 'will_create' => false] : ['id' => null, 'will_create' => true],
            'parameters' => $this->renderParameters($action, $run),
        ];
    }

    public function execute(AutomationAction $action, AutomationRun $run): array
    {
        [$channel, $template] = $this->resolveConfiguration($action, $run);
        $contact = $this->contact($run);
        if (! $contact->phone) {
            throw new ActionSkippedException('contact_phone_missing');
        }
        if (! $channel->isActive()) {
            throw new ActionSkippedException('channel_inactive');
        }
        if (! $template->isApproved()) {
            throw new ActionSkippedException('template_not_approved');
        }
        if ($channel->branch_id && $contact->branch_id && $channel->branch_id !== $contact->branch_id) {
            throw new ActionSkippedException('incompatible_branch');
        }

        $conversation = Conversation::firstOrCreate(
            ['tenant_id' => $run->tenant_id, 'contact_id' => $contact->id, 'channel_id' => $channel->id],
            [
                'status' => 'open',
                'branch_id' => $contact->branch_id ?? $channel->branch_id,
                'pipeline_stage_id' => PipelineStage::where('tenant_id', $run->tenant_id)->orderByDesc('is_default')->orderBy('sort_order')->value('id'),
                'ai_autoreply_enabled' => (bool) $channel->whatsappConfig?->ai_autoreply_default,
            ],
        );

        $components = $this->renderParameters($action, $run);
        $rateKey = "automation-whatsapp:{$channel->whatsapp_config_id}";
        if (! RateLimiter::attempt($rateKey, 80, fn () => true, 60)) {
            throw new RetryableActionException('whatsapp_rate_limit');
        }

        try {
            $message = $this->templates->sendSystemTemplateMessage($conversation, $template, $components);
        } catch (ConnectionException $exception) {
            throw new AmbiguousDeliveryException('meta_timeout_after_send', previous: $exception);
        } catch (\RuntimeException $exception) {
            if (str_contains($exception->getMessage(), '429') || preg_match('/\b5\d\d\b/', $exception->getMessage())) {
                throw new RetryableActionException($exception->getMessage(), previous: $exception);
            }
            throw $exception;
        }

        return ['message_id' => $message->id, 'external_id' => $message->external_id, 'conversation_id' => $conversation->id];
    }

    private function resolveConfiguration(AutomationAction $action, AutomationRun $run): array
    {
        $channel = Channel::withoutGlobalScopes()->where('tenant_id', $run->tenant_id)->with('whatsappConfig')->find($action->config['channel_id'] ?? null);
        $template = WhatsAppTemplate::withoutGlobalScopes()->where('tenant_id', $run->tenant_id)->find($action->config['template_id'] ?? null);
        if (! $channel || $channel->type !== ChannelType::WHATSAPP) {
            throw new ActionSkippedException('channel_not_found');
        }
        if (! $template || $template->whatsapp_config_id !== $channel->whatsapp_config_id) {
            throw new ActionSkippedException('template_not_found');
        }

        return [$channel, $template];
    }

    private function contact(AutomationRun $run)
    {
        $context = $this->context->forRun($run);
        $contactId = Arr::get($context, 'contact.id');
        $contact = Contact::withoutGlobalScopes()->where('tenant_id', $run->tenant_id)->find($contactId);
        if (! $contact) {
            throw new ActionSkippedException('contact_not_found');
        }

        return $contact;
    }

    private function renderParameters(AutomationAction $action, AutomationRun $run): array
    {
        $context = $this->context->forRun($run);
        $grouped = [];
        foreach ($action->config['parameters'] ?? [] as $parameter) {
            $value = ($parameter['source'] ?? null) === 'literal'
                ? ($parameter['value'] ?? null)
                : Arr::get($context, (string) ($parameter['path'] ?? ''));
            if ($value === null || $value === '') {
                $value = $parameter['fallback'] ?? null;
            }
            if ($value === null || $value === '') {
                throw new ActionSkippedException('missing_parameter:'.($parameter['name'] ?? $parameter['path'] ?? 'unknown'));
            }

            $component = strtolower($parameter['component'] ?? 'body');
            $rendered = ['type' => 'text', 'text' => (string) $value];
            if (! empty($parameter['name'])) {
                $rendered['parameter_name'] = $parameter['name'];
            }
            $grouped[$component][] = $rendered;
        }

        return array_map(fn (array $parameters, string $type) => ['type' => $type, 'parameters' => $parameters], $grouped, array_keys($grouped));
    }
}
