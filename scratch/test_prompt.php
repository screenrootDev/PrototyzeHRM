<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::first();
Auth::login($user);
$service = app(App\Services\AIAgentService::class);
$context = (new ReflectionMethod($service, 'buildContext'))->invoke($service, $user);
$prompt = (new ReflectionMethod($service, 'buildSystemPrompt'))->invoke($service, $context, [], "test");
echo $prompt;
