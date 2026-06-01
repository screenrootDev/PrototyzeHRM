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
    // 1. Get all employees
    $employees = User::where('type', 'employee')->get();
    if ($employees->isEmpty()) {
        die("No employees found.");
    }
    
    // Ensure LeaveType & Policy exist
    $adminId = User::where('type', 'superadmin')->first()->id ?? 1;
    
    $leaveType = LeaveType::firstOrCreate(
        ['name' => 'Annual Leave'],
        ['code' => 'AL', 'description' => 'Annual Leave', 'is_paid' => true, 'created_by' => $adminId]
    );
    $leavePolicy = LeavePolicy::firstOrCreate(
        ['name' => 'Annual Leave Policy', 'leave_type_id' => $leaveType->id],
        ['requires_approval' => true, 'created_by' => $adminId]
    );
    
    $today = Carbon::today();
    
    // 2. Generate Long Term Attendance Data (Last 30 Days)
    foreach ($employees as $emp) {
        $creator = $emp->created_by ?? 1;
        
        for ($i = 1; $i <= 30; $i++) {
            $date = $today->copy()->subDays($i);
            
            // Skip weekends
            if ($date->isWeekend()) {
                continue;
            }
            
            // Randomize status
            $rand = rand(1, 100);
            $status = 'present';
            $is_absent = false;
            $hours = rand(7, 9);
            
            if ($rand > 90) { // 10% absent
                $status = 'absent';
                $is_absent = true;
                $hours = 0;
            } elseif ($rand > 80) { // 10% half day
                $status = 'half_day';
                $hours = 4;
            }
            
            AttendanceRecord::updateOrCreate(
                ['employee_id' => $emp->id, 'date' => $date->format('Y-m-d')],
                [
                    'status' => $status,
                    'is_absent' => $is_absent,
                    'total_hours' => $hours,
                    'notes' => 'Long term dummy data',
                    'created_by' => $creator
                ]
            );
        }
    }
    
    // 3. Generate Long Term Leave Data
    // We'll give 5 random employees leaves in the past and future
    $leaveEmployees = clone $employees;
    if ($employees->count() > 5) {
        $leaveEmployees = $employees->random(5);
    }
    
    foreach ($leaveEmployees as $emp) {
        $creator = $emp->created_by ?? 1;
        
        // Past Leave
        $pastStart = $today->copy()->subDays(rand(10, 20));
        LeaveApplication::firstOrCreate(
            [
                'employee_id' => $emp->id,
                'start_date' => $pastStart->format('Y-m-d'),
                'end_date' => $pastStart->copy()->addDays(2)->format('Y-m-d'),
            ],
            [
                'status' => 'approved',
                'leave_type_id' => $leaveType->id,
                'leave_policy_id' => $leavePolicy->id,
                'total_days' => 3,
                'reason' => 'Past long term leave',
                'approved_by' => $creator,
                'approved_at' => now(),
                'created_by' => $creator
            ]
        );
        
        // Future Leave
        $futureStart = $today->copy()->addDays(rand(5, 15));
        LeaveApplication::firstOrCreate(
            [
                'employee_id' => $emp->id,
                'start_date' => $futureStart->format('Y-m-d'),
                'end_date' => $futureStart->copy()->addDays(1)->format('Y-m-d'),
            ],
            [
                'status' => 'approved',
                'leave_type_id' => $leaveType->id,
                'leave_policy_id' => $leavePolicy->id,
                'total_days' => 2,
                'reason' => 'Future long term leave',
                'approved_by' => $creator,
                'approved_at' => now(),
                'created_by' => $creator
            ]
        );
    }
    
    echo "Long-term data (past 30 days attendance and scattered leaves) successfully generated!";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
