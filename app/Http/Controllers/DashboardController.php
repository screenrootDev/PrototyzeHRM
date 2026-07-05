<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\Branch;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\JobPosting;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Models\Meeting;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;


class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Super admin, company, and employee always get dashboard
        if ($user->type === 'superadmin' || $user->type === 'super admin' || $user->type === 'company' || $user->type === 'employee') {
            return $this->renderDashboard();
        }

        // Check if user has dashboard permission (skip if permission doesn't exist)
        try {
            if ($user->hasPermissionTo('manage-dashboard')) {
                return $this->renderDashboard();
            }
        } catch (\Exception $e) {
            // Permission doesn't exist, continue to dashboard for authenticated users
            return $this->renderDashboard();
        }

        // Redirect to first available page
        return $this->redirectToFirstAvailablePage();
    }

    public function redirectToFirstAvailablePage()
    {
        $user = auth()->user();

        // Define available routes with their permissions
        $routes = [
            ['route' => 'users.index', 'permission' => 'manage-users'],
            ['route' => 'roles.index', 'permission' => 'manage-roles'],

            ['route' => 'settings.index', 'permission' => 'manage-settings'],
        ];

        // Find first available route
        foreach ($routes as $routeData) {
            if ($user->hasPermissionTo($routeData['permission'])) {
                return redirect()->route($routeData['route']);
            }
        }

        // If no permissions found, logout user
        auth()->logout();
        return redirect()->route('login')->with('error', __('No access permissions found.'));
    }

    private function renderDashboard()
    {
        $user = auth()->user();

        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderSuperAdminDashboard();
        } else {
            return $this->renderCompanyDashboard();
        }
    }

    private function renderSuperAdminDashboard()
    {
        // Get organizational statistics
        $totalEmployees = User::where('type', 'employee')->count();
        $totalUsers = User::count();

        // On Leave Today
        $onLeaveToday = LeaveApplication::where('status', 'approved')
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>=', today())
            ->count();

        // Present Today (Attendance)
        $presentToday = AttendanceRecord::whereDate('date', today())
            ->where('status', 'present')
            ->count();

        // Absent Today (Total - Present - On Leave)
        $absentToday = max(0, $totalEmployees - $presentToday - $onLeaveToday);

        // Total Companies
        $totalCompanies = User::where('type', 'company')->count();

        // Storage Usage
        $totalSpace = disk_total_space(base_path());
        $freeSpace = disk_free_space(base_path());
        $usedSpace = $totalSpace - $freeSpace;
        $storageUsedFormatted = $this->formatBytes($usedSpace);
        $storagePercentage = round(($usedSpace / $totalSpace) * 100, 1);

        // Combined Recent Activity
        $recentHires = Employee::with(['user', 'designation'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => 'hire_' . $emp->id,
                    'name' => $emp->user->name ?? 'New Employee',
                    'type' => 'hire',
                    'description' => "Joined as " . ($emp->designation->name ?? 'Team Member'),
                    'timestamp' => $emp->created_at->diffForHumans(),
                    'raw_time' => $emp->created_at
                ];
            });

        $recentLeaves = LeaveApplication::with(['employee', 'leaveType'])
            ->where('status', 'approved')
            ->orderBy('updated_at', 'desc')
            ->take(3)
            ->get()
            ->map(function ($leave) {
                return [
                    'id' => 'leave_' . $leave->id,
                    'name' => $leave->employee->name ?? 'Employee',
                    'type' => 'leave',
                    'description' => "Leave approved: " . ($leave->leaveType->title ?? 'General'),
                    'timestamp' => $leave->updated_at->diffForHumans(),
                    'raw_time' => $leave->updated_at
                ];
            });

        $recentAnnouncements = Announcement::orderBy('created_at', 'desc')
            ->take(2)
            ->get()
            ->map(function ($ann) {
                return [
                    'id' => 'ann_' . $ann->id,
                    'name' => 'Announcement',
                    'type' => 'announcement',
                    'description' => $ann->title,
                    'timestamp' => $ann->created_at->diffForHumans(),
                    'raw_time' => $ann->created_at
                ];
            });

        $recentActivity = $recentHires->concat($recentLeaves)->concat($recentAnnouncements)
            ->sortByDesc('raw_time')
            ->take(10)
            ->values();

        $companyDistribution = \App\Models\User::where('type', 'company')
            ->leftJoin('employees', 'users.id', '=', 'employees.created_by')
            ->select('users.name', \DB::raw('count(employees.id) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderBy('count', 'desc')
            ->get();

        // Helpdesk Tickets Logic
        $recentTickets = \App\Models\HelpdeskTicket::with(['creator', 'category'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'ticket_id' => $ticket->ticket_id,
                    'title' => $ticket->title,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'category' => $ticket->category->name ?? 'General',
                    'category_color' => $ticket->category->color ?? '#3b82f6',
                    'creator' => $ticket->creator->name ?? 'Unknown',
                    'created_at' => $ticket->created_at->diffForHumans(),
                ];
            });

        $weeklyPendingTickets = \App\Models\HelpdeskTicket::with(['creator', 'category'])
            ->whereIn('status', ['open', 'in_progress'])
            ->orderBy('created_at', 'asc')
            ->take(5)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'ticket_id' => $ticket->ticket_id,
                    'title' => $ticket->title,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'category' => $ticket->category->name ?? 'General',
                    'category_color' => $ticket->category->color ?? '#3b82f6',
                    'creator' => $ticket->creator->name ?? 'Unknown',
                    'created_at' => $ticket->created_at->diffForHumans(),
                    'last_reply_at' => $ticket->updated_at->diffForHumans(),
                    'days_pending' => $ticket->created_at->diffInDays(now()) + ($ticket->created_at->diffInHours(now()) / 24),
                ];
            });

        $ticketChartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $created = \App\Models\HelpdeskTicket::whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();
            $resolved = \App\Models\HelpdeskTicket::whereMonth('resolved_at', $month->month)
                ->whereYear('resolved_at', $month->year)
                ->count();
            $ticketChartData[] = [
                'month' => $month->format('M'),
                'created' => $created,
                'resolved' => $resolved
            ];
        }

        $dashboardData = [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'onLeaveToday' => $onLeaveToday,
                'absentToday' => $absentToday,
                'totalUsers' => $totalUsers,
                'totalCompanies' => $totalCompanies,
                'storageUsage' => [
                    'used' => $storageUsedFormatted,
                    'percentage' => $storagePercentage
                ],
                'systemStatus' => 'healthy'
            ],
            'companyDistribution' => $companyDistribution,
            'recentActivity' => $recentActivity,
            'upcomingEvents' => $this->getUpcomingEvents(),
            'recentTickets' => $recentTickets,
            'weeklyPendingTickets' => $weeklyPendingTickets,
            'ticketChartData' => $ticketChartData,
        ];

        return Inertia::render('superadmin/dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    private function getUpcomingEvents($companyUserIds = null)
    {
        $events = [];
        $today = now();
        $next7Days = now()->addDays(7);

        // Birthdays (matching month and day)
        $birthdays = Employee::with('user')
            ->when($companyUserIds, function($query) use ($companyUserIds) {
                return $query->whereIn('created_by', $companyUserIds);
            })
            ->whereRaw("DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN ? AND ?", [
                $today->format('m-d'),
                $next7Days->format('m-d')
            ])
            ->get();

        foreach ($birthdays as $emp) {
            $events[] = [
                'id' => 'bday_' . $emp->id,
                'type' => 'birthday',
                'name' => $emp->user->name ?? 'Employee',
                'date' => Carbon::parse($emp->date_of_birth)->format('M d'),
                'isToday' => Carbon::parse($emp->date_of_birth)->format('m-d') === $today->format('m-d')
            ];
        }

        // Anniversaries (matching month and day, excluding current year hires)
        $anniversaries = Employee::with('user')
            ->when($companyUserIds, function($query) use ($companyUserIds) {
                return $query->whereIn('created_by', $companyUserIds);
            })
            ->whereRaw("DATE_FORMAT(date_of_joining, '%m-%d') BETWEEN ? AND ?", [
                $today->format('m-d'),
                $next7Days->format('m-d')
            ])
            ->whereYear('date_of_joining', '<', $today->year)
            ->get();

        foreach ($anniversaries as $emp) {
            $events[] = [
                'id' => 'anniv_' . $emp->id,
                'type' => 'anniversary',
                'name' => $emp->user->name ?? 'Employee',
                'date' => Carbon::parse($emp->date_of_joining)->format('M d'),
                'isToday' => Carbon::parse($emp->date_of_joining)->format('m-d') === $today->format('m-d')
            ];
        }

        // Holidays
        $holidays = Holiday::whereBetween('start_date', [$today->toDateString(), $next7Days->toDateString()])
            ->when($companyUserIds, function($query) use ($companyUserIds) {
                return $query->whereIn('created_by', $companyUserIds);
            })->get();
        foreach ($holidays as $holiday) {
            $events[] = [
                'id' => 'hday_' . $holiday->id,
                'type' => 'holiday',
                'name' => $holiday->name,
                'date' => Carbon::parse($holiday->start_date)->format('M d'),
                'isToday' => Carbon::parse($holiday->start_date)->isToday()
            ];
        }

        return collect($events)->sortBy('date')->values()->all();
    }

    private function getCalendarEvents($companyUserIds = null)
    {
        $events = [];
        $startOfMonth = now()->startOfMonth()->subDays(7);
        $endOfMonth = now()->endOfMonth()->addDays(7);

        // Fetch Holidays
        $holidays = \App\Models\Holiday::whereBetween('start_date', [$startOfMonth, $endOfMonth])
            ->when($companyUserIds, function($query) use ($companyUserIds) {
                return $query->whereIn('created_by', $companyUserIds);
            })->get();
            
        foreach ($holidays as $holiday) {
            $events[] = [
                'id' => 'hol_' . $holiday->id,
                'title' => $holiday->name,
                'start' => $holiday->start_date,
                'end' => $holiday->end_date ?? $holiday->start_date,
                'backgroundColor' => '#22c55e', // green
                'borderColor' => '#22c55e',
                'allDay' => true
            ];
        }

        // Fetch Meetings
        $meetings = \App\Models\Meeting::whereBetween('meeting_date', [$startOfMonth, $endOfMonth])
            ->when($companyUserIds, function($query) use ($companyUserIds) {
                return $query->whereIn('created_by', $companyUserIds);
            })->get();

        foreach ($meetings as $meeting) {
            $events[] = [
                'id' => 'meet_' . $meeting->id,
                'title' => $meeting->title,
                'start' => $meeting->meeting_date . 'T' . $meeting->start_time,
                'end' => $meeting->meeting_date . 'T' . $meeting->end_time,
                'backgroundColor' => '#8b5cf6', // purple
                'borderColor' => '#8b5cf6',
                'allDay' => false
            ];
        }

        // Birthdays
        $birthdays = \App\Models\Employee::with('user')
            ->when($companyUserIds, function($query) use ($companyUserIds) {
                return $query->whereIn('created_by', $companyUserIds);
            })->get();
            
        foreach ($birthdays as $emp) {
            if ($emp->date_of_birth) {
                $dob = \Carbon\Carbon::parse($emp->date_of_birth);
                $bdayThisYear = \Carbon\Carbon::create(now()->year, $dob->month, $dob->day);
                $events[] = [
                    'id' => 'bday_' . $emp->id,
                    'title' => ($emp->user->name ?? 'Staff') . ' Birthday',
                    'start' => $bdayThisYear->format('Y-m-d'),
                    'backgroundColor' => '#ef4444', // red
                    'borderColor' => '#ef4444',
                    'allDay' => true
                ];
            }
        }

        return $events;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    private function renderCompanyDashboard()
    {
        $user = auth()->user();

        // If user is employee, show limited dashboard
        if ($user->type === 'employee') {
            return $this->renderEmployeeDashboard();
        }

        $companyUserIds = $this->getCompanyUserIds();

        // Core HR Statistics
        $totalEmployees = User::where('type', 'employee')->whereIn('created_by', $companyUserIds)->count();
        $totalBranches = Branch::whereIn('created_by', $companyUserIds)->count();
        $totalDepartments = Department::whereIn('created_by', $companyUserIds)->count();

        // Monthly Statistics
        $newEmployeesThisMonth = Employee::whereIn('created_by', $companyUserIds)
            ->whereMonth('created_at', now()->month)->count();
        $jobPostsThisMonth = JobPosting::whereIn('created_by', $companyUserIds)
            ->whereMonth('created_at', now()->month)->count();
        $candidatesThisMonth = Candidate::whereIn('created_by', $companyUserIds)
            ->whereMonth('created_at', now()->month)->count();

        // Attendance Statistics
        $presentToday = AttendanceRecord::whereIn('created_by', $companyUserIds)
            ->whereDate('date', today())->where('status', 'present')->count();

        $attendanceRate = $totalEmployees > 0 ? round(($presentToday / $totalEmployees) * 100, 1) : 0;

        // Leave Statistics
        $pendingLeaves = LeaveApplication::whereIn('created_by', $companyUserIds)
            ->where('status', 'pending')->count();


        $onLeaveToday = LeaveApplication::whereIn('created_by', $companyUserIds)
            ->where('status', 'approved');

        if (config('app.is_demo') == true) {
            $onLeaveToday = $onLeaveToday->count();
        } else {
            $onLeaveToday = $onLeaveToday->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())->count();
        }

        // Recruitment Statistics
        $activeJobPostings = JobPosting::whereIn('created_by', $companyUserIds)
            ->where('status', 'Published')->count();
        $totalCandidates = Candidate::whereIn('created_by', $companyUserIds)->count();

        // Designation Distribution for Chart
        $predefinedColors = ['#4F46E5', '#0075BD', '#F59E0B', '#EF4444', '#3B82F6', '#D946EF'];

        $designationStats = Designation::whereIn('created_by', $companyUserIds)
            ->withCount('employees')
            ->with('department')
            ->orderBy('employees_count', 'desc')
            ->when(config('app.is_demo') == true, function ($query) {
                return $query->take(6);
            })
            ->get()
            ->map(function ($desig, $index) use ($predefinedColors) {
                $displayName = $desig->name;
                if ($desig->department) {
                    $displayName .= ' (' . $desig->department->name . ')';
                }
                return [
                    'name' => $displayName,
                    'value' => $desig->employees_count,
                    'color' => $predefinedColors[$index % count($predefinedColors)]
                ];
            });


        // Monthly Hiring Trend for Chart (last 6 months)
        $hiringTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $count = Employee::whereIn('created_by', $companyUserIds)
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();
            $hiringTrend[] = [
                'month' => $month->format('M Y'),
                'hires' => $count
            ];
        }

        // Candidate Status Distribution for Chart
        $candidateStatusStats = Candidate::whereIn('created_by', $companyUserIds)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                $colors = [
                    'New' => '#3B82F6',
                    'Screening' => '#06B6D4',
                    'Interview' => '#6366F1',
                    'Offer' => '#F59E0B',
                    'Hired' => '#0075BD',
                    'Rejected' => '#EF4444'
                ];
                return [
                    'name' => $item->status,
                    'value' => $item->count,
                    'color' => $colors[$item->status] ?? '#6b7280'
                ];
            });


        // Leave Types for Chart
        $leaveTypesStats = LeaveType::whereIn('created_by', $companyUserIds)
            ->get()
            ->map(function ($leaveType) {
                return [
                    'name' => $leaveType->name,
                    'value' => $leaveType->max_days_per_year,
                    'color' => $leaveType->color ?: '#' . substr(md5($leaveType->name), 0, 6)
                ];
            });

        // Employee Growth Chart (Monthly for current year)
        if (isDemo()) {
            $employeeGrowthChart = [
                ['month' => 'January', 'employees' => 15],
                ['month' => 'February', 'employees' => 5],
                ['month' => 'March', 'employees' => 22],
                ['month' => 'April', 'employees' => 10],
                ['month' => 'May', 'employees' => 28],
                ['month' => 'June', 'employees' => 32],
                ['month' => 'July', 'employees' => 35],
                ['month' => 'August', 'employees' => 50],
                ['month' => 'September', 'employees' => 42],
                ['month' => 'October', 'employees' => 45],
                ['month' => 'November', 'employees' => 48],
                ['month' => 'December', 'employees' => 52]
            ];
        } else {
            $employeeGrowthChart = [];
            for ($month = 1; $month <= 12; $month++) {
                $count = User::where('type', 'employee')
                    ->whereIn('created_by', $companyUserIds)
                    ->whereMonth('created_at', $month)
                    ->whereYear('created_at', now()->year)
                    ->count();
                $employeeGrowthChart[] = [
                    'month' => date('F', mktime(0, 0, 0, $month, 1)),
                    'employees' => $count
                ];
            }
        }

        // Recent Activities
        $recentLeaves = LeaveApplication::whereIn('created_by', $companyUserIds)
            ->with('employee');
            
        if ($user->type === 'employee') {
            $recentLeaves = $recentLeaves->whereIn('status', ['approved', 'absent'])->get();
        } else {
            $recentLeaves = $recentLeaves->whereIn('status', ['approved', 'absent'])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();
        }

        // Recent Leave Applications (All statuses)
        $recentLeaveApplications = LeaveApplication::whereIn('created_by', $companyUserIds)
            ->with(['employee.employee', 'leaveType'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $recentCandidates = Candidate::whereIn('created_by', $companyUserIds)
            ->with(['job'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        $pendingLeavesList = LeaveApplication::whereIn('created_by', $companyUserIds)
            ->where('status', 'pending')
            ->with(['employee', 'leaveType'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        $onboardingStatus = [
            ['name' => 'Alice Johnson', 'role' => 'Software Engineer', 'progress' => 80],
            ['name' => 'Bob Smith', 'role' => 'Marketing Specialist', 'progress' => 45],
            ['name' => 'Charlie Brown', 'role' => 'Sales Representative', 'progress' => 100]
        ];

        $todoList = [
            ['id' => 1, 'task' => 'Review Payroll for May', 'completed' => false],
            ['id' => 2, 'task' => 'Schedule interview with John Doe', 'completed' => true],
            ['id' => 3, 'task' => 'Approve pending leave requests', 'completed' => false]
        ];

        // Recent Announcements
        $recentAnnouncements = Announcement::whereIn('created_by', $companyUserIds)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent Meetings
        $recentMeetings = Meeting::whereIn('created_by', $companyUserIds)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Today's Leaves
        $todayLeaves = LeaveApplication::whereIn('created_by', $companyUserIds)
            ->with(['employee.employee', 'leaveType'])
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>=', today())
            ->get();

        // Missing Attendance Today
        $missingAttendance = AttendanceRecord::whereIn('created_by', $companyUserIds)
            ->with(['employee.employee'])
            ->whereDate('date', today())
            ->where(function($q) {
                $q->where('status', 'absent')->orWhere('is_absent', true);
            })
            ->get();

        $dashboardData = [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'totalBranches' => $totalBranches,
                'totalDepartments' => $totalDepartments,
                'newEmployeesThisMonth' => $newEmployeesThisMonth,
                'jobPostsThisMonth' => $jobPostsThisMonth,
                'candidatesThisMonth' => $candidatesThisMonth,
                'attendanceRate' => $attendanceRate,
                'presentToday' => $presentToday,
                'pendingLeaves' => $pendingLeaves,
                'onLeaveToday' => $onLeaveToday,
                'activeJobPostings' => $activeJobPostings,
                'totalCandidates' => $totalCandidates
            ],
            'charts' => [
                'designationStats' => $designationStats,
                'hiringTrend' => $hiringTrend,
                'candidateStatusStats' => $candidateStatusStats,
                'leaveTypesStats' => $leaveTypesStats,
                'employeeGrowthChart' => $employeeGrowthChart
            ],
            'recentActivities' => [
                'leaves' => $recentLeaves,
                'candidates' => $recentCandidates,
                'announcements' => $recentAnnouncements,
                'meetings' => $recentMeetings,
                'pendingLeavesList' => $pendingLeavesList,
                'todayLeaves' => $todayLeaves,
                'missingAttendance' => $missingAttendance
            ],
            'upcomingEvents' => $this->getUpcomingEvents($companyUserIds),
            'calendarEvents' => $this->getCalendarEvents($companyUserIds),
            'recentLeaveApplications' => $recentLeaveApplications,
            'onboardingStatus' => $onboardingStatus,
            'todoList' => $todoList,
            'userType' => $user->type
        ];

        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    private function renderEmployeeDashboard()
    {
        $user = auth()->user();
        $companyUserIds = $this->getCompanyUserIds();

        // Recent Announcements
        $recentAnnouncements = \App\Models\Announcement::whereIn('created_by', $companyUserIds)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent Meetings - get meetings where user is organizer
        $recentMeetings = \App\Models\Meeting::with('attendees')
            ->whereIn('created_by', $companyUserIds)
            ->where('organizer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get meetings where user is attendee
        $meetingAttendee = \App\Models\MeetingAttendee::with('meeting')
            ->where('user_id', $user->id)
            ->get();


        // Extract meetings from attendee records
        $attendeeMeetings = $meetingAttendee->pluck(value: 'meeting')->filter();

        // Merge and remove duplicates
        $recentMeetings = $recentMeetings->merge($attendeeMeetings)
            ->unique('id')
            ->filter(function ($meeting) {
                return $meeting->meeting_date >= today();
            })
            ->sortByDesc('created_at')
            ->values();

        // Employee Stats
        $totalAwards = \App\Models\Award::where('employee_id', $user->id)->count();
        $totalWarnings = \App\Models\Warning::where('employee_id', $user->id)->count();
        $totalComplaints = \App\Models\Complaint::where('against_employee_id', $user->id)->count();

        // Get shifts and attendance policies for clock in functionality
        $shifts = \App\Models\Shift::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->get(['id', 'name', 'start_time', 'end_time']);

        $attendancePolicies = \App\Models\AttendancePolicy::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->get(['id', 'name']);

        // Get today's attendance for the employee
        $todayAttendance = \App\Models\AttendanceRecord::where('employee_id', $user->id)
            ->where('date', \Carbon\Carbon::today())
            ->first();

        // Get employee's assigned shift
        $employeeShift = null;
        $employee = \App\Models\Employee::where('user_id', $user->id)->first();
        if ($employee && $employee->shift_id) {
            $employeeShift = \App\Models\Shift::find($employee->shift_id);
        }

        // Auto clock out previous days like yesterday and alll thing if not clocked out
        $previousAttendance = \App\Models\AttendanceRecord::where('employee_id', $user->id)
            ->where('date', '<', \Carbon\Carbon::today())
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->get();

        foreach ($previousAttendance as $record) {
            $recordDate = \Carbon\Carbon::parse($record->date);
            $shift = \App\Models\Shift::find($record->shift_id) ?? $employeeShift;

            if ($shift) {
                $record->update([
                    'clock_out' => $shift->end_time,
                ]);

                if (method_exists($record, 'processAttendance')) {
                    $record->processAttendance();
                }
            }
        }

        // Auto clock out if shift end time has passed for today
        if ($todayAttendance && $todayAttendance->clock_in && !$todayAttendance->clock_out && $employeeShift) {
            $now = \Carbon\Carbon::now();
            $shiftEndTime = \Carbon\Carbon::today()->setTimeFromTimeString($employeeShift->end_time);

            if ($now->greaterThan($shiftEndTime)) {
                $todayAttendance->update([
                    'clock_out' => $employeeShift->end_time,
                ]);

                if (method_exists($todayAttendance, 'processAttendance')) {
                    $todayAttendance->processAttendance();
                }

                $todayAttendance = $todayAttendance->fresh();
            }
        }

        $dashboardData = [
            'stats' => [
                'totalAwards' => $totalAwards,
                'totalWarnings' => $totalWarnings,
                'totalComplaints' => $totalComplaints
            ],
            'recentActivities' => [
                'announcements' => $recentAnnouncements,
                'meetings' => $recentMeetings
            ],
            'shifts' => $shifts,
            'attendancePolicies' => $attendancePolicies,
            'todayAttendance' => $todayAttendance,
            'currentTime' => \Carbon\Carbon::now()->format('H:i:s'),
            'employeeShift' => $employeeShift,
            'userType' => $user->type
        ];
        return Inertia::render('employee-dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    // private function getCompanyUserIds()
    // {
    //     $user = auth()->user();
    //     if ($user->type === 'company') {
    //         $companyUserIds = User::where('created_by', $user->id)->pluck('id')->toArray();
    //         $companyUserIds[] = $user->id;
    //         return $companyUserIds;
    //     } else {
    //         $userCreatedBy = User::where('id', $user->created_by)->value('id');
    //         $companyUserIds = User::where('created_by', $userCreatedBy)->pluck('id')->toArray();
    //         $companyUserIds[] = $userCreatedBy;
    //         return $companyUserIds;
    //     }
    // }


    private function getCompanyUserIds()
    {
        $user = auth()->user();
        if ($user->type === 'company') {
            $companyId = getCompanyId($user->id);
            if ($companyId) {
                $allUsers = getAllCompanyUsers($companyId);
                $allUsers[] = $companyId; // Include company itself
                return array_unique($allUsers);
            }
            return [];
        } else {
            $companyId = getCompanyId($user->id);
            if ($companyId) {
                $allUsers = getAllCompanyUsers($companyId);
                $allUsers[] = $companyId; // Include company itself
                return array_unique($allUsers);
            }
            return [];
        }
    }
}
