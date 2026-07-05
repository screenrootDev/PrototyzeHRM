import re

with open('app/Http/Controllers/DashboardController.php', 'r') as f:
    content = f.read()

ticket_logic = """
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
"""

content = re.sub(
    r"\$companyDistribution = \\App\\Models\\User.*?->get\(\);",
    ticket_logic,
    content,
    flags=re.DOTALL
)

dashboard_data_replacement = """        $dashboardData = [
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
        ];"""

content = re.sub(
    r"\$dashboardData = \[.*?\];",
    dashboard_data_replacement,
    content,
    count=1,
    flags=re.DOTALL
)

with open('app/Http/Controllers/DashboardController.php', 'w') as f:
    f.write(content)
