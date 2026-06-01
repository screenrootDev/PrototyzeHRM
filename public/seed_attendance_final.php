<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Models\LeavePolicy;
use Carbon\Carbon;

try {
    $employees = User::all();
    if ($employees->count() < 1) {
        die("No users found to attach dummy data to.");
    }
    
    $today = Carbon::today();
    $admin = $employees->first();
    
    // 1. Missing Attendance (Absent Today)
    $absentEmployees = $employees->take(3);
    foreach ($absentEmployees as $emp) {
        AttendanceRecord::firstOrCreate(
            ['employee_id' => $emp->id, 'date' => $today->format('Y-m-d')],
            [
                'status' => 'absent',
                'is_absent' => true,
                'total_hours' => 0,
                'notes' => 'Dummy absent record',
                'created_by' => $admin->id
            ]
        );
    }
    
    // Ensure LeaveType & Policy exist
    $leaveType = LeaveType::firstOrCreate(
        ['name' => 'Annual Leave', 'created_by' => $admin->id],
        ['code' => 'AL', 'description' => 'Annual Leave', 'is_paid' => true]
    );
    $leavePolicy = LeavePolicy::firstOrCreate(
        ['leave_type_id' => $leaveType->id, 'created_by' => $admin->id],
        ['max_days_per_year' => 20, 'requires_approval' => true]
    );

    // 2. Employees on Leave Today
    $leaveEmployees = clone $employees;
    // Attempt to grab different employees, or reuse if not enough
    if ($employees->count() >= 6) {
        $leaveEmployees = $employees->slice(3, 3);
    } else {
        $leaveEmployees = $employees->take(2);
    }

    foreach ($leaveEmployees as $emp) {
        LeaveApplication::firstOrCreate(
            [
                'employee_id' => $emp->id,
                'start_date' => $today->copy()->subDays(1)->format('Y-m-d'),
                'end_date' => $today->copy()->addDays(2)->format('Y-m-d'),
                'status' => 'approved'
            ],
            [
                'leave_type_id' => $leaveType->id,
                'leave_policy_id' => $leavePolicy->id,
                'total_days' => 4,
                'reason' => 'Dummy approved leave',
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'created_by' => $admin->id
            ]
        );
    }
    
    echo "Dummy data for attendance and leaves successfully injected.";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
