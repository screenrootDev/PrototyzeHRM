import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { RefreshCw, Users, Briefcase, UserPlus, Calendar, Clock, TrendingUp, TrendingDown, BarChart3, Bell, ExternalLink, Copy, CheckCircle, UserCheck, UserX, CreditCard, AlertTriangle, Layers, Settings, PartyPopper, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { usePage, Link } from '@inertiajs/react';
import ReactApexChart from 'react-apexcharts';
import { hasPermission } from '@/utils/authorization';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CompanyDashboardData {
  stats: {
    totalEmployees: number;
    totalBranches: number;
    totalDepartments: number;
    newEmployeesThisMonth: number;
    jobPostsThisMonth: number;
    candidatesThisMonth: number;
    attendanceRate: number;
    presentToday: number;
    pendingLeaves: number;
    onLeaveToday: number;
    activeJobPostings: number;
    totalCandidates: number;
    totalPromotions?: number;
    terminations?: number;
  };
  charts: {
    designationStats: Array<{name: string; value: number; color: string}>;
    hiringTrend: Array<{month: string; hires: number}>;
    candidateStatusStats: Array<{name: string; value: number; color: string}>;
    leaveTypesStats: Array<{name: string; value: number; color: string}>;
    employeeGrowthChart: Array<{month: string; employees: number}>;
  };
  recentActivities: {
    leaves: Array<any>;
    candidates: Array<any>;
    announcements: Array<any>;
    meetings: Array<any>;
    pendingLeavesList?: Array<any>;
    todayLeaves?: Array<any>;
    todayBirthdays?: Array<{
      id: number;
      name: string;
      avatar?: string | null;
      designation: string;
    }>;
    missingAttendance?: Array<any>;
  };
  upcomingEvents?: Array<{
    id: string;
    type: string;
    name: string;
    date: string;
    isToday: boolean;
  }>;
  onboardingStatus?: Array<{
    name: string;
    role: string;
    progress: number;
  }>;
  todoList?: Array<{
    id: number;
    task: string;
    completed: boolean;
  }>;
  userType: string;
}

interface PageAction {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
}

function ActivityCard({ title, subtitle, href, children }: {
  title: string;
  subtitle: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-h-[390px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold leading-5 text-zinc-950 dark:text-zinc-50">{title}</CardTitle>
            <p className="mt-1 text-xs leading-4 text-zinc-500">{subtitle}</p>
          </div>
          <Link href={href} className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
            View all <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export default function Dashboard({ dashboardData }: { dashboardData: CompanyDashboardData }) {
  
  const { auth, companySlug, active_modules = [] } = usePage().props as any;
  const isModuleEnabled = (module: string) => active_modules.includes(module);
  const [copied, setCopied] = useState(false);

  const handleCopyCareerLink = () => {
    const careerUrl = companySlug ? 
      route('career.index', companySlug) : 
      route('career.index');
    navigator.clipboard.writeText(careerUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openCareerPage = () => {
    const careerUrl = companySlug ? 
      route('career.index', companySlug) : 
      route('career.index');
    window.open(careerUrl, '_blank');
  };

  const pageActions: PageAction[] = [
    {
      label: 'Refresh',
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => window.location.reload()
    }
  ];

  const stats = dashboardData?.stats || {
    totalEmployees: 0,
    totalBranches: 0,
    totalDepartments: 0,
    newEmployeesThisMonth: 0,
    jobPostsThisMonth: 0,
    candidatesThisMonth: 0,
    attendanceRate: 0,
    presentToday: 0,
    pendingLeaves: 0,
    onLeaveToday: 0,
    activeJobPostings: 0,
    totalCandidates: 0
  };

  const charts = dashboardData?.charts || {
    designationStats: [],
    hiringTrend: [],
    candidateStatusStats: [],
    leaveTypesStats: [],
    employeeGrowthChart: []
  };



  const recentActivities = dashboardData?.recentActivities || {
    leaves: [],
    candidates: [],
    announcements: [],
    meetings: [],
    pendingLeavesList: [],
    todayLeaves: [],
    todayBirthdays: [],
    missingAttendance: []
  };
  
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const onboardingStatus = dashboardData?.onboardingStatus || [];
  const todoList = dashboardData?.todoList || [];

  const userType = dashboardData?.userType || 'employee';
  const isCompanyUser = userType === 'company';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = auth?.user?.name || auth?.user?.first_name || (isCompanyUser ? 'Company' : 'Team');
  
  const getStatusColor = (status: string) => {
    const colors = {
      'approved': 'bg-green-50 text-green-700 ring-green-600/20',
      'pending': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      'rejected': 'bg-red-50 text-red-700 ring-red-600/20',
      'New': 'bg-blue-50 text-blue-700 ring-blue-600/20',
      'Screening': 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
      'Interview': 'bg-purple-50 text-purple-700 ring-purple-600/20',
      'Offer': 'bg-orange-50 text-orange-700 ring-orange-600/20',
      'Hired': 'bg-green-50 text-green-700 ring-green-600/20',
      'Rejected': 'bg-red-50 text-red-700 ring-red-600/10',
      'Scheduled': 'bg-blue-50 text-blue-700 ring-blue-600/20',
      'In Progress': 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
      'Completed': 'bg-green-50 text-green-700 ring-green-600/20',
      'Cancelled': 'bg-red-50 text-red-700 ring-red-600/10'
    };
    return colors[status] || 'bg-zinc-50 text-zinc-700 ring-zinc-600/20';
  };

  return (
    <PageTemplate 
      title={'Dashboard'}
      hideTitle={true}
      url="/dashboard"
    >
      <div className="space-y-5">
        
        {/* Company overview hero */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-sm sm:px-8 lg:px-10">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-blue-950/40" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-10 overflow-hidden">
            <div className="dashboard-wave dashboard-wave-slow absolute bottom-0 left-0 w-[200%]">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="h-10 w-full">
                <path fill="rgba(45,212,191,0.12)" d="M0,25 C200,8 400,38 600,22 C800,8 1000,36 1200,24 C1400,10 1600,38 1800,22 C2000,8 2200,36 2400,24 L2400,40 L0,40 Z" />
              </svg>
            </div>
            <div className="dashboard-wave dashboard-wave-medium absolute bottom-0 left-0 w-[200%]">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="h-10 w-full">
                <path fill="rgba(56,189,248,0.09)" d="M0,31 C260,12 480,38 720,27 C940,15 1120,37 1340,25 C1580,10 1780,36 2020,24 C2200,14 2320,30 2400,27 L2400,40 L0,40 Z" />
              </svg>
            </div>
            <div className="dashboard-wave dashboard-wave-fast absolute bottom-0 left-0 w-[200%]">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="h-10 w-full">
                <path fill="rgba(167,139,250,0.07)" d="M0,30 C300,14 500,38 700,28 C900,16 1100,38 1200,28 C1400,14 1600,38 1900,28 C2100,16 2300,38 2400,28 L2400,40 L0,40 Z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 xl:max-w-xl">
              <p className="mb-0.5 text-pretty text-sm text-slate-400">{greeting},</p>
              <div className="flex items-center gap-2">
                <h1 className="truncate text-balance text-xl font-bold sm:text-2xl">{displayName}</h1>
                <span aria-hidden="true" className="select-none text-2xl sm:text-3xl">👋</span>
              </div>
              <p className="mt-1 hidden text-pretty text-xs text-slate-400 sm:block">Here's what's happening across your company today.</p>
              <div className="mt-3 flex items-center gap-3 text-emerald-400">
                <span aria-hidden="true" className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="size-2.5 rounded-full bg-teal-300/60" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-sm font-semibold tabular-nums">{stats.presentToday || 0} present today</span>
              </div>
            </div>

            <nav aria-label="Dashboard shortcuts" className="flex flex-wrap items-stretch gap-3 sm:gap-5">
              <div className="flex min-w-64 items-center gap-3 rounded-2xl bg-white/10 p-3">
                <div className="relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Briefcase className="size-3.5" aria-hidden="true" />
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-slate-700 bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold leading-tight">Career Page</p>
                  <p className="text-[10px] font-medium text-emerald-400 tabular-nums">{stats.activeJobPostings || 0} open</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopyCareerLink} aria-label={copied ? 'Career page link copied' : 'Copy career page link'} className="size-7 rounded-md bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white">
                  {copied ? <CheckCircle className="size-3" /> : <Copy className="size-3" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={openCareerPage} aria-label="Open career page" className="size-7 rounded-md bg-emerald-500/80 text-white hover:bg-emerald-500 hover:text-white">
                  <ExternalLink className="size-3" />
                </Button>
              </div>

              <Link href={route('hr.recruitment.job-postings.index')} className="flex min-w-20 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <Briefcase className="size-5 text-amber-300" aria-hidden="true" />
                <span className="text-[10px]">Jobs</span>
              </Link>
              <Link href={route('hr.recruitment.candidates.index')} className="flex min-w-20 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <UserPlus className="size-5 text-violet-300" aria-hidden="true" />
                <span className="text-[10px]">Candidates</span>
              </Link>
              <Link href={route('settings')} className="flex min-w-20 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <Settings className="size-5 text-slate-300" aria-hidden="true" />
                <span className="text-[10px]">Settings</span>
              </Link>
            </nav>
          </div>
        </section>

        {/* Daily workforce overview */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
          {/* Row 1 */}
          {/* Total Employees */}
          <Link href={route('hr.employees.index')} className="block cursor-pointer transition-transform hover:scale-[1.02]">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-blue-700">Total Employees</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.totalEmployees || 0}</div>
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <span>Active employees</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Present Today */}
          <Link href={route('hr.attendance-records.index')} className="block cursor-pointer transition-transform hover:scale-[1.02]">
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-green-700">Present Today</CardTitle>
                <UserCheck className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{stats.presentToday || 0}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <span>{stats.attendanceRate || 0}% attendance rate</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Absent Today */}
          <Link href={route('hr.attendance-records.index')} className="block cursor-pointer transition-transform hover:scale-[1.02]">
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-red-700">Absent Today</CardTitle>
                <UserX className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{Math.max(0, (stats.totalEmployees || 0) - (stats.presentToday || 0) - (stats.onLeaveToday || 0))}</div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+1 from yesterday</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* On Leave */}
          <Link href={route('hr.leave-applications.index')} className="block cursor-pointer transition-transform hover:scale-[1.02]">
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-purple-700">On Leave</CardTitle>
                <Calendar className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{stats.onLeaveToday || 0}</div>
                <div className="flex items-center text-xs text-purple-600 mt-1">
                  <span>{stats.pendingLeaves || 0} pending approvals</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>



        {/* Custom Row: Designation Distribution & Quick Actions */}
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mb-5">
          {/* Designation Distribution */}
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="border-b-0 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                Designation Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex flex-col gap-3">
                  {charts.designationStats.length > 0 ? (() => {
                    const maxVal = Math.max(...charts.designationStats.map(d => d.value), 1);
                    return charts.designationStats.map((desig, index) => {
                      const nameParts = desig.name.split(' (');
                      const desigName = nameParts[0];
                      const branchName = nameParts.length > 1 ? '(' + nameParts[1] : '';

                      return (
                        <div key={index} className="mb-2 last:mb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {desigName}
                              {branchName && <span className="text-zinc-500 font-normal ml-1">{branchName}</span>}
                            </span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{desig.value}</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full" 
                              style={{ width: `${(desig.value / maxVal) * 100}%`, backgroundColor: desig.color || '#3b82f6' }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })() : (
                    <div className="text-center py-10 text-zinc-500 text-sm">No designation data</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="border-b-0 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Layers className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Add New Employee', icon: UserPlus },
                    { label: 'Mark Attendance', icon: Clock },
                    { label: 'Apply for Leave', icon: Calendar },
                    { label: 'Process Payroll', icon: CreditCard },
                    { label: 'Create Promotion', icon: TrendingUp },
                    { label: 'Create Resignation', icon: TrendingDown },
                    { label: 'Create Holiday', icon: Calendar },
                    { label: 'Create Warning', icon: AlertTriangle }
                  ].map((action, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300 ml-1" />
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{action.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's celebrations and leave */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="relative flex h-full min-h-[310px] flex-col overflow-hidden rounded-xl border border-pink-200 bg-white shadow-sm dark:border-pink-900/60 dark:bg-zinc-950">
            <span aria-hidden="true" className="absolute left-[14%] top-4 size-1.5 rounded-full bg-pink-200" />
            <span aria-hidden="true" className="absolute right-[18%] top-8 size-2 rounded-full bg-fuchsia-100" />
            <span aria-hidden="true" className="absolute bottom-12 left-[54%] size-2 rotate-45 bg-pink-100" />
            <CardHeader className="relative border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Today's Birthdays</CardTitle>
                  <p className="mt-1 text-xs text-zinc-500">Celebrate with your team</p>
                </div>
                <div className="rounded-xl bg-pink-100 p-2.5 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300">
                  <PartyPopper className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative flex-1 p-0">
              <div className="max-h-[330px] overflow-y-auto px-6 py-4">
                {recentActivities.todayBirthdays?.length ? (
                  <div className="space-y-2">
                    {recentActivities.todayBirthdays.map((employee) => (
                      <div key={employee.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-pink-50 dark:hover:bg-pink-950/20">
                        <img
                          src={employee.avatar ? `/storage/media/${employee.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=fce7f3&color=be185d`}
                          alt={employee.name}
                          className="size-11 rounded-full border-2 border-white object-cover shadow-sm dark:border-zinc-800"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{employee.name}</p>
                          <p className="truncate text-xs text-zinc-500">{employee.designation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center text-center">
                    <PartyPopper className="mb-3 size-8 text-pink-300" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No birthdays today</p>
                    <p className="mt-1 text-xs text-zinc-500">The next celebration is just around the corner.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex h-full min-h-[310px] flex-col overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/60 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Today's Leave</CardTitle>
                  <p className="mt-1 text-xs text-zinc-500">Employees on leave today</p>
                </div>
                <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                  <Calendar className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="max-h-[330px] overflow-y-auto px-6 py-4">
                {recentActivities.todayLeaves?.length ? (
                  <div className="space-y-2">
                    {recentActivities.todayLeaves.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between gap-4 rounded-lg p-2 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={leave.employee?.avatar ? `/storage/media/${leave.employee.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.employee?.name || 'Employee')}&background=ffedd5&color=c2410c`}
                            alt={leave.employee?.name || 'Employee'}
                            className="size-11 rounded-full border-2 border-white object-cover shadow-sm dark:border-zinc-800"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{leave.employee?.name || 'Employee'}</p>
                            <p className="truncate text-xs text-zinc-500">{leave.employee?.employee?.designation?.name || 'Team Member'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          {leave.leave_type?.name || 'Leave'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center text-center">
                    <Calendar className="mb-3 size-8 text-amber-300" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No employees on leave today</p>
                    <p className="mt-1 text-xs text-zinc-500">Everyone is available today.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Activity overview matching the reference dashboard */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ActivityCard title="Recent Leave Applications" subtitle="Latest leave requests from employees" href={route('hr.leave-applications.index')}>
            <div className="max-h-[390px] overflow-y-auto">
              {dashboardData.recentLeaveApplications?.length ? dashboardData.recentLeaveApplications.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4 last:border-0 dark:border-zinc-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={leave.employee?.avatar ? `/storage/media/${leave.employee.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.employee?.name || 'Employee')}&background=e5e7eb&color=374151`} alt={leave.employee?.name || 'Employee'} className="size-11 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{leave.employee?.name || 'Employee'}</p>
                      <p className="truncate text-xs text-zinc-500">{leave.leave_type?.name || 'Leave'} • {format(new Date(leave.start_date), 'yyyy-MM-dd')}</p>
                    </div>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${leave.status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' : leave.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{leave.status}</span>
                </div>
              )) : <div className="py-16 text-center text-sm text-zinc-500">No recent leave applications</div>}
            </div>
          </ActivityCard>

          <ActivityCard title="Recent Candidates" subtitle="Latest applicants in the pipeline" href={route('hr.recruitment.candidates.index')}>
            <div className="max-h-[390px] overflow-y-auto">
              {recentActivities.candidates?.length ? recentActivities.candidates.map((candidate, index) => {
                const name = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidate';
                const colors = ['border-amber-300 bg-amber-50 text-amber-700', 'border-lime-300 bg-lime-50 text-lime-700', 'border-blue-300 bg-blue-50 text-blue-700'];
                return <div key={candidate.id} className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4 last:border-0 dark:border-zinc-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${colors[index % colors.length]}`}>{name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{name}</p><p className="truncate text-xs text-zinc-500">{candidate.job?.title || candidate.current_position || 'Applicant'} • {candidate.application_date ? format(new Date(candidate.application_date), 'yyyy-MM-dd') : 'Recently applied'}</p></div>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${candidate.status === 'New' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>{candidate.status || 'New'}</span>
                </div>;
              }) : <div className="py-16 text-center text-sm text-zinc-500">No recent candidates</div>}
            </div>
          </ActivityCard>

          <ActivityCard title="Recent Announcements" subtitle="Latest company announcements" href={route('hr.announcements.index')}>
            <div className="max-h-[390px] overflow-y-auto">
              {recentActivities.announcements?.length ? recentActivities.announcements.map((announcement) => (
                <div key={announcement.id} className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4 last:border-0 dark:border-zinc-800">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Bell className="size-5" /></div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{announcement.title}</p>
                      {announcement.is_high_priority && (
                        <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">Urgent</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">{announcement.category || 'Company News'} • {format(new Date(announcement.created_at), 'yyyy-MM-dd')}</p>
                  </div>
                </div>
              )) : <div className="py-16 text-center text-sm text-zinc-500">No recent announcements</div>}
            </div>
          </ActivityCard>

          <ActivityCard title="Upcoming Meetings" subtitle="Scheduled meetings from today onwards" href={route('meetings.meetings.index')}>
            <div className="max-h-[390px] overflow-y-auto">
              {recentActivities.meetings?.length ? recentActivities.meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4 last:border-0 dark:border-zinc-800">
                  <div className="flex min-w-0 items-center gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Users className="size-5" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{meeting.title}</p><p className="truncate text-xs text-zinc-500">{format(new Date(meeting.meeting_date), 'yyyy-MM-dd')} • {meeting.start_time || 'Time pending'}{meeting.end_time ? ` - ${meeting.end_time}` : ''}</p></div></div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${meeting.status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{meeting.status || 'Scheduled'}</span>
                </div>
              )) : <div className="py-16 text-center text-sm text-zinc-500">No upcoming meetings</div>}
            </div>
          </ActivityCard>
        </div>

        {/* Superseded activity layout retained only as source history */}
        <div className="hidden">
          <Card className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm dark:border-blue-900/60 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Recent Candidates</CardTitle>
                  <p className="mt-1 text-xs text-zinc-500">Latest recruitment applications</p>
                </div>
                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                  <UserPlus className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="max-h-[320px] overflow-y-auto px-6 py-4">
                {recentActivities.candidates?.length ? (
                  <div className="space-y-2">
                    {recentActivities.candidates.map((candidate) => {
                      const candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidate';
                      return (
                        <div key={candidate.id} className="flex items-center justify-between gap-4 rounded-lg p-2 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20">
                          <div className="flex min-w-0 items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=dbeafe&color=1d4ed8`}
                              alt={candidateName}
                              className="size-11 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{candidateName}</p>
                              <p className="truncate text-xs text-zinc-500">{candidate.job?.title || candidate.current_position || 'General application'}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                            {candidate.status || 'New'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center text-center">
                    <UserPlus className="mb-3 size-8 text-blue-300" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No recent candidates</p>
                    <p className="mt-1 text-xs text-zinc-500">New applications will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm dark:border-violet-900/60 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Upcoming Meetings</CardTitle>
                  <p className="mt-1 text-xs text-zinc-500">Your team's upcoming schedule</p>
                </div>
                <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
                  <Clock className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="max-h-[320px] overflow-y-auto px-6 py-4">
                {recentActivities.meetings?.length ? (
                  <div className="space-y-2">
                    {recentActivities.meetings.map((meeting) => (
                      <div key={meeting.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-violet-50 dark:hover:bg-violet-950/20">
                        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          <span className="text-[10px] font-medium uppercase">{format(new Date(meeting.meeting_date), 'MMM')}</span>
                          <span className="text-sm font-bold leading-none">{format(new Date(meeting.meeting_date), 'dd')}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{meeting.title}</p>
                          <p className="truncate text-xs text-zinc-500">
                            {meeting.start_time && meeting.end_time ? `${meeting.start_time} – ${meeting.end_time}` : meeting.start_time || 'Time to be confirmed'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center text-center">
                    <Clock className="mb-3 size-8 text-violet-300" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No upcoming meetings</p>
                    <p className="mt-1 text-xs text-zinc-500">Scheduled meetings will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Leaves Row */}
        <div className="mt-5 grid grid-cols-1 gap-5">
          {/* Calendar */}
          <div>
            <Card className="border border-zinc-100 shadow-sm h-full flex flex-col bg-white rounded-lg overflow-hidden">
              <CardHeader className="border-b-0 pb-2 pt-4">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-zinc-800" strokeWidth={2} />
                  Events & Holidays Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <style dangerouslySetInnerHTML={{__html: `
                  .fc .fc-toolbar-title { font-size: 1.125rem; font-weight: 600; color: #18181b; }
                  .fc .fc-button-primary { background-color: #22c55e !important; border-color: #22c55e !important; }
                  .fc .fc-button-primary:hover { background-color: #16a34a !important; border-color: #16a34a !important; }
                  .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: #15803d !important; border-color: #15803d !important; }
                  .fc-today-button { background-color: #64748b !important; border-color: #64748b !important; text-transform: capitalize; }
                  .fc-today-button:hover { background-color: #475569 !important; border-color: #475569 !important; }
                  .fc-today-button:disabled { background-color: #94a3b8 !important; border-color: #94a3b8 !important; opacity: 1 !important;}
                  .fc th { padding: 10px 0 !important; color: #52525b; font-weight: 500; font-size: 0.875rem; border-color: #f4f4f5 !important; }
                  .fc td, .fc th { border-color: #f4f4f5 !important; }
                  .fc .fc-daygrid-day-number { color: #52525b; font-size: 0.875rem; font-weight: 500; padding: 8px !important; }
                  .fc .fc-day-today { background-color: #f8fafc !important; }
                  .fc-event { border: none !important; border-radius: 4px; padding: 2px 4px; font-size: 0.75rem; font-weight: 500; cursor: pointer; }
                  .fc-theme-standard td, .fc-theme-standard th { border: 1px solid #e4e4e7 !important; }
                `}} />
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={recentActivities.calendarEvents || []}
                  height={550}
                />
              </CardContent>
            </Card>
          </div>

          {/* Leaves and Announcements */}
          <div className="hidden">
            {/* Recent Leave Applications */}
            <Card className="border border-zinc-100 shadow-sm bg-white rounded-lg flex-1">
              <CardHeader className="border-b border-zinc-100 pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-zinc-800" strokeWidth={2} />
                  Recent Leave Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto px-5 pb-5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex flex-col gap-3">
                    {dashboardData.recentLeaveApplications && dashboardData.recentLeaveApplications.length > 0 ? (
                      dashboardData.recentLeaveApplications.map((leave, index) => (
                        <div key={index} className="flex flex-col p-4 border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
                       
                          
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-600' : 
                                leave.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                                'bg-amber-100 text-amber-600'
                              }`}>
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <h6 className="text-sm font-medium">{leave.employee?.name} - {leave.leave_type?.name}</h6>
                                <p className="text-zinc-500 text-xs mt-1">
                                  {format(new Date(leave.start_date), 'yyyy-MM-dd')}
                                  {leave.start_date !== leave.end_date && ` - ${format(new Date(leave.end_date), 'yyyy-MM-dd')}`} 
                                  <span className="ml-1 text-zinc-400">({leave.total_days} {leave.total_days === 1 ? 'day' : 'days'})</span>
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              leave.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-zinc-500 text-sm">No recent leave applications</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="border border-zinc-100 shadow-sm bg-white rounded-lg flex-1">
              <CardHeader className="border-b border-zinc-100 pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="m9 18 3-3-3-3"></path></svg>
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[230px] overflow-y-auto px-5 pb-5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex flex-col gap-4">
                    {recentActivities.announcements && recentActivities.announcements.length > 0 ? (
                      recentActivities.announcements.slice(0,3).map((announcement, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          </div>
                          <div>
                            <h6 className="font-semibold text-zinc-800 text-sm">{announcement.title}</h6>
                            <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{announcement.description}</p>
                            <p className="text-zinc-400 text-xs mt-1">{format(new Date(announcement.created_at), 'yyyy-MM-dd')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-zinc-500 text-sm">No announcements</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
