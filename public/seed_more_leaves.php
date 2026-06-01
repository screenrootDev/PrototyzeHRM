<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Models\LeavePolicy;
use Carbon\Carbon;

try {
    // 1. Get all employees
    $employees = User::where('type', 'employee')->get();
    if ($employees->isEmpty()) {
        die("No employees found.");
    }
    
    // Ensure LeaveType & Policy exist
    $adminId = User::where('type', 'superadmin')->first()->id ?? 1;
    
    $leaveType = LeaveType::firstOrCreate(
        ['name' => 'Personal Leave'],
        ['code' => 'PL', 'description' => 'Personal Leave', 'is_paid' => false, 'created_by' => $adminId]
    );
    $leavePolicy = LeavePolicy::firstOrCreate(
        ['name' => 'Personal Leave Policy', 'leave_type_id' => $leaveType->id],
        ['requires_approval' => true, 'created_by' => $adminId]
    );
    
    $today = Carbon::today();
    
    // Pick 2 random employees
    $leaveEmployees = clone $employees;
    if ($employees->count() > 2) {
        $leaveEmployees = $employees->random(2);
    }
    
    $emps = $leaveEmployees->values();
    
    if (isset($emps[0])) {
        $emp1 = $emps[0];
        $creator1 = $emp1->created_by ?? 1;
        
        LeaveApplication::create([
            'employee_id' => $emp1->id,
            'start_date' => $today->copy()->addDays(5)->format('Y-m-d'),
            'end_date' => $today->copy()->addDays(6)->format('Y-m-d'),
            'status' => 'pending',
            'leave_type_id' => $leaveType->id,
            'leave_policy_id' => $leavePolicy->id,
            'total_days' => 2,
            'reason' => 'Dummy pending leave',
            'created_by' => $creator1
        ]);
    }

    if (isset($emps[1])) {
        $emp2 = $emps[1];
        $creator2 = $emp2->created_by ?? 1;
        
        LeaveApplication::create([
            'employee_id' => $emp2->id,
            'start_date' => $today->copy()->subDays(2)->format('Y-m-d'),
            'end_date' => $today->copy()->subDays(1)->format('Y-m-d'),
            'status' => 'rejected',
            'leave_type_id' => $leaveType->id,
            'leave_policy_id' => $leavePolicy->id,
            'total_days' => 2,
            'reason' => 'Dummy rejected leave',
            'rejected_by' => $creator2,
            'rejected_at' => now(),
            'created_by' => $creator2
        ]);
    }
    
    echo "Pending and Rejected dummy leave applications successfully generated!";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
