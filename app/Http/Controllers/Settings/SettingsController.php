<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\IpRestriction;
use App\Models\PaymentSetting;
use App\Models\Webhook;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the main settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Get system settings using helper function
        $systemSettings = settings();

        $paymentSettings = PaymentSetting::getUserSettings(auth()->id());
        $webhooks = Webhook::where('user_id', auth()->id())->get();
        $ipRestrictions = IpRestriction::whereIn('created_by', getCompanyAndUsersId())->orderBy('id', 'desc')->get();

        // Get Zekto settings for company users
        $zektoSettings = [];
        $zektoSettings = [
            'zkteco_api_url' => isset($systemSettings['zkteco_api_url']) ? $systemSettings['zkteco_api_url'] : '',
            'zkteco_username' => isset($systemSettings['zkteco_username']) ? $systemSettings['zkteco_username'] : '',
            'zkteco_password' => isset($systemSettings['zkteco_password']) ? $systemSettings['zkteco_password'] : '',
            'zkteco_auth_token' => isset($systemSettings['zkteco_auth_token']) ? $systemSettings['zkteco_auth_token'] : '',
        ];

        $freedcampSettings = [
            'credentials_configured' => filled($systemSettings['freedcamp_api_key'] ?? null)
                && filled($systemSettings['freedcamp_secret_key'] ?? null),
            'sync_status' => $systemSettings['freedcamp_sync_status'] ?? null,
            'sync_message' => $systemSettings['freedcamp_sync_message'] ?? null,
            'last_synced_at' => $systemSettings['freedcamp_last_synced_at'] ?? null,
        ];

        // Credentials are write-only and must never be exposed in Inertia page props.
        unset($systemSettings['freedcamp_api_key'], $systemSettings['freedcamp_secret_key']);

        return Inertia::render('settings/index', [
            'systemSettings' => $systemSettings,
            'settings' => $systemSettings, // For helper functions
            'cacheSize' => getCacheSize(),

            'timezones' => config('timezones'),
            'dateFormats' => config('dateformat'),
            'timeFormats' => config('timeformat'),
            'paymentSettings' => $paymentSettings,
            'webhooks' => $webhooks,
            'zektoSettings' => $zektoSettings,
            'freedcampSettings' => $freedcampSettings,
            'ipRestrictions' => $ipRestrictions,
        ]);
    }
}
