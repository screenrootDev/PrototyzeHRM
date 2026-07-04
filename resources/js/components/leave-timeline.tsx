import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(204, 204, 204, ${alpha})`;
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;
  let c = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  const colorNum = parseInt(c.join(''), 16);
  return `rgba(${[(colorNum >> 16) & 255, (colorNum >> 8) & 255, colorNum & 255].join(', ')}, ${alpha})`;
};

interface TimelineProps {
  leaves: any[];
  currentMonth: number;
  currentYear: number;
  leaveTypes: any[];
  employees: any[];
}

export function LeaveTimeline({ leaves, currentMonth, currentYear, leaveTypes, employees }: TimelineProps) {
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  const daysArray = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth - 1, i);
      arr.push({
        date: i,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    return arr;
  }, [currentMonth, currentYear, daysInMonth]);

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    updateTimeline(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    updateTimeline(newMonth, newYear);
  };

  const updateTimeline = (month: number, year: number) => {
    router.get(route('hr.leave-applications.index'), {
      timeline_month: month,
      timeline_year: year,
      ...Object.fromEntries(new URLSearchParams(window.location.search))
    }, { preserveState: true, preserveScroll: true, only: ['timelineLeaves', 'timelineMonth', 'timelineYear'] });
  };

  // Group leaves by employee
  const groupedLeaves = useMemo(() => {
    const grouped = new Map();
    // Default leaves to empty array if undefined
    (leaves || []).forEach(leave => {
      if (selectedEmployee !== 'all' && leave.employee_id.toString() !== selectedEmployee) return;

      if (!grouped.has(leave.employee_id)) {
        grouped.set(leave.employee_id, {
          employee: leave.employee,
          leaves: []
        });
      }
      grouped.get(leave.employee_id).leaves.push(leave);
    });
    return Array.from(grouped.values());
  }, [leaves, selectedEmployee]);

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 min-w-[140px] text-center">
              {monthName}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
            <div className="w-full sm:w-[180px]">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">Legend:</span>
        {leaveTypes.map(type => (
          <span key={type.id} className="flex items-center gap-1.5">
            <span 
              className="w-3 h-3 rounded-full inline-block border" 
              style={{ 
                backgroundColor: hexToRgba(type.color, 0.133), 
                borderColor: hexToRgba(type.color, 0.4) 
              }} 
            />
            <span className="font-medium" style={{ color: type.color || '#666' }}>
              {type.name}
            </span>
          </span>
        ))}
      </div>

      {/* Timeline Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative w-full max-w-full">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full max-w-full relative">
            <table className="w-full caption-bottom text-sm text-foreground dark:bg-gray-900 border-separate border-spacing-0">
              <thead className="[&_tr]:border-b">
                <tr className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted text-foreground bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="h-[72px] align-middle [&:has([role=checkbox])]:pr-0 sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 min-w-[140px] w-[140px] sm:min-w-[200px] sm:w-[200px] border-r border-gray-200 dark:border-gray-700">
                    Employee
                  </th>
                {daysArray.map((day, i) => (
                  <th key={i} className="h-[72px] align-middle [&:has([role=checkbox])]:pr-0 dark:bg-gray-900 text-center px-2 py-3 font-medium min-w-[130px] border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-gray-600 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-semibold text-sm">{day.date}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase leading-none mt-1">{day.dayName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {!groupedLeaves || groupedLeaves.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-gray-500 border-b border-gray-100 sticky left-0 bg-white z-10" colSpan={daysInMonth + 1}>
                    No leave applications found for this month.
                  </td>
                </tr>
              ) : (
                groupedLeaves.map(({ employee, leaves }) => {
                  
                  const timelineStart = new Date(currentYear, currentMonth - 1, 1);
                  const timelineEnd = new Date(currentYear, currentMonth, 0);

                  // Filter and sort leaves
                  const validLeaves = leaves.filter((leave: any) => {
                    const start = new Date(leave.start_date);
                    const end = new Date(leave.end_date);
                    return !(end < timelineStart || start > timelineEnd);
                  }).sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

                  let currentDay = 1;
                  const rowCells = [];

                  for (const leave of validLeaves) {
                    const start = new Date(leave.start_date);
                    const end = new Date(leave.end_date);
                    let startDay = start < timelineStart ? 1 : start.getDate();
                    let endDay = end > timelineEnd ? daysInMonth : end.getDate();
                    
                    // Render empty cells before this leave
                    while (currentDay < startDay) {
                      rowCells.push(
                        <td key={`empty-${currentDay}`} className="p-4 [&:has([role=checkbox])]:pr-0 text-foreground px-1.5 py-1 align-middle min-w-[130px] h-[72px] border-r border-gray-200 dark:border-gray-700 last:border-r-0"></td>
                      );
                      currentDay++;
                    }
                    
                    // Render the leave cell
                    if (currentDay <= endDay) {
                      const span = endDay - currentDay + 1;
                      const color = leave.leave_type?.color || '#ccc';
                      const leaveType = leave.leave_type;
                      
                      rowCells.push(
                        <td key={leave.id} colSpan={span} className="p-4 [&:has([role=checkbox])]:pr-0 text-foreground px-1.5 py-1 align-middle h-[72px] border-r border-gray-200 dark:border-gray-700" style={{ minWidth: `${span * 130}px` }}>
                          <div 
                            className="rounded-lg px-2.5 py-1.5 text-xs border transition-opacity flex flex-col justify-center h-full cursor-pointer hover:opacity-90"
                            style={{
                              backgroundColor: hexToRgba(color, 0.133),
                              borderColor: hexToRgba(color, 0.4),
                              color: color,
                              opacity: leave.status === 'pending' ? 0.7 : 1,
                            }}
                            title={`${leaveType?.name}: ${leave.start_date} to ${leave.end_date}`}
                          >
                            <div className="font-semibold text-xs leading-tight truncate">{leaveType?.name}</div>
                            <div className="text-[10px] mt-0.5 opacity-80">{leaveType?.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</div>
                          </div>
                        </td>
                      );
                      currentDay = endDay + 1;
                    }
                  }

                  // Render remaining empty cells
                  while (currentDay <= daysInMonth) {
                    rowCells.push(
                      <td key={`empty-${currentDay}`} className="p-4 [&:has([role=checkbox])]:pr-0 text-foreground px-1.5 py-1 align-middle min-w-[130px] h-[72px] border-r border-gray-200 dark:border-gray-700 last:border-r-0"></td>
                    );
                    currentDay++;
                  }

                  return (
                    <tr key={`emp-row-${employee.id}`} className="data-[state=selected]:bg-muted text-foreground dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-foreground sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 border-r border-gray-200 dark:border-gray-700 min-w-[140px] w-[140px] sm:min-w-[200px] sm:w-[200px] h-[72px]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm overflow-hidden shrink-0 h-9 w-9">
                            <Avatar className="h-full w-full">
                              {employee?.avatar ? <AvatarImage src={(window as any).storage ? (window as any).storage(employee.avatar) : employee.avatar} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{employee?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{employee.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee.designation?.name || 'Employee'}</div>
                          </div>
                        </div>
                      </td>
                      {rowCells}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
