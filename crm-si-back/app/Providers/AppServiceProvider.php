<?php

namespace App\Providers;

use App\Models\Message;
use App\Enums\UserRole;
use App\Models\User;
use App\Observers\MessageObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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

        Gate::define('viewPulse', function (User $user) {
            return $user->role === UserRole::ADMIN;
        });
    }
}
