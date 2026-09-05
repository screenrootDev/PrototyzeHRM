<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class TimeEntry extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'hours',
        'description',
        'project',
        'status',
        'manager_comments',
        'approved_by',
        'approved_at',
        'created_by',
        'source',
        'external_id',
        'external_data',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'hours' => 'decimal:2',
        'approved_at' => 'datetime',
        'external_data' => 'array',
    ];

    /**
     * Get the employee.
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get the manager who approved/rejected.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who created the entry.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get total hours for employee in date range.
     */
    public static function getTotalHours($employeeId, $startDate, $endDate)
    {
        return static::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('hours');
    }

    /**
     * Get project-wise hours for employee.
     */
    public static function getProjectHours($employeeId, $startDate, $endDate)
    {
        return static::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('project, SUM(hours) as total_hours')
            ->groupBy('project')
            ->get();
    }
}
