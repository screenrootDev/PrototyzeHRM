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
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full caption-bottom text-sm border-separate border-spacing-0 min-w-max">
            <thead>
              <tr className="transition-colors">
                <th className="h-[72px] px-4 py-3 text-left align-middle font-medium text-muted-foreground sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 w-[180px] sm:w-[200px]">
                  Employee
                </th>
                {daysArray.map((day, i) => (
                  <th key={i} className={`h-[72px] px-1.5 py-1 align-middle font-normal border-b border-r border-gray-200 dark:border-gray-700 min-w-[130px] w-[130px] ${day.isWeekend ? 'bg-gray-100 dark:bg-gray-800/50 text-muted-foreground' : 'text-gray-900 dark:text-gray-100'}`}>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm font-semibold leading-none">{day.date}</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{day.dayName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedLeaves.length > 0 ? (
                groupedLeaves.map(({ employee, leaves }) => (
                  <tr key={employee.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 align-middle sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/30 border-r border-b border-gray-200 dark:border-gray-700 w-[180px] sm:w-[200px] h-[72px]">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {employee?.avatar ? <AvatarImage src={(window as any).storage ? (window as any).storage(employee.avatar) : employee.avatar} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{employee?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{employee?.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee?.type || 'employee'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-0 border-b border-gray-200 dark:border-gray-700 relative h-[72px]" colSpan={daysInMonth}>
                      <div className="flex w-full h-full absolute inset-0">
                        {daysArray.map((_, i) => (
                          <div key={i} className="flex-1 min-w-[130px] border-r border-gray-200 dark:border-gray-700 h-full pointer-events-none" />
                        ))}
                      </div>
                      
                      {/* Leave Blocks */}
                      {leaves.map((leave: any) => {
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const timelineStart = new Date(currentYear, currentMonth - 1, 1);
                        const timelineEnd = new Date(currentYear, currentMonth, 0);

                        // Skip if completely outside this month
                        if (end < timelineStart || start > timelineEnd) return null;

                        // Calculate start and end indices (1-indexed based)
                        let startDay = start < timelineStart ? 1 : start.getDate();
                        let endDay = end > timelineEnd ? daysInMonth : end.getDate();

                        const span = endDay - startDay + 1;
                        const startPos = Math.max(0, startDay - 1);
                        const widthSpan = Math.min(daysInMonth - startPos, endDay - startPos + 1);
                        const color = leave.leave_type?.color || '#ccc';
                        const leaveType = leave.leave_type;
                            
                        return (
                          <div
                            key={leave.id}
                            className="absolute top-1/2 -translate-y-1/2 rounded-md text-xs font-medium flex items-center shadow-sm overflow-hidden whitespace-nowrap z-10"
                            style={{
                              left: `calc(${startPos} * (100% / ${daysInMonth}) + 4px)`,
                              width: `calc(${widthSpan} * (100% / ${daysInMonth}) - 8px)`,
                              height: '32px',
                              backgroundColor: hexToRgba(color, 0.15),
                              borderColor: hexToRgba(color, 0.4),
                              borderWidth: '1px',
                              color: color,
                              opacity: leave.status === 'pending' ? 0.7 : 1,
                              paddingLeft: '12px'
                            }}
                            title={`${leaveType?.name}: ${leave.start_date} to ${leave.end_date}`}
                          >
                            {span >= 1 ? leaveType?.name : ''}
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={daysInMonth + 1} className="p-8 text-center text-muted-foreground">
                    No leave applications found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
