<?php

use App\Http\Middleware\CheckInstallation;
use App\Http\Middleware\DemoModeMiddleware;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ShareGlobalSettings;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance']);

        $middleware->web(append: [
            CheckInstallation::class,
            HandleAppearance::class,
            ShareGlobalSettings::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            DemoModeMiddleware::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'landing.enabled' => \App\Http\Middleware\CheckLandingPageEnabled::class,
            'verified' => App\Http\Middleware\EnsureEmailIsVerified::class,
            'setting' => \App\Http\Middleware\SettingMiddleware::class,
            'career.shared' => \App\Http\Middleware\CareerSharedDataMiddleware::class,
            'feature' => \App\Http\Middleware\CheckFeatureAccess::class,
        ]);

        $middleware->validateCsrfTokens(
            except: [
                'install/*',
                'update/*',
                'api/media/batch',
            ],
        );

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
