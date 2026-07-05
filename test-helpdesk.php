<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$user = \App\Models\User::find(1);
Auth::login($user);
$controller = app(\App\Http\Controllers\HelpdeskTicketController::class);
try {
    $response = $controller->index();
    echo get_class($response) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
