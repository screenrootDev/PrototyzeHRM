<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Jobs\SyncFreedcampTimeEntries;
use App\Models\TimeEntry;
use App\Models\User;
use App\Services\FreedcampService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TimeEntryController extends Controller
{
    public function __construct(private readonly FreedcampService $freedcamp) {}

    public function index(Request $request)
    {
        if (Auth::user()->can('manage-time-entries')) {
            $query = TimeEntry::with(['employee.employee', 'approver', 'creator'])->where(function ($q) {
                if (Auth::user()->can('manage-any-time-entries')) {
                    $q->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-time-entries')) {
                    $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                } else {
                    $q->whereRaw('1 = 0');
                }
            });

            // Handle search
            if ($request->has('search') && ! empty($request->search)) {
                $query->where(function ($q) use ($request) {
                    $q->where('description', 'like', '%'.$request->search.'%')
                        ->orWhere('project', 'like', '%'.$request->search.'%')
                        ->orWhereHas('employee', function ($subQ) use ($request) {
                            $subQ->where('name', 'like', '%'.$request->search.'%');
                        });
                });
            }

            // Handle employee filter
            if ($request->has('employee_id') && ! empty($request->employee_id) && $request->employee_id !== 'all') {
                $query->where('employee_id', $request->employee_id);
            }

            // Handle project filter
            if ($request->has('project') && ! empty($request->project) && $request->project !== 'all') {
                $query->where('project', $request->project);
            }

            // Handle week filter (week_start / week_end passed from the grid navigation)
            $weekStart = $request->has('week_start') && ! empty($request->week_start)
                ? $request->week_start
                : now()->startOfWeek(\Carbon\Carbon::MONDAY)->toDateString();

            $weekEnd = $request->has('week_end') && ! empty($request->week_end)
                ? $request->week_end
                : now()->endOfWeek(\Carbon\Carbon::SUNDAY)->toDateString();

            // Always use the requested dates so historical weeks show their real entries.
            if ($request->has('date_from') && ! empty($request->date_from)) {
                $query->where('date', '>=', $request->date_from);
            }
            if ($request->has('date_to') && ! empty($request->date_to)) {
                $query->where('date', '<=', $request->date_to);
            }

            $query->where('date', '>=', $weekStart)
                ->where('date', '<=', $weekEnd);

            $statusCounts = [
                'all' => (clone $query)->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'approved' => (clone $query)->where('status', 'approved')->count(),
                'rejected' => (clone $query)->where('status', 'rejected')->count(),
            ];

            // Handle status filter
            if ($request->has('status') && ! empty($request->status) && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Handle sorting
            if ($request->has('sort_field') && ! empty($request->sort_field)) {
                $sortField = $request->sort_field;
                $sortDirection = $request->sort_direction ?? 'asc';

                if ($sortField === 'created_at') {
                    $query->orderBy('created_at', $sortDirection);
                } else {
                    $query->orderBy('date', 'desc');
                }
            } else {
                $query->orderBy('id', 'desc');
            }

            $timeEntries = $query->get()->map(function ($entry) {
                if ($entry->employee) {
                    $entry->employee->avatar = $this->resolveAvatarUrl(
                        $entry->employee->getRawOriginal('avatar')
                    );
                }

                return $entry;
            });

            // Get employees for filter dropdown
            $employees = User::where('type', 'employee')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->get(['id', 'name']);

            // Get unique projects for filter dropdown
            $projects = TimeEntry::whereIn('created_by', getCompanyAndUsersId())
                ->whereNotNull('project')
                ->distinct()
                ->pluck('project');

            $workingDaysJson = settings()['working_days'] ?? '[1,2,3,4,5]';
            $workingDays = json_decode($workingDaysJson, true) ?? [1, 2, 3, 4, 5];

            return Inertia::render('hr/time-entries/index', [
                'timeEntries' => $timeEntries,
                'employees' => $this->getFilteredEmployees(),
                'projects' => $projects,
                'statusCounts' => $statusCounts,
                'hasSampleFile' => file_exists(storage_path('uploads/sample/sample-time-entry.xlsx')),
                'filters' => $request->all(['search', 'employee_id', 'status', 'project', 'date_from', 'date_to', 'week_start', 'week_end', 'sort_field', 'sort_direction']),
                'workingDays' => $workingDays,
                'freedcampConfigured' => filled(getSetting('freedcamp_api_key')) && filled(getSetting('freedcamp_secret_key')),
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    private function getFilteredEmployees()
    {
        // Get employees for filter dropdown (compatible with getFilteredEmployees logic)
        $employeeQuery = Employee::whereIn('created_by', getCompanyAndUsersId());

        if (Auth::user()->can('manage-own-time-entries') && ! Auth::user()->can('manage-any-time-entries')) {
            $employeeQuery->where(function ($q) {
                $q->where('created_by', Auth::id())->orWhere('user_id', Auth::id());
            });
        }

        $employees = User::emp()
            ->with(['employee.designation'])
            ->whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->whereIn('id', $employeeQuery->pluck('user_id'))
            ->select('id', 'name', 'avatar')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'employee_id' => $user->employee->employee_id ?? '',
                    'designation' => $user->employee->designation->name ?? '',
                    'avatar' => $this->resolveAvatarUrl($user->getRawOriginal('avatar')),
                ];
            });

        return $employees;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'hours' => 'required|numeric|min:0.5|max:24',
            'description' => 'required|string',
            'project' => 'nullable|string|max:255',
        ]);

        $validated['created_by'] = creatorId();

        TimeEntry::create($validated);

        return redirect()->back()->with('success', __('Time entry created successfully.'));
    }

    public function update(Request $request, $timeEntryId)
    {
        $timeEntry = TimeEntry::where('id', $timeEntryId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($timeEntry) {
            try {
                $validated = $request->validate([
                    'employee_id' => 'required|exists:users,id',
                    'date' => 'required|date',
                    'hours' => 'required|numeric|min:0.5|max:24',
                    'description' => 'required|string',
                    'project' => 'nullable|string|max:255',
                ]);

                // Only allow updates if status is pending
                if ($timeEntry->status !== 'pending') {
                    return redirect()->back()->with('error', __('Cannot update processed time entry.'));
                }

                $timeEntry->update($validated);

                return redirect()->back()->with('success', __('Time entry updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update time entry'));
            }
        } else {
            return redirect()->back()->with('error', __('Time entry Not Found.'));
        }
    }

    public function destroy($timeEntryId)
    {
        $timeEntry = TimeEntry::where('id', $timeEntryId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($timeEntry) {
            try {
                // Only allow deletion if status is pending
                if ($timeEntry->status !== 'pending') {
                    return redirect()->back()->with('error', __('Cannot delete processed time entry.'));
                }

                $timeEntry->delete();

                return redirect()->back()->with('success', __('Time entry deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete time entry'));
            }
        } else {
            return redirect()->back()->with('error', __('Time entry Not Found.'));
        }
    }

    public function updateStatus(Request $request, $timeEntryId)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'manager_comments' => 'nullable|string',
        ]);

        $timeEntry = TimeEntry::where('id', $timeEntryId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($timeEntry) {
            try {
                $timeEntry->update([
                    'status' => $validated['status'],
                    'manager_comments' => $validated['manager_comments'],
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                ]);

                return redirect()->back()->with('success', __('Time entry status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update time entry status'));
            }
        } else {
            return redirect()->back()->with('error', __('Time entry Not Found.'));
        }
    }

    public function export()
    {
        if (Auth::user()->can('manage-time-entries')) {
            try {
                $timeEntries = TimeEntry::with(['employee', 'approver'])
                    ->where(function ($q) {
                        if (Auth::user()->can('manage-any-time-entries')) {
                            $q->whereIn('created_by', getCompanyAndUsersId());
                        } elseif (Auth::user()->can('manage-own-time-entries')) {
                            $q->where('created_by', Auth::id())->orWhere('employee_id', Auth::id())->orWhere('approved_by', Auth::id());
                        } else {
                            $q->whereRaw('1 = 0');
                        }
                    })->orderBy('date', 'desc')->get();

                $fileName = 'time_entries_'.date('Y-m-d_His').'.csv';
                $headers = [
                    'Content-Type' => 'text/csv',
                    'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
                ];

                $callback = function () use ($timeEntries) {
                    $file = fopen('php://output', 'w');
                    fputcsv($file, [
                        'Employee',
                        'Date',
                        'Hours',
                        'Project',
                        'Description',
                        'Status',
                        'Approved By',
                        'Approved At',
                        'Submitted On',
                    ]);

                    foreach ($timeEntries as $entry) {
                        fputcsv($file, [
                            $entry->employee->name ?? '',
                            $entry->date ? date('Y-m-d', strtotime($entry->date)) : '',
                            $entry->hours ?? '',
                            $entry->project ?? '',
                            $entry->description ?? '',
                            $entry->status ?? '',
                            $entry->approver->name ?? '',
                            $entry->approved_at ?? '',
                            $entry->created_at ?? '',
                        ]);
                    }
                    fclose($file);
                };

                return response()->stream($callback, 200, $headers);
            } catch (\Exception $e) {
                return response()->json(['message' => __('Failed to export time entries: :message', ['message' => $e->getMessage()])], 500);
            }
        } else {
            return response()->json(['message' => __('Permission Denied.')], 403);
        }
    }

    public function downloadTemplate()
    {
        $filePath = storage_path('uploads/sample/sample-time-entry.xlsx');
        if (! file_exists($filePath)) {
            return response()->json(['error' => __('Template file not available')], 404);
        }

        return response()->download($filePath, 'sample-time-entry.xlsx');
    }

    public function parseFile(Request $request)
    {
        if (Auth::user()->can('manage-time-entries')) {
            $rules = ['file' => 'required|mimes:csv,txt,xlsx,xls'];
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json(['message' => $validator->getMessageBag()->first()]);
            }

            try {
                $file = $request->file('file');
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
                $worksheet = $spreadsheet->getActiveSheet();
                $highestColumn = $worksheet->getHighestColumn();
                $highestRow = $worksheet->getHighestRow();
                $headers = [];

                for ($col = 'A'; $col <= $highestColumn; $col++) {
                    $value = $worksheet->getCell($col.'1')->getValue();
                    if ($value) {
                        $headers[] = (string) $value;
                    }
                }

                $previewData = [];
                for ($row = 2; $row <= $highestRow; $row++) {
                    $rowData = [];
                    $colIndex = 0;
                    for ($col = 'A'; $col <= $highestColumn; $col++) {
                        if ($colIndex < count($headers)) {
                            $rowData[$headers[$colIndex]] = (string) $worksheet->getCell($col.$row)->getValue();
                        }
                        $colIndex++;
                    }
                    $previewData[] = $rowData;
                }

                return response()->json(['excelColumns' => $headers, 'previewData' => $previewData]);
            } catch (\Exception $e) {
                return response()->json(['message' => __('Failed to parse file: :error', ['error' => $e->getMessage()])]);
            }
        } else {
            return response()->json(['message' => __('Permission denied.')], 403);
        }
    }

    public function fileImport(Request $request)
    {
        if (Auth::user()->can('manage-time-entries')) {
            $rules = ['data' => 'required|array'];
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return redirect()->back()->with('error', $validator->getMessageBag()->first());
            }

            try {
                $data = $request->data;
                $imported = 0;
                $skipped = 0;

                foreach ($data as $row) {
                    try {
                        if (empty($row['employee']) || empty($row['date']) || empty($row['hours'])) {
                            $skipped++;

                            continue;
                        }

                        $employee = User::where('name', $row['employee'])
                            ->whereIn('created_by', getCompanyAndUsersId())
                            ->where('type', 'employee')
                            ->first();

                        if (! $employee) {
                            $skipped++;

                            continue;
                        }

                        // Check if time entry already exists for this employee and date
                        $exists = TimeEntry::where('employee_id', $employee->id)
                            ->whereDate('date', $row['date'])
                            ->exists();

                        if ($exists) {
                            $skipped++;

                            continue;
                        }

                        TimeEntry::create([
                            'employee_id' => $employee->id,
                            'date' => $row['date'],
                            'hours' => $row['hours'],
                            'project' => $row['project'] ?? null,
                            'description' => $row['description'] ?? '',
                            'status' => 'pending',
                            'created_by' => creatorId(),
                        ]);

                        $imported++;
                    } catch (\Exception $e) {
                        $skipped++;
                    }
                }

                return redirect()->back()->with('success', __('Import completed: :added time entries added, :skipped time entries skipped', ['added' => $imported, 'skipped' => $skipped]));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to import: :error', ['error' => $e->getMessage()]));
            }
        } else {
            return redirect()->back()->with('error', __('Permission denied.'));
        }
    }

    public function syncFreedcamp(Request $request)
    {
        $syncAll = $request->boolean('sync_all');
        $validated = $request->validate([
            'sync_all' => 'nullable|boolean',
            'run_now' => 'nullable|boolean',
            'date_from' => ['nullable', Rule::requiredIf(! $syncAll), 'date_format:Y-m-d'],
            'date_to' => ['nullable', Rule::requiredIf(! $syncAll), 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        if ($syncAll && ! $request->boolean('run_now')) {
            updateSetting('freedcamp_sync_status', 'queued');
            updateSetting('freedcamp_sync_message', __('Full Freedcamp history sync queued.'));
            SyncFreedcampTimeEntries::dispatchAfterResponse(Auth::id(), true);

            return back()->with('success', __('Full Freedcamp history sync started in the background.'));
        }

        try {
            $dateFrom = $syncAll ? '2000-01-01' : $validated['date_from'];
            $dateTo = $syncAll
                ? now(getSetting('defaultTimezone', config('app.timezone', 'UTC')))->toDateString()
                : $validated['date_to'];

            if ($syncAll) {
                set_time_limit(0);
            }

            $workspace = $this->freedcamp->workspace();
            $freedcampTimes = $this->freedcamp->times($dateFrom, $dateTo);
            $linkedTaskIds = collect($freedcampTimes)
                ->filter(fn (array $time) => (string) ($time['link_app_id'] ?? '') === '2'
                    && filled($time['link_item_id'] ?? null))
                ->pluck('link_item_id')
                ->all();
            $taskDetails = collect($this->freedcamp->taskDetails($linkedTaskIds));

            $freedcampUsers = collect($workspace['users'] ?? [])->keyBy(fn ($user) => (string) ($user['user_id'] ?? $user['id'] ?? ''));
            $projects = collect($workspace['projects'] ?? [])->mapWithKeys(fn ($project) => [
                (string) ($project['project_id'] ?? $project['id'] ?? '') => $project['project_name'] ?? $project['name'] ?? null,
            ]);
            $employees = User::with('employee')->where('type', 'employee')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->get();

            // Link an unmapped employee only when the Freedcamp abbreviated name
            // has exactly one matching HRM first name and surname initial.
            foreach ($freedcampUsers as $freedcampUserId => $freedcampUser) {
                $freedcampName = trim((string) ($freedcampUser['full_name'] ?? $freedcampUser['name'] ?? ''));
                $freedcampParts = preg_split('/\s+/', strtolower($freedcampName), -1, PREG_SPLIT_NO_EMPTY);

                if (count($freedcampParts) < 2) {
                    continue;
                }

                $firstName = $freedcampParts[0];
                $surnameInitial = substr(end($freedcampParts), 0, 1);
                $candidates = $employees->filter(function (User $user) use ($firstName, $surnameInitial) {
                    if (filled($user->employee?->freedcamp_user_id)) {
                        return false;
                    }

                    $parts = preg_split('/\s+/', strtolower(trim($user->name)), -1, PREG_SPLIT_NO_EMPTY);

                    return count($parts) >= 2
                        && $parts[0] === $firstName
                        && substr(end($parts), 0, 1) === $surnameInitial;
                });

                if ($candidates->count() === 1 && filled($freedcampUserId)) {
                    $candidate = $candidates->first();
                    $candidate->employee->update(['freedcamp_user_id' => (string) $freedcampUserId]);
                }
            }

            $employeesByFreedcampId = $employees
                ->filter(fn (User $user) => filled($user->employee?->freedcamp_user_id))
                ->keyBy(fn (User $user) => (string) $user->employee->freedcamp_user_id);
            $employeesByEmail = $employees->keyBy(fn (User $user) => strtolower(trim($user->email)));

            $synced = 0;
            $skipped = 0;
            $unassigned = 0;
            $rows = [];
            $timestamp = now();

            foreach ($freedcampTimes as $time) {
                $freedcampUserId = (string) ($time['assigned_to_id'] ?? '');

                if ($freedcampUserId === '' || $freedcampUserId === '-1') {
                    $unassigned++;

                    continue;
                }

                $freedcampUser = $freedcampUsers->get($freedcampUserId);
                $email = strtolower(trim((string) ($freedcampUser['email'] ?? '')));
                $employee = $employeesByFreedcampId->get($freedcampUserId)
                    ?? $employeesByEmail->get($email);
                $task = $taskDetails->get((string) ($time['link_item_id'] ?? ''));

                if (! $employee || empty($time['id']) || empty($time['date_ts'])) {
                    $skipped++;

                    continue;
                }

                $rows[] = [
                    'created_by' => creatorId(),
                    'source' => 'freedcamp',
                    'external_id' => (string) $time['id'],
                    'employee_id' => $employee->id,
                    'date' => Carbon::createFromTimestampUTC((int) $time['date_ts'])
                        ->setTimezone(getSetting('defaultTimezone', config('app.timezone', 'UTC')))
                        ->toDateString(),
                    'hours' => round(((int) ($time['minutes_count'] ?? 0)) / 60, 2),
                    'description' => ($time['description'] ?? '')
                        ?: ($task['title'] ?? null)
                        ?: __('Freedcamp time entry'),
                    'project' => $projects->get((string) ($time['project_id'] ?? '')),
                    'status' => (int) ($time['status'] ?? 0) === 1 ? 'approved' : 'pending',
                    'external_data' => $task ? json_encode([
                        'task_id' => (string) ($task['id'] ?? ''),
                        'title' => $task['title'] ?? null,
                        'list' => $task['task_group_name'] ?? $task['list_title'] ?? null,
                        'status' => $task['status_title'] ?? null,
                        'url' => $task['url'] ?? null,
                    ]) : null,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
                $synced++;
            }

            foreach (array_chunk($rows, 500) as $chunk) {
                TimeEntry::upsert(
                    $chunk,
                    ['created_by', 'source', 'external_id'],
                    ['employee_id', 'date', 'hours', 'description', 'project', 'status', 'external_data', 'updated_at'],
                );
            }

            return back()->with('success', __('Freedcamp sync completed: :synced synced, :skipped skipped because no employee mapping matched, :unassigned unassigned ignored.', [
                'synced' => $synced,
                'skipped' => $skipped,
                'unassigned' => $unassigned,
            ]));
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with('error', __('Freedcamp sync failed: :message', ['message' => $exception->getMessage()]));
        }
    }

    private function resolveAvatarUrl(?string $avatar): ?string
    {
        if (blank($avatar)) {
            return null;
        }

        if (filter_var($avatar, FILTER_VALIDATE_URL)) {
            return $avatar;
        }

        $path = ltrim($avatar, '/');

        return str_starts_with($path, 'storage/')
            ? url($path)
            : url('storage/media/'.$path);
    }
}
