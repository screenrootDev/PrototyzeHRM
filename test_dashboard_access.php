<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::where('type', 'superadmin')->first();

echo "Testing dashboard access for: " . $user->email . " (type: " . $user->type . ")\n\n";

// Test hasPermissionTo for key permissions
$permissions = [
    'manage-dashboard',
    'manage-users',
    'manage-roles',
    'manage-plans',
    'manage-settings',
];

echo "Permission checks:\n";
foreach ($permissions as $perm) {
    try {
        $has = $user->hasPermissionTo($perm);
        echo "  $perm: " . ($has ? 'YES' : 'NO') . "\n";
    } catch (Exception $e) {
        echo "  $perm: ERROR - " . $e->getMessage() . "\n";
    }
}

echo "\nisSuperAdmin(): " . ($user->isSuperAdmin() ? 'YES' : 'NO') . "\n";
echo "isSaas(): " . (isSaas() ? 'YES' : 'NO') . "\n";

// Test if they can access the redirect route
echo "\n--- Testing DashboardController ---\n";
$controller = new \App\Http\Controllers\DashboardController();
try {
    // We'll just call index() which checks permissions
    // Since we're in CLI, we need to mock auth
    echo "DashboardController can be instantiated\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}