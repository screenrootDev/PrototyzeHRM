<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$companyUser = \App\Models\User::find(2);

echo "Company User: " . $companyUser->email . "\n";
echo "Type: " . $companyUser->type . "\n";
echo "Roles: " . $companyUser->getRoleNames()->implode(', ') . "\n";
echo "Permissions count: " . $companyUser->getAllPermissions()->count() . "\n";

echo "\nDoes user have 'manage-companies' permission? " . ($companyUser->hasPermissionTo('manage-companies') ? 'YES' : 'NO') . "\n";

echo "\n--- All Permissions ---\n";
foreach ($companyUser->getAllPermissions()->pluck('name') as $perm) {
    echo "  - $perm\n";
}