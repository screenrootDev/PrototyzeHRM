<?php

namespace Database\Seeders;

use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Models\LeavePolicy;
use App\Models\AttendanceRecord;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DashboardMockDataSeeder extends Seeder
{
    public function run(): void
    {
        // Get all companies
        $companies = User::where('type', 'company')->get();

        if ($companies->isEmpty()) {
            $this->command->warn('No companies found.');
            return;
        }

        $today = Carbon::today()->format('Y-m-d');

        foreach ($companies as $company) {
            // Get some employees
            $employees = User::where('type', 'employee')->where('created_by', $company->id)->take(4)->get();
            
            if ($employees->count() < 2) {
                continue;
            }

            $leaveType = LeaveType::where('created_by', $company->id)->first();
            $leavePolicy = LeavePolicy::where('created_by', $company->id)->first();

            if (!$leaveType || !$leavePolicy) {
                continue;
            }

            // 1. Create a Leave Application for Today for the first employee
            $emp1 = $employees[0];
            LeaveApplication::updateOrCreate(
                [
                    'employee_id' => $emp1->id,
                    'start_date' => $today,
                    'end_date' => $today,
                ],
                [
                    'leave_type_id' => $leaveType->id,
                    'leave_policy_id' => $leavePolicy->id,
                    'total_days' => 1,
                    'reason' => 'Feeling unwell (Mock Data)',
                    'status' => 'approved',
                    'created_by' => $company->id,
                ]
            );

            // 2. Create an Absent Attendance Record for Today for the second employee
            $emp2 = $employees[1];
            AttendanceRecord::updateOrCreate(
                [
                    'employee_id' => $emp2->id,
                    'date' => $today,
                ],
                [
                    'status' => 'absent',
                    'is_absent' => true,
                    'total_hours' => 0,
                    'created_by' => $company->id,
                ]
            );

            // Optionally, add a third employee to both or another leave
            if (isset($employees[2])) {
                $emp3 = $employees[2];
                AttendanceRecord::updateOrCreate(
                    [
                        'employee_id' => $emp3->id,
                        'date' => $today,
                    ],
                    [
                        'status' => 'absent',
                        'is_absent' => true,
                        'total_hours' => 0,
                        'created_by' => $company->id,
                    ]
                );
            }
        }

        $this->command->info('Dashboard mock data seeded successfully for all companies for today!');
    }
}
