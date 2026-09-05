<?php

namespace App\Jobs;

use App\Http\Controllers\TimeEntryController;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SyncFreedcampTimeEntries
{
    use Dispatchable;

    public function __construct(
        public int $userId,
        public bool $fullHistory = false,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
    ) {}

    public function handle(): void
    {
        Auth::loginUsingId($this->userId);
        updateSetting('freedcamp_sync_status', 'running', $this->userId);

        $request = Request::create('/hr/time-entries/sync-freedcamp', 'POST', [
            'sync_all' => $this->fullHistory,
            'run_now' => true,
            'date_from' => $this->dateFrom,
            'date_to' => $this->dateTo,
        ]);
        $request->setLaravelSession(app('session')->driver());

        app(TimeEntryController::class)->syncFreedcamp($request);
        $error = session('error');
        updateSetting('freedcamp_sync_status', $error ? 'failed' : 'completed', $this->userId);
        updateSetting('freedcamp_sync_message', $error ?: session('success'), $this->userId);
        updateSetting('freedcamp_last_synced_at', now()->toIso8601String(), $this->userId);
    }
}
