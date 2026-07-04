<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;

Permission::firstOrCreate(['name' => 'manage-ai-agent', 'guard_name' => 'web']);
Permission::firstOrCreate(['name' => 'manage-messenger', 'guard_name' => 'web']);

$role = Role::where('name', 'company')->first();
if ($role) {
    $role->givePermissionTo(['manage-ai-agent', 'manage-messenger']);
}

$user = User::where('email', 'chetan@screenroot.com')->first();
if ($user && $user->hasRole('company')) {
    echo "Permissions updated for company role.";
} else if ($user) {
    $user->givePermissionTo(['manage-ai-agent', 'manage-messenger']);
    echo "Permissions updated for user.";
}
