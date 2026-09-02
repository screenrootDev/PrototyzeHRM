import { useState, useMemo, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, AlarmClock, ArrowLeftFromLine, Timer, CircleDashed, Filter, FileDown, FileUp, RefreshCcw, X } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { toast } from '@/components/custom-toast';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getImagePath } from '@/utils/helpers';

export default function AttendanceRecords() {
  const { auth, attendanceData, employees, daysInMonth, workingDaysInMonth, currentMonth, currentYear, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedEmployee, setSelectedEmployee] = useState(pageFilters.employee_id || 'all');
  
  const [selectedMonth, setSelectedMonth] = useState(pageFilters.month || (currentMonth || new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(pageFilters.year || (currentYear || new Date().getFullYear()).toString());
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [perPage, setPerPage] = useState(pageFilters.per_page || "10");
  const importInputRef = useRef<HTMLInputElement>(null);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYr = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const y = (currentYr - 2 + i).toString();
    return { value: y, label: y };
  });

  const applyFilters = () => {
    router.get(route('hr.attendance-records.index'), {
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      month: selectedMonth,
      year: selectedYear,
      per_page: perPage
    }, { preserveState: true, preserveScroll: true });
  };

  const updateFilters = (employee = selectedEmployee, month = selectedMonth, year = selectedYear) => {
    router.get(route('hr.attendance-records.index'), {
      page: 1,
      employee_id: employee !== 'all' ? employee : undefined,
      month,
      year,
      per_page: perPage
    }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const clearEmployeeFilter = () => {
    setSelectedEmployee('all');
    updateFilters('all', selectedMonth, selectedYear);
  };

  const exportCurrentPage = () => {
    const headers = ['Employee', 'Employee ID', 'Date', 'Status', 'Clock In', 'Clock Out', 'Total Hours', 'Notes'];
    const rows = (attendanceData?.data || []).flatMap((row: any) => gridDates.map(({ day }) => {
      const record = row.days?.[day];
      const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return record?.record_id ? [row.employee.name, row.employee.employee_id, date, record.status || '', record.clock_in || '', record.clock_out || '', record.total_hours ?? '', record.notes || ''] : null;
    }).filter(Boolean));
    const csv = [headers, ...rows].map((row) => row.map((value: any) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importAttendance = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    toast.loading('Importing attendance records...');
    router.post(route('hr.attendance-records.import'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.error) toast.error(page.props.flash.error);
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(Object.values(errors).join(', '));
      },
      onFinish: () => { event.target.value = ''; }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmployee('all');
    setSelectedMonth((new Date().getMonth() + 1).toString());
    setSelectedYear((new Date().getFullYear()).toString());

    router.get(route('hr.attendance-records.index'), {
      page: 1,
      per_page: perPage,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }, { preserveState: true, preserveScroll: true });
  };

  const handleCellClick = (empId: number, day: number, dayData: any, isFuture: boolean) => {
    if (!hasPermission(permissions, 'edit-attendance-records') && !hasPermission(permissions, 'create-attendance-records')) {
      return;
    }
    
    if (isFuture || dayData?.status === 'future') return;

    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (dayData && dayData.record_id) {
      setFormMode('edit');
      setCurrentItem({
        id: dayData.record_id,
        employee_id: empId.toString(),
        date: dateStr,
        status: dayData.status,
        clock_in: dayData.clock_in,
        clock_out: dayData.clock_out,
        break_hours: dayData.break_hours ?? 0,
        notes: dayData.notes ?? ''
      });
    } else {
      if (!hasPermission(permissions, 'create-attendance-records')) return;
      setFormMode('create');
      setCurrentItem({
        employee_id: empId.toString(),
        date: dateStr,
        status: 'present'
      });
    }
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading('Creating attendance record...');
      router.post(route('hr.attendance-records.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) toast.success(page.props.flash.success);
          else if (page.props.flash.error) toast.error(page.props.flash.error);
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') toast.error(errors);
          else toast.error(`Failed to create attendance record: ${Object.values(errors).join(', ')}`);
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating attendance record...');
      router.put(route('hr.attendance-records.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) toast.success(page.props.flash.success);
          else if (page.props.flash.error) toast.error(page.props.flash.error);
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') toast.error(errors);
          else toast.error(`Failed to update attendance record: ${Object.values(errors).join(', ')}`);
        }
      });
    }
  };

  // Pre-calculate dates for table headers
  const gridDates = useMemo(() => {
    const dates = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({
        day: i,
        dayName,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isFuture: d > new Date()
      });
    }
    return dates;
  }, [daysInMonth, selectedMonth, selectedYear]);

  const renderStatusCell = (dayData: any) => {
    const status = dayData?.status || 'not_added';
    const statusMap: Record<string, { icon: React.ReactNode; className: string; title: string }> = {
      present: { icon: '✓', className: 'text-green-600 dark:text-green-400 font-bold text-base', title: 'Present' },
      absent: { icon: '✕', className: 'text-red-500 dark:text-red-400 font-bold text-base', title: 'Absent' },
      half_day: { icon: '½', className: 'text-yellow-500 dark:text-yellow-400 font-bold text-base', title: 'Half Day' },
      on_leave: { icon: '🚩', className: 'text-blue-500 dark:text-blue-400 text-base', title: dayData?.leave_type ? `On Leave - ${dayData.leave_type}` : 'On Leave' },
      holiday: { icon: '⭐', className: 'text-purple-500 dark:text-purple-400 text-base', title: 'Holiday' },
      day_off: { icon: '⊘', className: 'text-gray-400 dark:text-gray-500 text-base', title: 'Day Off' },
      future: { icon: '-', className: 'text-gray-400 dark:text-gray-600 font-bold text-sm', title: 'Future' },
      not_added: { icon: <CircleDashed className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />, className: '', title: 'Attendance Not Added' },
    };
    const cfg = statusMap[status] || statusMap.not_added;
    const details = [cfg.title];
    if (dayData?.is_late) details.push('Late Arrival');
    if (dayData?.is_early_departure) details.push('Early Departure');
    if (dayData?.clock_in) details.push(`In: ${dayData.clock_in}`);
    if (dayData?.clock_out) details.push(`Out: ${dayData.clock_out}`);
    if (dayData?.overtime_hours > 0) details.push(`OT: ${Number(dayData.overtime_hours).toFixed(1)}h`);

    return <div className="flex h-8 w-full flex-col items-center justify-center gap-0.5" title={details.join(' | ')}>
      <span className={`leading-none ${cfg.className}`}>{cfg.icon}</span>
      {(dayData?.is_late || dayData?.is_early_departure || dayData?.overtime_hours > 0) && <div className="flex items-center gap-0.5">
        {dayData?.is_late && <AlarmClock className="h-2.5 w-2.5 text-orange-500" />}
        {dayData?.is_early_departure && <ArrowLeftFromLine className="h-2.5 w-2.5 text-red-400" />}
        {dayData?.overtime_hours > 0 && <Timer className="h-2.5 w-2.5 text-blue-500" />}
      </div>}
    </div>;
  };

  const pageActions: any[] = [
    { label: 'Export', icon: <FileDown className="h-4 w-4" />, variant: 'outline', onClick: exportCurrentPage },
    { label: 'Import', icon: <FileUp className="h-4 w-4" />, variant: 'outline', onClick: () => importInputRef.current?.click() },
  ];
  
  if (hasPermission(permissions, 'create-attendance-records')) {
    pageActions.push({
      label: 'Add Record',
      icon: <Plus className="h-4 w-4" />,
      variant: 'default',
      className: 'bg-[#20c997] hover:bg-[#1ba87e] border-none text-white',
      onClick: () => {
        setFormMode('create');
        setCurrentItem(null);
        setIsFormModalOpen(true);
      }
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HRM', href: route('hr.attendance-records.index') },
    { title: 'Attendances' }
  ];

  return (
    <PageTemplate
      title={"Attendance Records"}
      description="View and manage monthly attendance records."
      url="/hr/attendance-records"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importAttendance} />
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-white p-3 shadow dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedEmployee} onValueChange={(value) => { setSelectedEmployee(value); updateFilters(value); }}>
                    <SelectTrigger className="h-9 w-40 gap-2">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent searchable={true}>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={(value) => { setSelectedMonth(value); updateFilters(selectedEmployee, value); }}>
                    <SelectTrigger className="h-9 w-40 gap-2">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); updateFilters(selectedEmployee, selectedMonth, value); }}>
                    <SelectTrigger className="h-9 w-40 gap-2">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedEmployee !== 'all' && (
                <Button variant="ghost" size="sm" onClick={clearEmployeeFilter} className="h-9 text-gray-500 hover:bg-transparent hover:text-gray-700">
                  <RefreshCcw className="h-4 w-4" /> Clear Filters
                </Button>
              )}
              <Button variant={selectedEmployee !== 'all' ? 'default' : 'outline'} size="sm" onClick={applyFilters} className="relative h-9 px-3">
                <Filter className="mr-1.5 h-4 w-4" /> Filters
                {selectedEmployee !== 'all' && <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-primary">1</span>}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-3">
            {selectedEmployee !== 'all' && <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">Employee: {employees?.find((employee: any) => employee.id.toString() === selectedEmployee)?.name}<button type="button" onClick={clearEmployeeFilter} aria-label="Clear employee filter" className="rounded-sm hover:text-gray-950"><X className="h-3 w-3" /></button></span>}
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">Month: {months.find(month => month.value === selectedMonth)?.label}</span>
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">Year: {selectedYear}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-green-600">✓</span> Present</div>
          <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-red-500">✕</span> Absent</div>
          <div className="flex items-center gap-1.5"><span className="text-yellow-500 font-bold text-sm leading-none">½</span> Half Day</div>
          <div className="flex items-center gap-1.5">🚩 On Leave</div>
          <div className="flex items-center gap-1.5">⭐ Holiday</div>
          <div className="flex items-center gap-1.5"><span className="text-sm text-gray-600">⊘</span> Day Off</div>
          <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-gray-600">-</span> Future</div>
          <div className="flex items-center gap-1.5"><CircleDashed className="h-3 w-3 text-gray-400" /> Attendance Not Added</div>
          <div className="flex items-center gap-1.5"><AlarmClock className="h-3.5 w-3.5 text-orange-500" /> Late</div>
          <div className="flex items-center gap-1.5"><ArrowLeftFromLine className="h-3.5 w-3.5 text-red-500" /> Early</div>
          <div className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-blue-600" /> Overtime</div>
        </div>
        </div>

        {/* Main Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full">
          <div className="w-full grid bg-white text-sm" style={{ gridTemplateColumns: '220px minmax(0, 1fr) 70px' }}>
            {/* LEFT PANE: Fixed Width */}
            <div className="flex flex-col border-r border-gray-100 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
              <div className="h-[56px] px-3 flex items-center text-xs font-bold text-gray-800 border-b border-gray-100">
                Employee
              </div>
              {!attendanceData?.data || attendanceData?.data?.length === 0 ? (
                <div className="h-[52px] px-3 flex items-center text-gray-500 border-b border-gray-100"></div>
              ) : (
                attendanceData?.data?.map((row: any) => (
                  <div key={`emp-${row.employee.id}`} className="h-[52px] px-3 flex items-center border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        <img 
                          src={row.employee.avatar ? getImagePath(row.employee.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.employee.name)}&color=7F9CF5&background=EBF4FF`} 
                          alt={row.employee.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-[120px]">
                        <span className="font-bold text-gray-800 text-xs truncate max-w-[140px]" title={row.employee.name}>{row.employee.name}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[140px]" title={row.employee.designation || row.employee.employee_id}>{row.employee.designation || row.employee.employee_id}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* MIDDLE PANE: Scrollable */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="flex flex-col w-max">
                <div className="h-[56px] flex border-b border-gray-100">
                  {gridDates.map((date) => (
                    <div key={`header-${date.day}`} className="w-[44px] shrink-0 flex flex-col items-center justify-center border-r border-gray-100 last:border-r-0">
                      <span className="font-bold text-gray-700 text-xs">{date.day}</span>
                      <span className="text-[9px] text-gray-400 uppercase leading-none mt-0.5">{date.dayName}</span>
                    </div>
                  ))}
                </div>
                {!attendanceData?.data || attendanceData?.data?.length === 0 ? (
                  <div className="h-[52px] flex items-center justify-center text-gray-500 border-b border-gray-100">
                    No attendance records found for the selected criteria.
                  </div>
                ) : (
                  attendanceData?.data?.map((row: any) => (
                    <div key={`dates-${row.employee.id}`} className="h-[52px] flex border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {gridDates.map((date) => {
                        const dayData = row.days[date.day];
                        return (
                          <div 
                            key={`cell-${row.employee.id}-${date.day}`}
                            className="w-[44px] shrink-0 flex justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-50/50 last:border-r-0"
                            onClick={() => handleCellClick(row.employee.id, date.day, dayData, date.isFuture)}
                          >
                            {renderStatusCell(dayData)}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT PANE: Fixed Width */}
            <div className="w-[70px] shrink-0 flex flex-col border-l border-gray-100 z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.02)]">
              <div className="h-[56px] flex justify-center items-center text-xs font-bold text-gray-800 border-b border-gray-100">
                Total
              </div>
              {!attendanceData?.data || attendanceData?.data?.length === 0 ? (
                <div className="h-[52px] flex items-center justify-center border-b border-gray-100"></div>
              ) : (
                attendanceData?.data?.map((row: any) => {
                  const workingDays = workingDaysInMonth || 22;
                  const attendedDays = Number(row.summary.present || 0) + (Number(row.summary.half_day || 0) * 0.5);
                  return (
                    <div key={`total-${row.employee.id}`} className="h-[52px] flex items-center justify-center text-xs font-bold text-gray-800 border-b border-gray-100 bg-gray-50/30 hover:bg-gray-100/90 transition-colors">
                      {Number.isInteger(attendedDays) ? attendedDays : attendedDays.toFixed(1)}/{workingDays}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Pagination
              from={attendanceData?.from || 0}
              to={attendanceData?.to || 0}
              total={attendanceData?.total || 0}
              links={attendanceData?.links}
              entityName={"employees"}
              onPageChange={(url) => router.get(url)}
              perPage={perPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                router.get(route('hr.attendance-records.index'), {
                  page: 1,
                  per_page: value,
                  employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
                  month: selectedMonth,
                  year: selectedYear,
                }, { preserveState: true, preserveScroll: true, replace: true });
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white">
          <DialogHeader className="p-5 pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-800 tracking-tight">
              {formMode === 'create' ? 'Create Attendance' : 'Edit Attendance'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4">
            <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(currentItem); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Employee <span className="text-red-500">*</span></Label>
                    <Select 
                      value={currentItem?.employee_id || ''} 
                      onValueChange={(val) => setCurrentItem({...currentItem, employee_id: val})}
                    >
                      <SelectTrigger className="w-full h-11 border-gray-200">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent searchable={true}>
                        {employees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Clock In Time <span className="text-red-500">*</span></Label>
                    <Input 
                      type="time" 
                      value={currentItem?.clock_in || ''} 
                      onChange={(e) => setCurrentItem({...currentItem, clock_in: e.target.value})} 
                      placeholder="Select Clock In Time"
                      className="h-11 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                    <Textarea 
                      value={currentItem?.notes || ''} 
                      onChange={(e) => setCurrentItem({...currentItem, notes: e.target.value})} 
                      placeholder="Enter Notes"
                      className="resize-none min-h-[100px] border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date <span className="text-red-500">*</span></Label>
                    <Input 
                      type="date" 
                      value={currentItem?.date || ''} 
                      onChange={(e) => setCurrentItem({...currentItem, date: e.target.value})} 
                      placeholder="Select Date"
                      className="h-11 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Clock Out Time</Label>
                    <Input 
                      type="time" 
                      value={currentItem?.clock_out || ''} 
                      onChange={(e) => setCurrentItem({...currentItem, clock_out: e.target.value})} 
                      placeholder="Select Clock Out Time"
                      className="h-11 border-gray-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Status <span className="text-red-500">*</span></Label>
                    <Select 
                      value={currentItem?.status || 'present'} 
                      onValueChange={(val) => setCurrentItem({...currentItem, status: val})}
                    >
                      <SelectTrigger className="w-full h-11 border-gray-200">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-8 flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-6 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium h-11 rounded-md"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-8 py-2 bg-[#20c997] hover:bg-[#1ba87e] text-white font-medium h-11 rounded-md border-none"
                >
                  {formMode === 'create' ? 'Create' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
