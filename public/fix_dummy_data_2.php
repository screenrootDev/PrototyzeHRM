<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\LeaveApplication;

try {
    // We will assign the created_by of the record to match the employee's created_by (which is usually the company ID)
    
    $attendances = AttendanceRecord::all();
    foreach ($attendances as $record) {
        $employee = User::find($record->employee_id);
        if ($employee && $employee->created_by) {
            $record->created_by = $employee->created_by;
            $record->save();
        } else {
            // fallback, set it to the employee's own ID
            $record->created_by = $employee->id ?? 1;
            $record->save();
        }
    }
    
    $leaves = LeaveApplication::all();
    foreach ($leaves as $leave) {
        $employee = User::find($leave->employee_id);
        if ($employee && $employee->created_by) {
            $leave->created_by = $employee->created_by;
            $leave->save();
        } else {
            $leave->created_by = $employee->id ?? 1;
            $leave->save();
        }
    }
    
    echo "Successfully updated created_by for all dummy records to match their respective employees' company.";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
