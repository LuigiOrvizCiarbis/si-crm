<?php

use App\Models\AutomationRun;
use App\Models\WebhookDelivery;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Purga los deliveries de webhooks más viejos que la retención configurada
// (config/webhooks.php). Requiere que el scheduler corra en el deploy
// (servicio `scheduler` en docker-compose.prod.yml).
Schedule::command('model:prune', ['--model' => [WebhookDelivery::class]])->daily();
Schedule::command('automations:dispatch-due')->everyMinute()->withoutOverlapping();
Schedule::command('model:prune', ['--model' => [AutomationRun::class]])->dailyAt('02:15');
