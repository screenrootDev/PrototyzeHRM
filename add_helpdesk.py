import re

with open('resources/js/pages/superadmin/dashboard.tsx', 'r') as f:
    content = f.read()

# Add ExternalLink to lucide-react imports
if 'ExternalLink' not in content:
    content = re.sub(
        r'(import \{\n?.*?)(RefreshCw,)',
        r'\1ExternalLink,\n  \2',
        content,
        flags=re.DOTALL
    )

# Add recharts imports for LineChart
if 'LineChart,' not in content:
    content = re.sub(
        r'(import \{\n?.*?BarChart,)',
        r'\1\n  LineChart,\n  Line,\n  CartesianGrid,\n  Legend,',
        content,
        flags=re.DOTALL
    )

# Add type definitions
interface_addition = """
  recentTickets?: Array<{
    id: number;
    ticket_id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    category_color: string;
    creator: string;
    created_at: string;
  }>;
  weeklyPendingTickets?: Array<{
    id: number;
    ticket_id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    category_color: string;
    creator: string;
    created_at: string;
    last_reply_at: string;
    days_pending: number;
  }>;
  ticketChartData?: Array<{
    month: string;
    created: number;
    resolved: number;
  }>;
"""
content = re.sub(
    r'(  companyDistribution: Array<\{\n    name: string;\n    count: number;\n  \}>;)',
    r'\1\n' + interface_addition,
    content
)

# Extract variables from dashboardData
var_addition = """
  const recentTickets = dashboardData.recentTickets || [];
  const weeklyPendingTickets = dashboardData.weeklyPendingTickets || [];
  const ticketChartData = dashboardData.ticketChartData || [];

  const getStatusBadgeColor = (status: string) => {
      switch(status) {
          case 'open': return 'bg-blue-100 text-blue-800';
          case 'in_progress': return 'bg-yellow-100 text-yellow-800';
          case 'resolved': return 'bg-green-100 text-green-800';
          case 'closed': return 'bg-gray-100 text-gray-800';
          default: return 'bg-purple-100 text-purple-800';
      }
  };

  const getPriorityBadgeColor = (priority: string) => {
      switch(priority) {
          case 'low': return 'bg-green-100 text-green-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'high': return 'bg-orange-100 text-orange-800';
          case 'urgent': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };
"""
content = re.sub(
    r'(  const companyData = dashboardData.companyDistribution \|\| \[\];)',
    r'\1\n' + var_addition,
    content
)

# Add JSX right after the existing grid (which ends with </Card> and <div className="lg:col-span-1">)
# I will find the end of the <div className="grid gap-6 lg:grid-cols-3"> section and add a new section after it
jsx_addition = """
        </div>

        {/* Helpdesk Section */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
            {/* Recent Helpdesk Activity */}
            <Card>
                <div className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                    <h3 className="text-lg font-bold">Recent Helpdesk Activity</h3>
                    {recentTickets && recentTickets.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {recentTickets.length} {recentTickets.length === 1 ? 'ticket' : 'tickets'}
                        </span>
                    )}
                </div>
                <CardContent className="p-6">
                    {recentTickets && recentTickets.length > 0 ? (
                        <div className="space-y-2">
                            {recentTickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/helpdesk/tickets/${ticket.id}`}
                                    className="block p-3 rounded-lg border hover:bg-accent/50 transition-all relative overflow-hidden"
                                >
                                    {ticket.category_color && (
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 w-1" 
                                            style={{ backgroundColor: ticket.category_color }}
                                        />
                                    )}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono text-blue-600 font-semibold">#{ticket.ticket_id}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(ticket.priority)}`}>
                                                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                                {ticket.title}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                {ticket.category && (
                                                    <>
                                                        <div className="flex items-center gap-1.5">
                                                            {ticket.category_color && (
                                                                <span 
                                                                    className="w-2 h-2 rounded-full flex-shrink-0" 
                                                                    style={{ backgroundColor: ticket.category_color }}
                                                                />
                                                            )}
                                                            <span className="font-medium">Category:</span>
                                                            <span>{ticket.category}</span>
                                                        </div>
                                                        <span className="text-gray-300">•</span>
                                                    </>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">From:</span>
                                                    <span>{ticket.creator}</span>
                                                </div>
                                                <span className="text-gray-300">•</span>
                                                <div className="flex items-center gap-1">
                                                    <span>{ticket.created_at}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">No recent activity</p>
                            <p className="text-sm">No tickets have been created yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tickets Awaiting Your Response */}
            <Card>
                <div className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                    <h3 className="text-lg font-bold">Tickets Awaiting Your Response</h3>
                    {weeklyPendingTickets && weeklyPendingTickets.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {weeklyPendingTickets.length} {weeklyPendingTickets.length === 1 ? 'ticket' : 'tickets'}
                        </span>
                    )}
                </div>
                <CardContent className="p-6">
                    {weeklyPendingTickets && weeklyPendingTickets.length > 0 ? (
                        <div className="space-y-2">
                            {weeklyPendingTickets.map((ticket) => {
                                const daysAgo = ticket.days_pending;
                                let timeDisplay = '';
                                
                                if (daysAgo < 1) {
                                    timeDisplay = 'Today';
                                } else if (daysAgo < 2) {
                                    timeDisplay = '1 day ago';
                                } else if (daysAgo < 30) {
                                    timeDisplay = `${Math.floor(daysAgo)} days ago`;
                                } else if (daysAgo < 60) {
                                    timeDisplay = '1 month ago';
                                } else if (daysAgo < 365) {
                                    timeDisplay = `${Math.floor(daysAgo / 30)} months ago`;
                                } else {
                                    timeDisplay = `${Math.floor(daysAgo / 365)} year${Math.floor(daysAgo / 365) > 1 ? 's' : ''} ago`;
                                }

                                return (
                                    <Link
                                        key={ticket.id}
                                        href={`/helpdesk/tickets/${ticket.id}`}
                                        className="block p-3 rounded-lg border hover:bg-accent/50 transition-all group relative overflow-hidden"
                                    >
                                        {ticket.category_color && (
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-1" 
                                                style={{ backgroundColor: ticket.category_color }}
                                            />
                                        )}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-mono text-blue-600 font-semibold">#{ticket.ticket_id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(ticket.priority)}`}>
                                                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                                    {ticket.title}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    {ticket.category && (
                                                        <>
                                                            <div className="flex items-center gap-1.5">
                                                                {ticket.category_color && (
                                                                    <span 
                                                                        className="w-2 h-2 rounded-full flex-shrink-0" 
                                                                        style={{ backgroundColor: ticket.category_color }}
                                                                    />
                                                                )}
                                                                <span className="font-medium">Category:</span>
                                                                <span>{ticket.category}</span>
                                                            </div>
                                                            <span className="text-gray-300">•</span>
                                                        </>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">From:</span>
                                                        <span>{ticket.creator}</span>
                                                    </div>
                                                    <span className="text-gray-300">•</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-orange-600">Waiting:</span>
                                                        <span className="text-orange-600 font-medium">{timeDisplay}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">All caught up!</p>
                            <p className="text-sm">No tickets awaiting response</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Monthly Ticket Trends */}
        <Card className="mt-6">
            <div className="p-6 border-b border-border/50">
                <h3 className="text-lg font-bold">Monthly Ticket Trends</h3>
            </div>
            <CardContent className="p-6">
                {ticketChartData && ticketChartData.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={ticketChartData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="created" name="Created" stroke="#3b82f6" activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No ticket trend data available
                    </div>
                )}
            </CardContent>
        </Card>
"""
content = content.replace(
    '          </div>\n        </div>',
    '          </div>\n        </div>\n' + jsx_addition
)

with open('resources/js/pages/superadmin/dashboard.tsx', 'w') as f:
    f.write(content)
