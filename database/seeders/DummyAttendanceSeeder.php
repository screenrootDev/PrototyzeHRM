<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AttendanceRecord;
use Carbon\Carbon;

class DummyAttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all active employees
        $employees = User::where('type', 'employee')->where('status', 'active')->get();

        if ($employees->isEmpty()) {
            $this->command->info('No active employees found to seed attendance for.');
            return;
        }

        $statuses = ['present', 'present', 'present', 'present', 'present', 'absent', 'half_day', 'holiday'];
        $now = Carbon::now();

        // Seed for last month and current month up to today
        $startDate = $now->copy()->subMonth()->startOfMonth();
        $endDate = $now->copy();

        $recordsCount = 0;

        foreach ($employees as $emp) {
            $currentDate = $startDate->copy();
            
            while ($currentDate->lte($endDate)) {
                // Skip weekends (assuming Sat/Sun are off)
                if ($currentDate->isWeekend()) {
                    $currentDate->addDay();
                    continue;
                }

                // Check if record already exists
                $exists = AttendanceRecord::where('employee_id', $emp->id)
                    ->where('date', $currentDate->format('Y-m-d'))
                    ->exists();

                if (!$exists) {
                    $status = $statuses[array_rand($statuses)];
                    
                    $clockIn = null;
                    $clockOut = null;

                    if (in_array($status, ['present', 'half_day'])) {
                        // Random clock in between 08:30 and 09:30
                        $clockIn = sprintf('%02d:%02d:00', rand(8, 9), rand(0, 59));
                        
                        if ($status === 'present') {
                            // Random clock out between 17:00 and 18:30
                            $clockOut = sprintf('%02d:%02d:00', rand(17, 18), rand(0, 59));
                        } else {
                            // Half day out around 13:00
                            $clockOut = sprintf('%02d:%02d:00', 13, rand(0, 59));
                        }
                    }

                    AttendanceRecord::create([
                        'employee_id' => $emp->id,
                        'date' => $currentDate->format('Y-m-d'),
                        'status' => $status,
                        'clock_in' => $clockIn,
                        'clock_out' => $clockOut,
                        'break_hours' => ($status === 'present') ? 1 : 0,
                        'is_holiday' => ($status === 'holiday'),
                        'created_by' => $emp->created_by,
                    ]);
                    
                    $recordsCount++;
                }

                $currentDate->addDay();
            }
        }

        $this->command->info("Successfully created $recordsCount dummy attendance records.");
    }
}
