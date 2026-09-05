<?php

use App\Jobs\SyncFreedcampTimeEntries;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    $dateTo = Carbon::now()->toDateString();
    $dateFrom = Carbon::now()->subDays(30)->toDateString();

    Setting::where('key', 'freedcamp_api_key')->pluck('user_id')->each(function (int $userId) use ($dateFrom, $dateTo) {
        (new SyncFreedcampTimeEntries($userId, false, $dateFrom, $dateTo))->handle();
    });
})->everyThirtyMinutes();
