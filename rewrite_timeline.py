import re

with open('resources/js/components/leave-timeline.tsx', 'r') as f:
    content = f.read()

# We need to replace the entire Timeline Grid section (lines 149-266 roughly)
# First let's locate it.
start_str = "{/* Timeline Grid */}"
# We'll use regex to find the end of the div containing it.

def replace_grid():
    grid_jsx = """      {/* Timeline Grid */}
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
                <div key={`emp-${empGroup.employee_id}`} className="h-[72px] px-4 flex items-center border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700">
                      <AvatarImage src={empGroup.employee_avatar ? getImagePath(empGroup.employee_avatar) : undefined} alt={empGroup.employee_name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {empGroup.employee_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate block" title={empGroup.employee_name}>
                        {empGroup.employee_name}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT PANE: Scrollable Dates */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex flex-col w-max">
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
                  <div key={`timeline-${empGroup.employee_id}`} className="h-[72px] flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 relative">
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
                      const durationDays = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      
                      // Using the precise styling requested by user
                      const typeColor = leave.leave_type?.color || '#3b82f6';
                      
                      return (
                        <div 
                          key={leave.id}
                          className="absolute h-full py-1.5 px-0.5 z-10"
                          style={{ 
                            left: `${startOffsetDays * 130}px`,
                            width: `${durationDays * 130}px`
                          }}
                        >
                          <div 
                            className="rounded-lg px-2.5 py-1.5 text-xs border transition-opacity flex flex-col justify-center h-full cursor-pointer hover:opacity-90 overflow-hidden"
                            style={{ 
                              backgroundColor: `${typeColor}20`, // 20 hex is ~12% opacity
                              borderColor: `${typeColor}60`, // 60 hex is ~40% opacity
                              color: typeColor
                            }}
                            title={`${leave.leave_type?.name} (${leave.start_date} to ${leave.end_date})`}
                          >
                            <div className="font-semibold text-xs leading-tight truncate">{leave.leave_type?.name}</div>
                            <div className="text-[10px] mt-0.5 opacity-80 truncate">Paid Leave</div>
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
      </div>"""
    return grid_jsx

# Let's replace the grid block
parts = content.split('{/* Timeline Grid */}')
if len(parts) == 2:
    pre = parts[0]
    post = parts[1]
    # The post contains the old table wrapper which ends right before the last closing </div> of the component.
    # We can just drop post because we're replacing until the end, but wait, the component needs a closing </div>.
    pass
