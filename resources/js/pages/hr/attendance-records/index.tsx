import { useState, useMemo } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Download, Upload, Check, X, Flag, Star, Ban, Minus, Clock, ArrowLeftToLine, Timer, Search, Filter, CircleDashed } from 'lucide-react';
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
  
  const [showFilters, setShowFilters] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [perPage, setPerPage] = useState(pageFilters.per_page || "10");

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
    
    // Disable clicking on future dates if we want (optional, but standard practice)
    // if (isFuture) return;

    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (dayData && dayData.record_id) {
      setFormMode('edit');
      setCurrentItem({
        id: dayData.record_id,
        employee_id: empId.toString(),
        date: dateStr,
        status: dayData.status,
        clock_in: dayData.clock_in,
        clock_out: dayData.clock_out
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

  const renderStatusCell = (dayData: any, isFuture: boolean, isWeekend: boolean) => {
    if (isFuture && !dayData?.status) {
      return <Minus className="h-4 w-4 text-gray-300 mx-auto" />;
    }
    
    if (isWeekend && !dayData?.status) {
      return <Ban className="h-4 w-4 text-gray-300 mx-auto" />;
    }

    if (!dayData || !dayData.status) {
      return <CircleDashed className="h-4 w-4 text-gray-300 mx-auto" title="Attendance Not Added" />;
    }
    
    switch (dayData.status) {
      case 'present':
        return <Check className="h-4 w-4 text-[#20c997] font-bold mx-auto stroke-[3]" title={`In: ${dayData.clock_in || '--'} Out: ${dayData.clock_out || '--'}`} />;
      case 'absent':
        return <X className="h-4 w-4 text-red-500 font-bold mx-auto stroke-[3]" />;
      case 'half_day':
        return <span className="font-bold text-yellow-500 flex justify-center text-sm">½</span>;
      case 'on_leave':
        return <Flag className="h-4 w-4 text-red-600 fill-current mx-auto" title={dayData.leave_type} />;
      case 'holiday':
        return <Star className="h-4 w-4 text-yellow-400 fill-current mx-auto" />;
      default:
        return <CircleDashed className="h-4 w-4 text-gray-300 mx-auto" />;
    }
  };

  const pageActions = [
    {
      label: 'Export',
      icon: <Download className="h-4 w-4 mr-2" />,
      variant: 'outline' as const,
      onClick: () => {}
    },
    {
      label: 'Import',
      icon: <Upload className="h-4 w-4 mr-2" />,
      variant: 'outline' as const,
      onClick: () => {}
    }
  ];
  
  if (hasPermission(permissions, 'create-attendance-records')) {
    pageActions.push({
      label: 'Add Record',
      icon: <Plus className="h-4 w-4 mr-2" />,
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
      url="/hr/attendance-records"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="flex flex-col gap-4">
        {/* Filter Section matching ERPGo */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex flex-col gap-4">
            {/* Top row of filters */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 border-gray-200"
                  />
                </div>
                <Button 
                  onClick={applyFilters} 
                  className="bg-[#20c997] hover:bg-[#1ba87e] text-white h-10 px-4 whitespace-nowrap"
                >
                  <Search className="h-4 w-4 mr-2" /> Search
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-10 px-4 whitespace-nowrap text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  <Filter className="h-4 w-4 mr-2" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Per Page:</span>
                <Select value={perPage} onValueChange={(val) => {
                  setPerPage(val);
                  router.get(route('hr.attendance-records.index'), {
                    page: 1,
                    per_page: parseInt(val),
                    search: searchTerm || undefined,
                    employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
                    month: selectedMonth,
                    year: selectedYear
                  }, { preserveState: true, preserveScroll: true });
                }}>
                  <SelectTrigger className="w-[80px] h-9 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bottom row of filters */}
            {showFilters && (
              <div className="flex items-end gap-4 mt-2">
                <div className="space-y-1.5 w-64">
                  <Label className="text-sm font-semibold text-gray-700">Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full border-gray-200">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 w-48">
                  <Label className="text-sm font-semibold text-gray-700">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full border-gray-200">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 w-48">
                  <Label className="text-sm font-semibold text-gray-700">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full border-gray-200">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={applyFilters} 
                  className="bg-[#20c997] hover:bg-[#1ba87e] text-white"
                >
                  Apply Filters
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleResetFilters} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-gray-600">
          <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#20c997] stroke-[3]" /> Present</div>
          <div className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-500 stroke-[3]" /> Absent</div>
          <div className="flex items-center gap-1.5"><span className="text-yellow-500 font-bold text-sm leading-none">½</span> Half Day</div>
          <div className="flex items-center gap-1.5"><Flag className="h-4 w-4 text-red-600 fill-current" /> On Leave</div>
          <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-yellow-400 fill-current" /> Holiday</div>
          <div className="flex items-center gap-1.5"><Ban className="h-4 w-4 text-gray-400" /> Day Off</div>
          <div className="flex items-center gap-1.5"><Minus className="h-4 w-4 text-gray-400" /> Future</div>
          <div className="flex items-center gap-1.5"><CircleDashed className="h-4 w-4 text-gray-400" /> Attendance Not Added</div>
          <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-orange-500" /> Late</div>
          <div className="flex items-center gap-1.5"><ArrowLeftToLine className="h-4 w-4 text-red-400" /> Early Departure</div>
          <div className="flex items-center gap-1.5"><Timer className="h-4 w-4 text-blue-500" /> Overtime</div>
        </div>

        {/* Main Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full">
          <div className="p-4 border-b border-gray-100 text-center relative bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800">
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </h3>
          </div>

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
                            {renderStatusCell(dayData, date.isFuture, date.isWeekend)}
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
                  return (
                    <div key={`total-${row.employee.id}`} className="h-[52px] flex items-center justify-center text-xs font-bold text-gray-800 border-b border-gray-100 bg-gray-50/30 hover:bg-gray-100/90 transition-colors">
                      {row.summary.present}/{workingDays}
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
                      <SelectContent>
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
