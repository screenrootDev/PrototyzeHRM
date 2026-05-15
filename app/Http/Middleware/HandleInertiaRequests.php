<?php

namespace App\Http\Middleware;


use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        // Return null to disable Inertia version checking in development
        // This prevents the infinite reload loop when assets are rebuilt
        return null;
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Skip database queries during installation
        if ($request->is('install/*') || $request->is('update/*') || !file_exists(storage_path('installed'))) {
            return [
                ...parent::share($request),
                'availableLanguages' => [],
                'quote' => ['message' => trim($message), 'author' => trim($author)],
                'globalSettings' => ['availableLanguages' => []],
                'companySlug' => '',
            ];
        }

        // Get system settings
        $settings = settings();
        // Get currency symbol (simplified as Currencies module is removed)
        $currencySettings = [
            'currencySymbol' => $settings['currencySymbol'] ?? '$',
            'currencyName' => $settings['currencyName'] ?? 'US Dollar',
        ];

        $availableLanguages = [];

        // Merge currency settings with other settings
        $settingsArray = is_array($settings) ? $settings : (is_object($settings) && method_exists($settings, 'toArray') ? $settings->toArray() : (array) $settings);
        $globalSettings = array_merge($settingsArray, $currencySettings);
        $globalSettings['base_url'] = config('app.url');
        $globalSettings['image_url'] = config('app.url');
        $globalSettings['is_demo'] = config('app.is_demo');
        $globalSettings['is_saas'] = false;
        $globalSettings['availableLanguages'] = $availableLanguages;

        $companySlug = '';
        $checkUser = Auth::user();
        if ($checkUser && $checkUser->hasRole('company')) {
            $companySlug = Auth::user()->slug ?? '';
        } else {
            $authUser = Auth::user();
            if ($authUser) {
                $getCompanyId = getCompanyId($authUser->id);
                $getUser = Auth::user()->where('id', $getCompanyId)->first();
                if ($getUser) {
                    $companySlug = $getUser->slug;
                }
            }
        }


        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'base_url' => config('app.url'),
            'image_url' => config('app.url'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $request->user(),
                'roles' => fn() => $request->user()?->roles->pluck('name'),
                'permissions' => fn() => $request->user()?->getAllPermissions()->pluck('name'),
            ],
            'userLanguage' => 'en',
            'isImpersonating' => session('impersonated_by') ? true : false,
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'globalSettings' => $globalSettings,
            'is_demo' => config('app.is_demo'),
            'companySlug' => $companySlug,
        ];
    }
}
