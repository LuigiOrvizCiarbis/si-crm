<?php

namespace App\Providers;

use App\Models\Message;
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
