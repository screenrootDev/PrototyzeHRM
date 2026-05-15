import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  RefreshCw, 
  Users, 
  UserCheck, 
  UserMinus, 
  UserPlus, 
  Building2,
  HardDrive, 
  ShieldCheck, 
  Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

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
    systemStatus: 'healthy' | 'warning' | 'critical';
  };
  deptDistribution: Array<{
    name: string;
    count: number;
  }>;
}

export default function SuperAdminDashboard({ dashboardData }: { dashboardData: SuperAdminDashboardData }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.reload({ only: ['dashboardData'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const pageActions = [
    {
      label: 'Refresh',
      icon: <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />,
      variant: 'outline' as const,
      onClick: handleRefresh
    }
  ];

  const stats = dashboardData.stats;
  const deptData = dashboardData.deptDistribution || [];

  // Colors for chart bars
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <PageTemplate 
      title="System Dashboard"
      url="/dashboard"
      actions={pageActions}
    >
      <div className="space-y-8">
        {/* Top Stats Row - Refactored to 5 Columns */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard 
            title="Employees" 
            value={stats.totalEmployees} 
            icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            bgColor="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard 
            title="On Leave" 
            value={stats.onLeaveToday} 
            icon={<UserMinus className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
            bgColor="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard 
            title="Companies" 
            value={stats.totalCompanies} 
            icon={<Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          />
          
          <StatCard 
            title="Storage" 
            value={stats.storageUsage.used} 
            icon={<HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            bgColor="bg-purple-100 dark:bg-purple-900/30"
            footer={
              <div className="mt-2 w-full">
                <Progress value={stats.storageUsage.percentage} className="h-1" />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{stats.storageUsage.percentage}%</p>
              </div>
            }
          />

          <StatCard 
            title="Health" 
            value={stats.systemStatus} 
            icon={<ShieldCheck className={cn(
              "h-5 w-5",
              stats.systemStatus === 'healthy' ? "text-emerald-500" : "text-amber-500"
            )} />}
            bgColor={stats.systemStatus === 'healthy' ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}
            isStatus
          />
        </div>

        {/* Chart Section */}
        <div className="grid gap-6 lg:grid-cols-1">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Employees By Department
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Workforce distribution across the organization</p>
            </div>
            <CardContent className="p-8 h-[450px]">
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptData}
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
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl">
                              <p className="text-xs font-bold text-foreground mb-1">{payload[0].payload.name}</p>
                              <p className="text-sm font-black text-primary">{payload[0].value} <span className="text-[10px] font-normal text-muted-foreground">Employees</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[0, 6, 6, 0]} 
                      barSize={28}
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                  <Activity className="h-16 w-16 mb-4 animate-pulse" />
                  <p className="text-sm font-medium">Gathering organizational data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  footer, 
  isStatus = false 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  bgColor: string;
  footer?: React.ReactNode;
  isStatus?: boolean;
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-border/50 group">
      <CardContent className="p-6 flex flex-col items-start gap-4">
        <div className={cn("rounded-2xl p-3 shadow-sm transition-transform group-hover:scale-110", bgColor)}>
          {icon}
        </div>
        <div className="flex-1 w-full">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-center gap-2">
            {isStatus && (
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                value === 'healthy' ? "bg-emerald-500" : "bg-amber-500"
              )} />
            )}
            <h3 className={cn(
              "text-xl font-black tracking-tight text-foreground truncate",
              isStatus && "capitalize"
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value || 0}
            </h3>
          </div>
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}