<?php

namespace App\Http\Controllers;

use App\Services\FreedcampService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FreedcampSettingsController extends Controller
{
    public function __construct(private readonly FreedcampService $freedcamp) {}

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'freedcamp_api_key' => 'nullable|string|max:255',
            'freedcamp_secret_key' => 'nullable|string|max:255',
            'credentials_configured' => 'required|boolean',
        ]);

        if (! $validated['credentials_configured'] &&
            (blank($validated['freedcamp_api_key'] ?? null) || blank($validated['freedcamp_secret_key'] ?? null))) {
            throw ValidationException::withMessages([
                'freedcamp_api_key' => __('Both the Freedcamp API key and secret key are required.'),
            ]);
        }

        if (filled($validated['freedcamp_api_key'] ?? null)) {
            updateSetting('freedcamp_api_key', $this->freedcamp->encryptCredential(trim($validated['freedcamp_api_key'])));
        }

        if (filled($validated['freedcamp_secret_key'] ?? null)) {
            updateSetting('freedcamp_secret_key', $this->freedcamp->encryptCredential(trim($validated['freedcamp_secret_key'])));
        }

        return back()->with('success', __('Freedcamp settings saved successfully.'));
    }

    public function test(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'freedcamp_api_key' => 'nullable|string|max:255',
            'freedcamp_secret_key' => 'nullable|string|max:255',
        ]);

        try {
            $response = $this->freedcamp->testConnection(
                filled($validated['freedcamp_api_key'] ?? null) ? trim($validated['freedcamp_api_key']) : null,
                filled($validated['freedcamp_secret_key'] ?? null) ? trim($validated['freedcamp_secret_key']) : null,
            );

            if ($response->successful() && ($response->json('http_code') === 200 || $response->json('msg') === 'OK')) {
                return back()->with('success', __('Freedcamp connection successful.'));
            }

            return back()->with('error', __('Freedcamp rejected the credentials: :message', [
                'message' => $response->json('msg', __('Unknown API error')),
            ]));
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with('error', __('Unable to connect to Freedcamp: :message', [
                'message' => $exception->getMessage(),
            ]));
        }
    }
}
