import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { RefreshCw, Users, Building2, Briefcase, UserPlus, Calendar, Clock, TrendingUp, TrendingDown, BarChart3, Bell, ExternalLink, Copy, CheckCircle, UserCheck, UserX, CreditCard, AlertTriangle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { usePage } from '@inertiajs/react';
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
    missingAttendance: []
  };
  
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const onboardingStatus = dashboardData?.onboardingStatus || [];
  const todoList = dashboardData?.todoList || [];

  const userType = dashboardData?.userType || 'employee';
  const isCompanyUser = userType === 'company';
  
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
        
        {/* Top Welcome Banner */}
        <div className="mb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="lg:w-[800px] max-w-full">
            <h5 className="mb-2 text-xl text-zinc-800 dark:text-zinc-200 font-semibold">Welcome {auth?.user?.first_name || auth?.user?.name || 'User'} 🎉</h5>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Here is a quick overview of your company's core metrics today. Keep track of your workforce headcount, monitor daily attendance across all departments, and manage structural growth smoothly.
            </p>
          </div>
          <div className="flex-shrink-0">
             <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="cursor-pointer">
                <RefreshCw size={16} className="mr-1 inline-block" />
                Refresh
             </Button>
          </div>
        </div>

        {/* 8-Card Stats Layout */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
          {/* Row 1 */}
          {/* Total Employees */}
          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium text-sm">Total Employees</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalEmployees || 0}</h3>
              <p className="text-xs text-blue-600 mt-1">Active employees</p>
            </div>
          </div>

          {/* Present Today */}
          <div className="bg-green-50/80 border border-green-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-green-700 font-medium text-sm">Present Today</span>
              <UserCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.presentToday || 0}</h3>
              <p className="text-xs text-green-600 mt-1">{stats.attendanceRate || 0}% attendance rate</p>
            </div>
          </div>

          {/* Absent Today */}
          <div className="bg-red-50/80 border border-red-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-red-700 font-medium text-sm">Absent Today</span>
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{Math.max(0, (stats.totalEmployees || 0) - (stats.presentToday || 0) - (stats.onLeaveToday || 0))}</h3>
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +1 from yesterday
              </p>
            </div>
          </div>

          {/* On Leave */}
          <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-purple-700 font-medium text-sm">On Leave</span>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.onLeaveToday || 0}</h3>
              <p className="text-xs text-purple-600 mt-1">{stats.pendingLeaves || 0} pending approvals</p>
            </div>
          </div>

          {/* Row 2 */}
          {/* Total Branch */}
          <div className="bg-teal-50/80 border border-teal-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-teal-700 font-medium text-sm">Total Branch</span>
              <Building2 className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalBranches || 0}</h3>
              <p className="text-xs text-teal-600 mt-1">Active branches</p>
            </div>
          </div>

          {/* Total Department */}
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-indigo-700 font-medium text-sm">Total Department</span>
              <Briefcase className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalDepartments || 0}</h3>
              <p className="text-xs text-indigo-600 mt-1">Across all branches</p>
            </div>
          </div>

          {/* Total Promotions */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-emerald-700 font-medium text-sm">Total Promotions</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalPromotions || 0}</h3>
              <p className="text-xs text-emerald-600 mt-1">This year</p>
            </div>
          </div>

          {/* Terminations */}
          <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-5 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-rose-700 font-medium text-sm">Terminations</span>
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.terminations || 0}</h3>
              <p className="text-xs text-rose-600 mt-1">This month</p>
            </div>
          </div>
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
              <div className="max-h-[350px] overflow-y-auto px-5 pb-5 custom-scrollbar">
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
              <div className="max-h-[350px] overflow-y-auto px-5 pb-5 custom-scrollbar">
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

        {/* Custom Row: Leave & Attendance Status */}
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mb-5">
          {/* Employees on Leave */}
          <Card className="border border-zinc-100 shadow-sm h-full flex flex-col bg-white rounded-lg">
            <CardHeader className="border-b-0 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-800" strokeWidth={2} />
                Employees on Leave
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto px-5 pb-5 custom-scrollbar">
                <div className="flex flex-col gap-3">
                  {recentActivities.todayLeaves && recentActivities.todayLeaves.length > 0 ? (
                    recentActivities.todayLeaves.map((leave, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-zinc-200 rounded-md">
                        <div className="flex items-center gap-3">
                          <img 
                            src={leave.employee?.avatar ? `/storage/media/${leave.employee.avatar}` : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(leave.employee?.name || 'Unknown') + '&background=random'} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-md object-cover bg-zinc-100"
                          />
                          <div>
                            <h6 className="font-semibold text-zinc-800 text-sm">{leave.employee?.name}</h6>
                            <p className="text-zinc-500 text-xs">{leave.leave_type?.name || 'Leave'}</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-zinc-600">
                          {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm border border-zinc-200 rounded-md">No employees on leave today</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Missing Attendance Today */}
          <Card className="border border-zinc-100 shadow-sm h-full flex flex-col bg-white rounded-lg">
            <CardHeader className="border-b-0 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <UserX className="w-5 h-5 text-zinc-800" strokeWidth={2} />
                Missing Attendance Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto px-5 pb-5 custom-scrollbar">
                <div className="flex flex-col gap-3">
                  {recentActivities.missingAttendance && recentActivities.missingAttendance.length > 0 ? (
                    recentActivities.missingAttendance.map((record, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-md">
                        <img 
                          src={record.employee?.avatar ? `/storage/media/${record.employee.avatar}` : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(record.employee?.name || 'Unknown') + '&background=random'} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-md object-cover bg-zinc-100"
                        />
                        <div>
                          <h6 className="font-semibold text-zinc-800 text-sm">{record.employee?.name}</h6>
                          <p className="text-zinc-500 text-xs">{record.employee?.employee?.employee_id || 'ID N/A'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm border border-zinc-200 rounded-md">All attendance marked for today</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Cards Row 2 */}
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mb-5">
          {/* Onboarding Status */}
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="border-b-0 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Onboarding Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto px-5 pb-5 custom-scrollbar">
                <div className="flex flex-col gap-5">
                  {onboardingStatus.map((person, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h6 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{person.name}</h6>
                          <p className="text-zinc-500 text-xs">{person.role}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary">{person.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${person.progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HR To-Do List */}
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="border-b-0 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-200">To-Do List</CardTitle>
              <button className="text-primary hover:bg-primary/10 p-1 rounded transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto px-5 pb-5 custom-scrollbar">
                <div className="flex flex-col gap-3">
                  {todoList.map((todo) => (
                    <label key={todo.id} className="flex items-start gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded cursor-pointer transition-colors">
                      <input type="checkbox" defaultChecked={todo.completed} className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary/20" />
                      <span className={`text-sm ${todo.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>{todo.task}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Tables */}
        <div className="grid lg:grid-cols-4 grid-cols-1 gap-5">
          {/* Employee Performance */}
          {isModuleEnabled('recruitment') && (
          <div className="lg:col-span-3 col-span-1">
            <Card className="border-none shadow-sm overflow-hidden mb-5">
              <CardHeader className="flex flex-row items-center justify-between border-b-0 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Employee Performance</CardTitle>
                <div className="flex gap-3 items-center">
                  <div className="relative hidden sm:block">
                    <input type="email" className="h-9 w-64 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="Search for...." />
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                  </div>
                  <button onClick={() => window.location.href = route('hr.recruitment.candidates.index')} className="px-3 py-1.5 text-sm border border-dashed border-primary text-primary hover:bg-primary/5 rounded font-medium transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export
                  </button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/10 text-left">
                  <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th className="py-3 px-4 w-12"><input type="checkbox" className="rounded border-zinc-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20" /></th>
                      <th className="px-3.5 py-3 text-sm font-medium">ID</th>
                      <th className="px-3.5 py-3 text-sm font-medium">Name</th>
                      <th className="px-3.5 py-3 text-sm font-medium">Designation</th>
                      <th className="px-3.5 py-3 text-sm font-medium">Performance</th>
                      <th className="px-3.5 py-3 text-sm font-medium">Status</th>
                      <th className="px-3.5 py-3 text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-white/10 bg-white dark:bg-card">
                    {recentActivities.candidates.slice(0, 5).map((candidate, index) => (
                      <tr key={index} className="text-zinc-800 dark:text-zinc-200 text-sm whitespace-nowrap hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="py-3.5 pl-4"><input type="checkbox" className="rounded border-zinc-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20" /></td>
                        <td className="px-3.5 py-2">TW-{1001 + index}</td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 font-bold text-sm uppercase">
                              {candidate.first_name?.[0] || 'U'}{candidate.last_name?.[0] || ''}
                            </div>
                            <div>
                              <h6 className="font-semibold mb-0.5">{candidate.first_name} {candidate.last_name}</h6>
                              <p className="text-zinc-500 text-xs">{candidate.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">{candidate.job?.title || 'Candidate'}</td>
                        <td className="px-3.5 py-2.5 text-green-500">Good</td>
                        <td className="px-3.5 py-2.5">
                          <span className="inline-flex items-center gap-x-1.5 py-0.5 px-2.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">Active</span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="inline-flex justify-start gap-2.5">
                            <button className="w-8 h-8 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:text-primary hover:bg-primary/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                            <button className="w-8 h-8 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentActivities.candidates.length === 0 && (
                      <tr><td colSpan={7} className="py-12 text-center text-zinc-500">No recent candidates found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          )}

          {/* Upcoming Scheduled */}
          {isModuleEnabled('meetings') && (
          <div className="col-span-1">
            <Card className="border-none shadow-sm h-full flex flex-col">
              <CardHeader className="border-b-0 pb-4 flex justify-between flex-row items-center">
                <CardTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Upcoming Scheduled</CardTitle>
                <div className="dropdown relative">
                   <button className="text-zinc-400 hover:text-zinc-600">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                   </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[420px] overflow-y-auto px-5 pb-5 custom-scrollbar">
                  <div className="flex flex-col gap-4">
                    {recentActivities.meetings.slice(0, 5).map((meeting, index) => (
                      <div key={index} className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-card">
                        <div className="flex justify-between items-center p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h6 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{meeting.title}</h6>
                              <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-[120px]">{meeting.description || 'General Meeting'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex justify-between items-center gap-3 text-sm">
                            <div className="flex gap-3 text-zinc-500 dark:text-zinc-400 text-xs">
                              <div className="flex items-center font-medium">
                                <Calendar className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                                <span>
                                  {(() => {
                                    try { return meeting.meeting_date ? format(new Date(meeting.meeting_date), 'dd MMM') : 'N/A'; }
                                    catch { return 'Invalid'; }
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center font-medium">
                                <Clock className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                                <span>{meeting.start_time || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentActivities.meetings.length === 0 && (
                      <div className="text-center py-10 text-zinc-500">
                        <p>No upcoming meetings</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* Calendar and Leaves Row */}
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-5 mt-5">
          {/* Calendar */}
          <div className="lg:col-span-2">
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
          <div className="flex flex-col gap-5">
            {/* Recent Leave Applications */}
            <Card className="border border-zinc-100 shadow-sm bg-white rounded-lg flex-1">
              <CardHeader className="border-b border-zinc-100 pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-zinc-800" strokeWidth={2} />
                  Recent Leave Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto px-5 pb-5 pt-4 custom-scrollbar">
                  <div className="flex flex-col gap-3">
                    {recentActivities.recentLeaveApplications && recentActivities.recentLeaveApplications.length > 0 ? (
                      recentActivities.recentLeaveApplications.map((leave, index) => (
                        <div key={index} className="flex flex-col p-4 border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            leave.status === 'approved' ? 'bg-green-500' : 
                            leave.status === 'rejected' ? 'bg-red-500' : 
                            'bg-amber-400'
                          }`}></div>
                          
                          <div className="flex justify-between items-start ml-2">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-600' : 
                                leave.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                                'bg-amber-100 text-amber-600'
                              }`}>
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <h6 className="font-semibold text-zinc-800 text-sm">{leave.employee?.name} - {leave.leave_type?.name}</h6>
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
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[230px] overflow-y-auto px-5 pb-5 pt-4 custom-scrollbar">
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
