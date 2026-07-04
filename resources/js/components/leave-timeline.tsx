import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';

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
    <div className="bg-white rounded-lg border shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-base min-w-[150px] text-center">{monthName}</span>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-[200px]">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="h-8">
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

      {/* Legend */}
      <div className="p-3 border-b flex flex-wrap gap-4 text-xs items-center">
        <span className="font-semibold text-muted-foreground mr-2">Legend:</span>
        {leaveTypes.map(type => (
          <div key={type.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color || '#ccc' }} />
            <span className="text-muted-foreground">{type.name}</span>
          </div>
        ))}
      </div>

      {/* Timeline Grid */}
      <div className="w-full">
        <div className="w-full flex flex-col">
          {/* Grid Header */}
          <div className="flex border-b bg-gray-50/50 w-full">
            <div className="w-[180px] md:w-[220px] flex-shrink-0 p-3 border-r font-medium flex items-center text-sm text-muted-foreground">
              Employee
            </div>
            <div className="flex flex-1 min-w-0">
              {daysArray.map((day, i) => (
                <div key={i} className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 border-r ${day.isWeekend ? 'bg-gray-100 text-muted-foreground' : 'text-gray-700'}`}>
                  <span className="text-[11px] font-medium leading-none">{day.date}</span>
                  <span className="text-[9px] uppercase font-semibold mt-1">{day.dayName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          {groupedLeaves.length > 0 ? (
            groupedLeaves.map(({ employee, leaves }) => (
              <div key={employee.id} className="flex border-b last:border-0 hover:bg-gray-50/50 transition-colors w-full">
                <div className="w-[180px] md:w-[220px] flex-shrink-0 p-2 md:p-2.5 border-r flex items-center gap-2 md:gap-3 bg-white sticky left-0 z-10">
                  <Avatar className="h-8 w-8">
                    {employee?.avatar ? <AvatarImage src={(window as any).storage ? (window as any).storage(employee.avatar) : employee.avatar} /> : null}
                    <AvatarFallback>{employee?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-sm truncate">{employee?.name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{employee?.type || 'Employee'}</span>
                  </div>
                </div>
                <div className="flex flex-1 min-w-0 relative">
                  {/* Grid lines for each day */}
                  {daysArray.map((_, i) => (
                    <div key={i} className="flex-1 min-w-0 border-r h-[50px] pointer-events-none" />
                  ))}
                  
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
                        className="absolute top-1/2 -translate-y-1/2 rounded-md text-[9px] font-medium text-white flex items-center justify-center shadow-sm overflow-hidden whitespace-nowrap"
                        style={{
                          left: `calc(${startPos} * (100% / ${daysInMonth}) + 2px)`,
                          width: `calc(${widthSpan} * (100% / ${daysInMonth}) - 4px)`,
                          height: '24px',
                          backgroundColor: color,
                          opacity: leave.status === 'pending' ? 0.7 : 1,
                        }}
                        title={`${leaveType?.name}: ${leave.start_date} to ${leave.end_date}`}
                      >
                        {span >= 2 ? leaveType?.name : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground w-full">
              No leave applications found for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
