<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('type', 'company')->first();
if ($user) {
    echo "Testing Company User ID: " . $user->id . "\n";
    echo "hasPermissionTo('manage-users'): " . ($user->hasPermissionTo('manage-users') ? 'true' : 'false') . "\n";
    echo "can('manage-users'): " . ($user->can('manage-users') ? 'true' : 'false') . "\n";
} else {
    echo "No company user found.\n";
}
