<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::where('type', 'superadmin')->first();

if ($user) {
    echo "User: " . $user->name . " (" . $user->email . ")\n";
    echo "Type: " . $user->type . "\n";
    echo "Roles: " . $user->getRoleNames()->implode(', ') . "\n";
    echo "Permissions count: " . $user->getAllPermissions()->count() . "\n";
    
    if ($user->getAllPermissions()->count() > 0) {
        echo "\nPermissions:\n";
        foreach ($user->getAllPermissions()->pluck('name') as $perm) {
            echo "  - " . $perm . "\n";
        }
    }
} else {
    echo "No superadmin user found!\n";
}