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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
  deptDistribution: Array<{
    name: string;
    count: number;
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
  const deptData = dashboardData.deptDistribution || [];

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
        {/* Top Stats Row - Refactored to 5 Columns */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Employees"
            value={stats.totalEmployees}
            icon={
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            }
            bgColor="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            title="On Leave"
            value={stats.onLeaveToday}
            icon={
              <UserMinus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            }
            bgColor="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            }
            bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          />

          <StatCard
            title="Storage"
            value={stats.storageUsage.used}
            icon={
              <HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            }
            bgColor="bg-purple-100 dark:bg-purple-900/30"
            footer={
              <div className="mt-3 w-full">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex gap-1 h-1 flex-1 bg-muted rounded-full overflow-hidden mr-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                      style={{ width: `${stats.storageUsage.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400">
                    {stats.storageUsage.percentage}%
                  </p>
                </div>
              </div>
            }
          />

          <StatCard
            title="Health"
            value={stats.systemStatus}
            icon={
              <ShieldCheck
                className={cn(
                  "h-5 w-5",
                  stats.systemStatus === "healthy"
                    ? "text-emerald-500"
                    : "text-amber-500",
                )}
              />
            }
            bgColor={
              stats.systemStatus === "healthy"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-amber-100 dark:bg-amber-900/30"
            }
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
              <p className="text-xs text-muted-foreground mt-1">
                Workforce distribution across the organization
              </p>
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
                      {deptData.map((entry, index) => (
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
  isStatus = false,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  footer?: React.ReactNode;
  isStatus?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-border/50 group bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity",
          bgColor,
        )}
      />
      <CardContent className="p-6 flex flex-col items-start gap-5 relative z-10">
        <div
          className={cn(
            "rounded-2xl p-3.5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
            bgColor,
          )}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: cn(
              (icon as React.ReactElement).props.className,
              "h-6 w-6",
            ),
          })}
        </div>
        <div className="flex-1 w-full space-y-1">
          <p className="text-[10px] font-extrabold text-muted-foreground/60 uppercase  mb-1">
            {title}
          </p>
          <div className="flex items-center gap-3">
            {isStatus && (
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full animate-ping absolute opacity-75",
                    value === "healthy" ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
                <div
                  className={cn(
                    "w-3 h-3 rounded-full relative shadow-sm",
                    value === "healthy" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
              </div>
            )}
            <h3
              className={cn(
                "text-3xl font-black tracking-tighter text-foreground truncate",
                isStatus && "capitalize text-2xl",
              )}
            >
              {typeof value === "number" ? value.toLocaleString() : value || 0}
            </h3>
          </div>
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}
