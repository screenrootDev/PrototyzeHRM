import React, { useState } from "react";
import { PageTemplate } from "@/components/page-template";
import {
  RefreshCw,
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  Building2,
  HardDrive,
  ShieldCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Clock,
  ArrowRight,
  Kanban,
  ListFilter,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { router, Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

interface SuperAdminDashboardData {
  stats: {
    totalEmployees: number;
    onLeaveToday: number;
    absentToday: number;
    totalUsers: number;
    totalCompanies: number;
    storageUsage: {
      used: string;
      percentage: number;
    };
    systemStatus: "healthy" | "warning" | "critical";
  };
  companyDistribution: Array<{
    name: string;
    count: number;
  }>;
  activities?: Array<{
    id: number;
    title: string;
    time: string;
    type: "user" | "company" | "system";
  }>;
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
}

export default function SuperAdminDashboard({
  dashboardData,
}: {
  dashboardData: SuperAdminDashboardData;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.reload({ only: ["dashboardData"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const pageActions = [
    {
      label: "Refresh",
      icon: (
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      ),
      variant: "outline" as const,
      onClick: handleRefresh,
    },
  ];

  const stats = dashboardData.stats;
  const companyData = dashboardData.companyDistribution || [];
  
  const recentTickets = dashboardData.recentTickets || [];
  const weeklyPendingTickets = dashboardData.weeklyPendingTickets || [];
  const ticketChartData = dashboardData.ticketChartData || [];

  const getStatusBadgeColor = (status: string) => {
      switch(status) {
          case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
          case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-purple-100 text-purple-800 border-purple-200';
      }
  };

  const getPriorityBadgeColor = (priority: string) => {
      switch(priority) {
          case 'low': return 'bg-green-100 text-green-800 border-green-200';
          case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
          case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
  };

  // Colors for chart bars
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  return (
    <PageTemplate
      title="System Dashboard"
      url="/dashboard"
      actions={pageActions}
    >
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Employees"
            value={stats.totalEmployees}
            icon={<Users />}
            bgColor="bg-emerald-500/15"
            iconBgColor="bg-emerald-500"
            decorativeIcon={<Kanban className="w-32 h-32 text-emerald-500" />}
            trend={{ label: "+2% this month", isPositive: true }}
          />
          <StatCard
            title="On Leave"
            value={stats.onLeaveToday}
            icon={<UserMinus />}
            bgColor="bg-orange-500/15"
            iconBgColor="bg-orange-500"
            decorativeIcon={<ListFilter className="w-32 h-32 text-orange-500" />}
            trend={{ label: "-1% vs last week", isPositive: true }}
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={<Building2 />}
            bgColor="bg-purple-500/15"
            iconBgColor="bg-purple-500"
            decorativeIcon={<ListFilter className="w-32 h-32 text-purple-500" />}
            trend={{ label: "+1 this month", isPositive: true }}
          />

          <StatCard
            title="Storage"
            value={stats.storageUsage.used}
            icon={<HardDrive />}
            bgColor="bg-blue-500/15"
            iconBgColor="bg-blue-500"
            decorativeIcon={<Kanban className="w-32 h-32 text-blue-500" />}
            footer={
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 h-1 flex-1 bg-white/50 rounded-full overflow-hidden mr-3">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${stats.storageUsage.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                    {stats.storageUsage.percentage}%
                  </p>
                </div>
              </div>
            }
          />

          <StatCard
            title="Health"
            value={stats.systemStatus}
            icon={<ShieldCheck />}
            bgColor={
              stats.systemStatus === "healthy"
                ? "bg-emerald-500/15"
                : "bg-amber-500/15"
            }
            iconBgColor={
              stats.systemStatus === "healthy"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }
            decorativeIcon={<Kanban className={cn("w-32 h-32", stats.systemStatus === "healthy" ? "text-emerald-500" : "text-amber-500")} />}
            isStatus
          />
        </div>

        {/* Bottom Section - Chart & Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/50 shadow-sm overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Employees By Company
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Workforce distribution across companies
              </p>
            </div>
            <CardContent className="p-8 h-[450px]">
              {companyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={companyData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      width={140}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl">
                              <p className="text-xs font-bold text-foreground mb-1">
                                {payload[0].payload.name}
                              </p>
                              <p className="text-sm font-black text-primary">
                                {payload[0].value}{" "}
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  Employees
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {companyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-background border border-border/50 h-24 w-24 rounded-3xl flex items-center justify-center shadow-2xl">
                      <Activity className="h-10 w-10 text-primary/40 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-base font-bold text-foreground">
                      Gathering Intelligence
                    </p>
                    <p className="text-xs text-muted-foreground/60 max-w-[200px] leading-relaxed">
                      Syncing organizational structure and mapping employee
                      distribution...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions Panel */}
          <div className="lg:col-span-1">
            <QuickActionsPanel />
          </div>
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
                                    className="block p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-all relative overflow-hidden"
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
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeColor(ticket.priority)}`}>
                                                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
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
                                                        <span className="text-border">•</span>
                                                    </>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">From:</span>
                                                    <span>{ticket.creator}</span>
                                                </div>
                                                <span className="text-border">•</span>
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
                            <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                                <Activity className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-foreground mb-1">No recent activity</p>
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
                                        className="block p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-all group relative overflow-hidden"
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
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeColor(ticket.priority)}`}>
                                                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
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
                                                            <span className="text-border">•</span>
                                                        </>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">From:</span>
                                                        <span>{ticket.creator}</span>
                                                    </div>
                                                    <span className="text-border">•</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-orange-600 dark:text-orange-400">Waiting:</span>
                                                        <span className="text-orange-600 dark:text-orange-400 font-medium">{timeDisplay}</span>
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
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-100/10 flex items-center justify-center mb-3">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="font-medium text-foreground mb-1">All caught up!</p>
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
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--background))', 
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '8px'
                                    }} 
                                />
                                <Legend />
                                <Line type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} />
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
      </div>
    </PageTemplate>
  );
}

function StatCard({
  title,
  value,
  icon,
  bgColor,
  iconBgColor,
  decorativeIcon,
  footer,
  isStatus = false,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  decorativeIcon?: React.ReactNode;
  footer?: React.ReactNode;
  isStatus?: boolean;
  trend?: { label: string; isPositive: boolean };
}) {
  return (
    <Card className={cn("relative overflow-hidden border-none shadow-sm transition-all duration-300 hover:shadow-md", bgColor)}>
      {decorativeIcon && (
        <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10 pointer-events-none">
          {decorativeIcon}
        </div>
      )}
      
      <CardContent className="p-6 flex flex-col relative z-10 h-full">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-5 shadow-sm", iconBgColor)}>
          {React.cloneElement(icon as React.ReactElement, {
            className: "h-6 w-6 text-white",
          })}
        </div>
        
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-1">
            {isStatus && (
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full animate-ping absolute opacity-75",
                    value === "healthy" ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full relative",
                    value === "healthy" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
              </div>
            )}
            <h5 className={cn("text-lg font-semibold text-slate-800 dark:text-slate-200", isStatus && "capitalize")}>
              {typeof value === "number" ? value.toLocaleString() : value || 0}
            </h5>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {title}
          </p>
          
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span
                className={cn(
                  "text-xs font-semibold",
                  trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.label}
              </span>
            </div>
          )}
          {footer && <div className="mt-4">{footer}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsPanel() {
  const mockActivities = [
    { id: 1, title: "Acme Corp onboarding completed", time: "2 hours ago", type: "company" },
    { id: 2, title: "System backup successful", time: "4 hours ago", type: "system" },
    { id: 3, title: "John Doe admin login", time: "5 hours ago", type: "user" },
    { id: 4, title: "Globex Corp added 5 employees", time: "1 day ago", type: "company" },
  ];

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-border/50 bg-muted/20">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>
      </div>
      <CardContent className="p-6 flex-1 flex flex-col gap-6">
        <div className="grid gap-3">
          <Link
            href={route('companies.index')}
            className="flex w-full text-left items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Add New Company</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </Link>
          <Link
            href={route('settings')}
            className="flex w-full text-left items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Settings className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">System Settings</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="flex-1">
          <h4 className="text-xs font-black text-muted-foreground uppercase mb-4 tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Recent Activity
          </h4>
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activity.type === "company" ? "bg-emerald-500" :
                    activity.type === "system" ? "bg-purple-500" : "bg-blue-500"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none mb-1 text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
