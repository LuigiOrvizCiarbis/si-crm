<?php

namespace App\Providers;

use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Invitation;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\PipelineStage;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use App\Models\WhatsAppTemplate;
use App\Observers\MessageObserver;
use App\Policies\ChannelPolicy;
use App\Policies\ContactPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\InvitationPolicy;
use App\Policies\MessagePolicy;
use App\Policies\OpportunityPolicy;
use App\Policies\PipelineStagePolicy;
use App\Policies\RolePolicy;
use App\Policies\TagPolicy;
use App\Policies\TaskPolicy;
use App\Policies\UserPolicy;
use App\Policies\WhatsAppTemplatePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Message::observe(MessageObserver::class);

        Gate::policy(Channel::class, ChannelPolicy::class);
        Gate::policy(Contact::class, ContactPolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(Invitation::class, InvitationPolicy::class);
        Gate::policy(Message::class, MessagePolicy::class);
        Gate::policy(Opportunity::class, OpportunityPolicy::class);
        Gate::policy(PipelineStage::class, PipelineStagePolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(WhatsAppTemplate::class, WhatsAppTemplatePolicy::class);

        // Owner bypasses every gate within their tenant.
        //
        // The bypass is keyed by tenants.owner_role_id, not by role name. This
        // lets workspaces rename the seeded "Owner" role (e.g. "Dueño") without
        // losing the bypass. We must keep the bypass scoped to the owner's
        // tenant; otherwise an Owner could touch tenant-scoped resources (e.g.
        // Spatie roles, which are not covered by the BelongsToTenant global
        // scope) that belong to other tenants simply by guessing their primary
        // key.
        Gate::before(function (?User $user, string $ability, array $arguments = []) {
            if ($user === null) {
                return null;
            }

            $ownerRoleId = $user->tenant?->owner_role_id;
            if ($ownerRoleId === null) {
                return null;
            }

            $hasOwnerRole = $user->roles()
                ->where('roles.id', $ownerRoleId)
                ->where('roles.tenant_id', $user->tenant_id)
                ->exists();
            if (! $hasOwnerRole) {
                return null;
            }

            foreach ($arguments as $argument) {
                if (is_object($argument) && property_exists($argument, 'tenant_id') === false && ! isset($argument->tenant_id)) {
                    continue;
                }

                if (is_object($argument) && isset($argument->tenant_id) && (int) $argument->tenant_id !== (int) $user->tenant_id) {
                    return null;
                }
            }

            // Hard guard: even an Owner cannot rename or delete the Owner role
            // itself. Returning false here short-circuits the gate; without it,
            // the bypass above would let the action through.
            if (in_array($ability, ['update', 'delete', 'syncPermissions'], true)) {
                foreach ($arguments as $argument) {
                    if ($argument instanceof Role && (int) $argument->id === (int) $ownerRoleId) {
                        return false;
                    }
                }
            }

            return true;
        });

        Gate::define('viewPulse', function (?User $user) {
            if (app()->environment('local')) {
                return true;
            }

            $key = config('app.pulse_key');

            if ($key && request()->query('key') === $key) {
                session()->put('pulse_authorized', true);
            }

            return session()->get('pulse_authorized', false);
        });
    }
}
