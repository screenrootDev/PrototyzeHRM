<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $service = app(App\Services\AIAgentService::class);
    $user = App\Models\User::first();
    $result = $service->chat("test", [], $user);
    var_dump($result);
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "IN: " . $e->getFile() . " on line " . $e->getLine() . "\n";
}
