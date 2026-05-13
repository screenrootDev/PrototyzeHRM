<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "All users in database:\n";
$users = \App\Models\User::all(['id', 'name', 'email', 'type']);
foreach ($users as $user) {
    echo "  ID: " . $user->id . " | Type: " . $user->type . " | Name: " . $user->name . " | Email: " . $user->email . "\n";
}