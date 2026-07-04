<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = App\Models\User::first();
    Illuminate\Support\Facades\Auth::login($user);
    $service = app(App\Services\AIAgentService::class);
    $result = $service->chat("test", [], $user);
    var_dump($result);
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "IN: " . $e->getFile() . " on line " . $e->getLine() . "\n";
}
