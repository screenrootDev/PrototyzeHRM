<?php

namespace App\Http\Controllers;

use App\Models\AttendancePolicy;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\IpRestriction;
use App\Models\LeaveApplication;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttendanceRecordController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-attendance-records')) {
            $month = $request->month ?? date('m');
            $year = $request->year ?? date('Y');
            $dateObj = Carbon::createFromDate($year, $month, 1);
            $daysInMonth = $dateObj->daysInMonth;
            
            $startDate = $dateObj->copy()->startOfMonth()->format('Y-m-d');
            $endDate = $dateObj->copy()->endOfMonth()->format('Y-m-d');

            // 1. Get employees query
            $employeeQuery = User::emp()
                ->with('employee')
                ->whereHas('employee')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active');

            if (Auth::user()->can('manage-own-attendance-records') && !Auth::user()->can('manage-any-attendance-records')) {
                $employeeQuery->where(function ($q) {
                    $q->where('created_by', Auth::id())->orWhere('id', Auth::id());
                });
            }

            // Handle filters
            if ($request->has('search') && !empty($request->search)) {
                $employeeQuery->where('name', 'like', '%' . $request->search . '%');
            }
            if ($request->has('employee_id') && !empty($request->employee_id) && $request->employee_id !== 'all') {
                $employeeQuery->where('id', $request->employee_id);
            }

            // Paginate employees
            $employeesList = $employeeQuery->paginate($request->per_page ?? 10);
            $employeeIds = $employeesList->pluck('id');

            // 2. Fetch Attendance Records for the current month
            $attendanceRecords = AttendanceRecord::with(['shift'])
                ->whereIn('employee_id', $employeeIds)
                ->whereBetween('date', [$startDate, $endDate])
                ->get()
                ->groupBy('employee_id');

            // 3. Fetch Leaves for the current month to show L for missing records
            $leaves = \App\Models\LeaveApplication::with('leaveType')
                ->whereIn('employee_id', $employeeIds)
                ->where('status', 'approved')
                ->where(function($q) use ($startDate, $endDate) {
                    $q->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('end_date', [$startDate, $endDate])
                      ->orWhere(function($sq) use ($startDate, $endDate) {
                          $sq->where('start_date', '<=', $startDate)
                             ->where('end_date', '>=', $endDate);
                      });
                })->get();

            // Format leave lookup
            $leaveLookup = [];
            foreach ($leaves as $leave) {
                $start = Carbon::parse($leave->start_date)->max($dateObj->copy()->startOfMonth());
                $end = Carbon::parse($leave->end_date)->min($dateObj->copy()->endOfMonth());
                for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
                    $leaveLookup[$leave->employee_id][$d->format('Y-m-d')] = $leave;
                }
            }

            $settings = settings();
            $workingDaysSetting = isset($settings['working_days'])
                ? json_decode($settings['working_days'], true)
                : [1, 2, 3, 4, 5];
            $workingDaysSetting = $workingDaysSetting ?: [1, 2, 3, 4, 5];

            // 4. Format Grid Data
            $attendanceData = [];
            foreach ($employeesList as $emp) {
                $empId = $emp->id;
                $empRecords = $attendanceRecords->get($empId, collect())->keyBy(
                    fn (AttendanceRecord $record) => $record->date->format('Y-m-d')
                );
                
                $days = [];
                $summary = [
                    'present' => 0,
                    'absent' => 0,
                    'leave' => 0,
                    'half_day' => 0,
                    'holiday' => 0,
                ];

                for ($i = 1; $i <= $daysInMonth; $i++) {
                    $dateStr = $dateObj->copy()->day($i)->format('Y-m-d');
                    
                    if ($empRecords->has($dateStr)) {
                        $record = $empRecords->get($dateStr);
                        // Convert status to grid format
                        $status = $record->status;
                        $days[$i] = [
                            'status' => $status,
                            'record_id' => $record->id,
                            'clock_in' => $record->clock_in,
                            'clock_out' => $record->clock_out,
                            'is_late' => (bool) $record->is_late,
                            'is_early_departure' => (bool) $record->is_early_departure,
                            'overtime_hours' => (float) ($record->overtime_hours ?? 0),
                            'total_hours' => (float) ($record->total_hours ?? 0),
                            'break_hours' => (float) ($record->break_hours ?? 0),
                            'notes' => $record->notes,
                        ];
                        
                        if ($status === 'present') $summary['present']++;
                        elseif ($status === 'absent') $summary['absent']++;
                        elseif ($status === 'half_day') $summary['half_day']++;
                        elseif ($status === 'on_leave') $summary['leave']++;
                        elseif ($status === 'holiday') $summary['holiday']++;
                    } else {
                        // Check if on leave
                        if (isset($leaveLookup[$empId][$dateStr])) {
                            $days[$i] = [
                                'status' => 'on_leave',
                                'leave_type' => $leaveLookup[$empId][$dateStr]->leaveType->name ?? 'Leave',
                                'record_id' => null
                            ];
                            $summary['leave']++;
                        } else {
                            $day = $dateObj->copy()->day($i);
                            $isWorkingDay = in_array($day->dayOfWeekIso, $workingDaysSetting);

                            $days[$i] = [
                                'status' => !$isWorkingDay ? 'day_off' : ($day->isFuture() ? 'future' : ($day->isToday() ? 'not_added' : 'absent')),
                                'record_id' => null,
                                'is_late' => false,
                                'is_early_departure' => false,
                                'overtime_hours' => 0,
                            ];

                            if ($isWorkingDay && $day->isPast()) {
                                $summary['absent']++;
                            }
                        }
                    }
                }

                $attendanceData[] = [
                    'employee' => [
                        'id' => $empId,
                        'name' => $emp->name,
                        'employee_id' => $emp->employee->employee_id ?? '',
                        'designation' => $emp->employee?->designation?->name
                            ?? $emp->employee?->designation?->designation_name
                            ?? null,
                        'avatar' => $emp->avatar ?? null,
                    ],
                    'days' => $days,
                    'summary' => $summary
                ];
            }

            // Calculate total working days in the month
            $workingDaysInMonth = 0;
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $dayOfWeek = $dateObj->copy()->day($i)->dayOfWeekIso;
                if (in_array($dayOfWeek, $workingDaysSetting)) {
                    $workingDaysInMonth++;
                }
            }

            // Reconstruct paginated result to pass to frontend
            $paginationData = $employeesList->toArray();
            $paginationData['data'] = $attendanceData;

            // Optional: get all employees for filter dropdown
            $filterEmployees = $this->getFilteredEmployees();

            return Inertia::render('hr/attendance-records/index', [
                'attendanceData' => $paginationData,
                'employees' => $filterEmployees,
                'daysInMonth' => $daysInMonth,
                'workingDaysInMonth' => $workingDaysInMonth,
                'currentMonth' => (int)$month,
                'currentYear' => (int)$year,
                'filters' => $request->all(['search', 'employee_id', 'status', 'month', 'year', 'per_page']),
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    private function getFilteredEmployees()
    {
        $employees = User::emp()
            ->with('employee')
            ->whereHas('employee')
            ->whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->when(
                Auth::user()->can('manage-own-attendance-records') && ! Auth::user()->can('manage-any-attendance-records'),
                fn ($query) => $query->where(fn ($scope) => $scope
                    ->where('created_by', Auth::id())
                    ->orWhere('id', Auth::id()))
            )
            ->select('id', 'name', 'avatar')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'employee_id' => $user->employee->employee_id ?? '',
                ];
            });

        return $employees;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'clock_in' => 'nullable|date_format:H:i',
            'clock_out' => 'nullable|date_format:H:i',
            'break_hours' => 'nullable|numeric|min:0',
            'is_holiday' => 'boolean',
            'status' => 'required|in:present,absent,half_day,on_leave,holiday',
            'notes' => 'nullable|string',
        ]);

        // Get employee with shift and policy
        $employee = \App\Models\Employee::where('user_id', $validated['employee_id'])->first();

        // Get working days from settings
        $globalSettings = settings();
        $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[]', true);

        if (empty($workingDaysIndices)) {
            return redirect()->back()->with('error', __('Please configure working days first.'));
        }

        $dateIndex = Carbon::parse($validated['date'])->dayOfWeek;
        if (! in_array($dateIndex, $workingDaysIndices)) {
            return redirect()->back()->with('error', __('Cannot create attendance record for non-working day.'));
        }

        // Check if employee has approved leave for this date
        $hasApprovedLeave = LeaveApplication::where('employee_id', $validated['employee_id'])
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $validated['date'])
            ->whereDate('end_date', '>=', $validated['date'])
            ->exists();

        if ($hasApprovedLeave) {
            return redirect()->back()->with('error', __('Employee has approved leave for this date. Cannot create attendance record.'));
        }

        // Check if record already exists
        $exists = AttendanceRecord::where('employee_id', $validated['employee_id'])
            ->where('date', $validated['date'])
            ->whereIn('created_by', getCompanyAndUsersId())
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', __('Attendance record already exists for this employee and date.'));
        }

        // Use employee's assigned shift and policy, or get defaults
        $shift = $employee && $employee->shift_id ?
            Shift::find($employee->shift_id) :
            Shift::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

        $policy = $employee && $employee->attendance_policy_id ?
            AttendancePolicy::find($employee->attendance_policy_id) :
            AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

        $validated['shift_id'] = $shift?->id;
        $validated['attendance_policy_id'] = $policy?->id;
        $validated['created_by'] = creatorId();
        $validated['is_holiday'] = $validated['is_holiday'] ?? false;
        $validated['break_hours'] = $validated['break_hours'] ?? 0;

        // Set weekend flag
        $validated['is_weekend'] = Carbon::parse($validated['date'])->isWeekend();

        $record = AttendanceRecord::create($validated);

        // Process complete attendance calculation
        $record->fresh(); // Reload to get relationships
        $record->processAttendance();
        $record->forceFill([
            'status' => $validated['status'],
            'is_absent' => $validated['status'] === 'absent',
            'is_holiday' => $validated['status'] === 'holiday' || $validated['is_holiday'],
        ])->save();

        return redirect()->back()->with('success', __('Attendance record created successfully.'));
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $headers = array_map(fn ($header) => strtolower(trim($header)), fgetcsv($handle) ?: []);
        $required = ['employee id', 'date', 'status'];

        if (array_diff($required, $headers)) {
            fclose($handle);
            return redirect()->back()->with('error', __('CSV must contain Employee ID, Date, and Status columns.'));
        }

        $allowedStatuses = ['present', 'absent', 'half_day', 'on_leave', 'holiday'];
        $companyIds = getCompanyAndUsersId();
        $imported = 0;
        $skipped = 0;

        while (($values = fgetcsv($handle)) !== false) {
            $row = array_combine($headers, array_pad($values, count($headers), ''));
            $employee = User::emp()
                ->whereIn('created_by', $companyIds)
                ->whereHas('employee', fn ($query) => $query->where('employee_id', trim($row['employee id'] ?? '')))
                ->with('employee')
                ->first();
            $status = strtolower(trim($row['status'] ?? ''));

            if (! $employee || ! in_array($status, $allowedStatuses, true)) {
                $skipped++;
                continue;
            }

            try {
                $date = Carbon::parse($row['date'])->format('Y-m-d');
            } catch (\Throwable $exception) {
                $skipped++;
                continue;
            }

            $details = $employee->employee;
            $record = AttendanceRecord::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $date],
                [
                    'shift_id' => $details?->shift_id,
                    'attendance_policy_id' => $details?->attendance_policy_id,
                    'clock_in' => trim($row['clock in'] ?? '') ?: null,
                    'clock_out' => trim($row['clock out'] ?? '') ?: null,
                    'status' => $status,
                    'notes' => trim($row['notes'] ?? '') ?: null,
                    'created_by' => creatorId(),
                    'is_absent' => $status === 'absent',
                    'is_holiday' => $status === 'holiday',
                    'is_weekend' => Carbon::parse($date)->isWeekend(),
                ]
            );
            $record->processAttendance();
            $record->forceFill(['status' => $status, 'is_absent' => $status === 'absent', 'is_holiday' => $status === 'holiday'])->save();
            $imported++;
        }

        fclose($handle);

        return redirect()->back()->with('success', __(":imported attendance records imported; :skipped skipped.", compact('imported', 'skipped')));
    }

    public function update(Request $request, $attendanceRecordId)
    {

        $attendanceRecord = AttendanceRecord::where('id', $attendanceRecordId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        // Get working days from settings
        $globalSettings = settings();
        $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[]', true);

        if (empty($workingDaysIndices)) {
            return redirect()->back()->with('error', __('Please configure working days first.'));
        }

        $dateIndex = Carbon::parse($request->date)->dayOfWeek;
        if (! in_array($dateIndex, $workingDaysIndices)) {
            return redirect()->back()->with('error', __('Cannot create attendance record for non-working day.'));
        }

        // Check if employee has approved leave for this date
        $hasApprovedLeave = LeaveApplication::where('employee_id', $request->employee_id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $request->date)
            ->whereDate('end_date', '>=', $request->date)
            ->exists();

        if ($hasApprovedLeave) {
            return redirect()->back()->with('error', __('Employee has approved leave for this date. Cannot create attendance record.'));
        }

        if ($attendanceRecord) {
            try {
                $validated = $request->validate([
                    'employee_id' => 'required|exists:users,id',
                    'date' => 'required|date',
                    'clock_in' => 'nullable|date_format:H:i',
                    'clock_out' => 'nullable|date_format:H:i',
                    'break_hours' => 'nullable|numeric|min:0',
                    'is_holiday' => 'boolean',
                    'status' => 'required|in:present,absent,half_day,on_leave,holiday',
                    'notes' => 'nullable|string',
                ]);

                // Check if employee or date changed and if duplicate exists
                if ($attendanceRecord->employee_id != $validated['employee_id'] || $attendanceRecord->date != $validated['date']) {
                    $exists = AttendanceRecord::where('employee_id', $validated['employee_id'])
                        ->where('date', $validated['date'])
                        ->where('id', '!=', $attendanceRecordId)
                        ->exists();

                    if ($exists) {
                        return redirect()->back()->with('error', __('Attendance record already exists for this employee and date.'));
                    }
                }

                // Get employee with shift and policy
                $employee = \App\Models\Employee::where('user_id', $validated['employee_id'])->first();

                // Use employee's assigned shift and policy, or get defaults
                $shift = $employee && $employee->shift_id ?
                    Shift::find($employee->shift_id) :
                    Shift::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

                $policy = $employee && $employee->attendance_policy_id ?
                    AttendancePolicy::find($employee->attendance_policy_id) :
                    AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

                $validated['shift_id'] = $shift?->id;
                $validated['attendance_policy_id'] = $policy?->id;

                // Set weekend flag
                $validated['is_weekend'] = Carbon::parse($validated['date'])->isWeekend();

                $attendanceRecord->update($validated);

                // Process complete attendance calculation
                $attendanceRecord->fresh(); // Reload to get relationships
                $attendanceRecord->processAttendance();
                $attendanceRecord->forceFill([
                    'status' => $validated['status'],
                    'is_absent' => $validated['status'] === 'absent',
                    'is_holiday' => $validated['status'] === 'holiday' || ($validated['is_holiday'] ?? false),
                ])->save();

                return redirect()->back()->with('success', __('Attendance record updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update attendance record'));
            }
        } else {
            return redirect()->back()->with('error', __('Attendance record Not Found.'));
        }
    }

    public function destroy($attendanceRecordId)
    {
        $attendanceRecord = AttendanceRecord::where('id', $attendanceRecordId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($attendanceRecord) {
            try {
                $attendanceRecord->delete();

                return redirect()->back()->with('success', __('Attendance record deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete attendance record'));
            }
        } else {
            return redirect()->back()->with('error', __('Attendance record Not Found.'));
        }
    }

    public function clockIn(Request $request)
    {
        if (Auth::user()->can('clock-in-out')) {
            try {
                $validated = $request->validate([
                    'employee_id' => 'required|exists:users,id',
                ]);

                $settings = settings();
                if (! empty($settings['ipRestrictionEnabled']) && $settings['ipRestrictionEnabled'] == 1) {
                    $loginUserIp = request()->ip();
                    $ip = IpRestriction::whereIn('created_by', getCompanyAndUsersId())->where('ip_address', $loginUserIp)->first();
                    if (empty($ip) || is_null($ip)) {
                        return redirect()->back()->with('error', __('This IP Address Is Not Allowed For Clock In & Clock Out.'));
                    }
                }

                $today = Carbon::today();
                $now = Carbon::now();

                // Get working days from settings
                $globalSettings = settings();
                $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[]', true);

                if (empty($workingDaysIndices)) {
                    return redirect()->back()->with('error', __('Please configure working days first.'));
                }

                $dateIndex = Carbon::parse($today)->dayOfWeek;
                if (! in_array($dateIndex, $workingDaysIndices)) {
                    return redirect()->back()->with('error', __('Cannot create attendance record for non-working day.'));
                }

                // Check if employee has approved leave for this date
                $hasApprovedLeave = LeaveApplication::where('employee_id', $validated['employee_id'])
                    ->where('status', 'approved')
                    ->whereDate('start_date', '<=', $today)
                    ->whereDate('end_date', '>=', $today)
                    ->exists();

                if ($hasApprovedLeave) {
                    return redirect()->back()->with('error', __('Employee has approved leave for this date. Cannot create attendance record.'));
                }

                // Check if already clocked in today
                $existingRecord = AttendanceRecord::where('employee_id', $validated['employee_id'])
                    ->where('date', $today)
                    ->first();

                if ($existingRecord && $existingRecord->clock_in) {
                    return redirect()->back()->with('error', __('Already clocked in today.'));
                }

                // Get employee with shift and policy
                $employee = \App\Models\Employee::where('user_id', $validated['employee_id'])->first();

                if (! $employee) {
                    return redirect()->back()->with('error', __('Employee profile not found.'));
                }

                // Use employee's assigned shift and policy, or get defaults
                $shift = $employee->shift_id ?
                    Shift::find($employee->shift_id) :
                    Shift::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

                $policy = $employee->attendance_policy_id ?
                    AttendancePolicy::find($employee->attendance_policy_id) :
                    AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())->where('status', 'active')->first();

                if (! $shift || ! $policy) {
                    return redirect()->back()->with('error', __('No active shift or attendance policy found. Please contact HR.'));
                }

                if ($existingRecord) {
                    $existingRecord->update([
                        'clock_in' => $now->format('H:i:s'),
                        'shift_id' => $shift->id,
                        'attendance_policy_id' => $policy->id,
                        'status' => 'present',
                    ]);
                    $record = $existingRecord;
                } else {
                    $record = AttendanceRecord::create([
                        'employee_id' => $validated['employee_id'],
                        'date' => $today,
                        'clock_in' => $now->format('H:i:s'),
                        'shift_id' => $shift->id,
                        'attendance_policy_id' => $policy->id,
                        'is_weekend' => $today->isWeekend(),
                        'status' => 'present',
                        'created_by' => creatorId(),
                    ]);
                }

                // Check for late arrival if methods exist
                if (method_exists($record, 'checkLateArrival')) {
                    $record->checkLateArrival();
                    $record->save();
                }

                return redirect()->back()->with('success', __('Clocked in successfully.'));
            } catch (\Exception $e) {
                \Log::error('Clock in failed: '.$e->getMessage());

                return redirect()->back()->with('error', __('Failed to clock in. Please try again.'));
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    public function clockOut(Request $request)
    {
        if (Auth::user()->can('clock-in-out')) {
            try {
                $validated = $request->validate([
                    'employee_id' => 'required|exists:users,id',
                ]);

                $today = Carbon::today();
                $now = Carbon::now();

                $record = AttendanceRecord::where('employee_id', $validated['employee_id'])
                    ->where('date', $today)
                    ->first();

                if (! $record || ! $record->clock_in) {
                    return redirect()->back()->with('error', __('Must clock in first.'));
                }

                if ($record->clock_out) {
                    return redirect()->back()->with('error', __('Already clocked out today.'));
                }

                $record->update([
                    'clock_out' => $now->format('H:i:s'),
                ]);

                // Process complete attendance calculation if method exists
                if (method_exists($record, 'processAttendance')) {
                    $record->processAttendance();
                }

                return redirect()->back()->with('success', __('Clocked out successfully.'));
            } catch (\Exception $e) {
                \Log::error('Clock out failed: '.$e->getMessage());

                return redirect()->back()->with('error', __('Failed to clock out. Please try again.'));
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }

    }

    public function getTodayAttendance(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
        ]);

        $today = Carbon::today();
        $attendance = AttendanceRecord::where('employee_id', $validated['employee_id'])
            ->where('date', $today)
            ->first();

        return Inertia::render('employee-dashboard', [
            'attendance' => $attendance,
        ]);
    }
}
