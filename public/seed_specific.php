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
    $today = Carbon::today();
    
    // Clear out our old dummy data to avoid clutter
    AttendanceRecord::where('notes', 'like', '%Dummy%')->delete();
    LeaveApplication::where('reason', 'like', '%Dummy%')->delete();

    // Specific employees for Absent Today
    $absentNames = ['Samragyee Bhattacharjee', 'Abir Mondal'];
    foreach ($absentNames as $name) {
        $emp = User::where('name', $name)->first();
        if ($emp) {
            AttendanceRecord::firstOrCreate(
                ['employee_id' => $emp->id, 'date' => $today->format('Y-m-d')],
                [
                    'status' => 'absent',
                    'is_absent' => true,
                    'total_hours' => 0,
                    'notes' => 'Dummy absent',
                    'created_by' => $emp->created_by ?? 1
                ]
            );
        }
    }
    
    // Ensure LeaveType & Policy exist
    $leaveType = LeaveType::firstOrCreate(
        ['name' => 'Annual Leave'],
        ['code' => 'AL', 'description' => 'Annual Leave', 'is_paid' => true, 'created_by' => 1]
    );
    $leavePolicy = LeavePolicy::firstOrCreate(
        ['name' => 'Annual Leave Policy', 'leave_type_id' => $leaveType->id],
        ['requires_approval' => true, 'created_by' => 1]
    );

    // Specific employees for Leave Today
    $leaveNames = ['Esha Sharma', 'Manan Swarup'];
    foreach ($leaveNames as $name) {
        $emp = User::where('name', $name)->first();
        if ($emp) {
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
                    'approved_by' => $emp->created_by ?? 1,
                    'approved_at' => now(),
                    'created_by' => $emp->created_by ?? 1
                ]
            );
        }
    }
    
    echo "Successfully seeded specific dummy data for Samragyee, Abir, Esha, and Manan.";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
