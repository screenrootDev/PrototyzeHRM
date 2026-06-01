<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\LeaveApplication;

try {
    // Find the primary company user to assign the data to
    $companyUser = User::where('type', 'company')->first();
    
    if ($companyUser) {
        $id = $companyUser->id;
        AttendanceRecord::query()->update(['created_by' => $id]);
        LeaveApplication::query()->update(['created_by' => $id]);
        echo "Successfully assigned dummy data to Company User ID: " . $id;
    } else {
        // Fallback to superadmin if no company exists
        $admin = User::where('type', 'superadmin')->orWhere('type', 'super admin')->first();
        if ($admin) {
            AttendanceRecord::query()->update(['created_by' => $admin->id]);
            LeaveApplication::query()->update(['created_by' => $admin->id]);
            echo "Successfully assigned dummy data to Superadmin User ID: " . $admin->id;
        } else {
            // Ultimate fallback
            $firstUser = User::first();
            AttendanceRecord::query()->update(['created_by' => $firstUser->id]);
            LeaveApplication::query()->update(['created_by' => $firstUser->id]);
            echo "Successfully assigned dummy data to First User ID: " . $firstUser->id;
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
