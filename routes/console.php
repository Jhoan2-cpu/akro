<?php

use App\Actions\Alerts\SendInventoryAdminEmailAlertsAction;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('alerts:inventory-admin-email', function (SendInventoryAdminEmailAlertsAction $action): void {
    $result = $action->execute();

    $this->info(sprintf(
        'Alerts processed: %d | Mails sent: %d | Duplicates skipped: %d',
        $result['alerts'],
        $result['recipients'],
        $result['skipped_duplicates'],
    ));
})->purpose('Send low-stock and near-expiry email alerts to verified admin profile emails by branch');

Schedule::command('alerts:inventory-admin-email')
    ->dailyAt('08:00')
    ->withoutOverlapping();
