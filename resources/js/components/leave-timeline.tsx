import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { getImagePath } from '@/utils/helpers';

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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="w-full grid bg-white dark:bg-gray-900 text-sm" style={{ gridTemplateColumns: 'minmax(200px, 250px) minmax(0, 1fr)' }}>
          {/* LEFT PANE: Fixed Width */}
          <div className="flex flex-col border-r border-gray-100 dark:border-gray-700 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
            <div className="h-[72px] px-4 flex items-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              Employee
            </div>
            {!groupedLeaves || groupedLeaves.length === 0 ? (
              <div className="h-[72px] px-4 flex items-center border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"></div>
            ) : (
              groupedLeaves.map((empGroup) => (
                <div key={`emp-${empGroup.employee.id}`} className="h-[72px] px-4 flex items-center border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700 shrink-0">
                      <AvatarImage src={empGroup.employee?.avatar ? getImagePath(empGroup.employee?.avatar) : undefined} alt={empGroup.employee?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {(empGroup.employee?.name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate block" title={empGroup.employee?.name}>
                        {empGroup.employee?.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT PANE: Scrollable Dates */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex flex-col w-max min-w-full">
              <div className="h-[72px] flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {daysArray.map((day, i) => (
                  <div key={i} className="w-[130px] shrink-0 flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{day.date}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase leading-none mt-1">{day.dayName}</span>
                  </div>
                ))}
              </div>
              
              {!groupedLeaves || groupedLeaves.length === 0 ? (
                <div className="h-[72px] flex items-center px-6 text-gray-500 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
                  No leaves found for this month.
                </div>
              ) : (
                groupedLeaves.map((empGroup) => (
                  <div key={`timeline-${empGroup.employee.id}`} className="h-[72px] flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 relative">
                    {/* Background grid cells */}
                    {daysArray.map((day, i) => (
                      <div key={`cell-${i}`} className="w-[130px] shrink-0 border-r border-gray-100 dark:border-gray-800 last:border-r-0" />
                    ))}
                    
                    {/* Absolute positioned leave blocks */}
                    {empGroup.leaves.map((leave: any) => {
                      const leaveStart = new Date(leave.start_date);
                      const leaveEnd = new Date(leave.end_date);
                      
                      const monthStart = new Date(currentYear, currentMonth - 1, 1);
                      const monthEnd = new Date(currentYear, currentMonth, 0);
                      
                      const effectiveStart = leaveStart < monthStart ? monthStart : leaveStart;
                      const effectiveEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd;
                      
                      const startOffsetDays = effectiveStart.getDate() - 1;
                      const durationDays = Math.max(1, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                      
                      const typeColor = leave.leave_type?.color || '#3b82f6';
                      
                      return (
                        <div 
                          key={leave.id}
                          className="absolute h-full py-1.5 px-1.5 z-10"
                          style={{ 
                            left: `${startOffsetDays * 130}px`,
                            width: `${durationDays * 130}px`
                          }}
                        >
                          <div 
                            className="rounded-lg px-2.5 py-1.5 text-xs border transition-opacity flex flex-col justify-center h-full cursor-pointer hover:opacity-90 overflow-hidden"
                            style={{ 
                              backgroundColor: `${typeColor}20`,
                              borderColor: `${typeColor}60`,
                              color: typeColor
                            }}
                            title={`${leave.leave_type?.name} (${leave.start_date} to ${leave.end_date})`}
                          >
                            <div className="font-semibold text-xs leading-tight truncate">{leave.leave_type?.name}</div>
                            <div className="text-[10px] mt-0.5 opacity-80 truncate">{leave.leave_type?.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
