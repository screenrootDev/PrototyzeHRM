<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Designation;
use App\Models\DocumentType;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-employees')) {
            $authUser     = Auth::user();
            $query = User::with(['employee.branch', 'employee.department', 'employee.designation'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-employees')) {
                        $q->whereIn('created_by',  getCompanyAndUsersId());
                    } elseif (Auth::user()->can('manage-own-employees')) {
                        $q->where('created_by', Auth::id())->orWhere('id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->where('type', 'employee');

            // Keep the overview counts independent from the active table filters.
            $statsQuery = clone $query;
            $stats = [
                'total' => (clone $statsQuery)->count(),
                'full_time' => (clone $statsQuery)->whereHas('employee', fn ($q) => $q->where('employment_type', 'Full-time'))->count(),
                'part_time' => (clone $statsQuery)->whereHas('employee', fn ($q) => $q->where('employment_type', 'Part-time'))->count(),
                'temporary' => (clone $statsQuery)->whereHas('employee', fn ($q) => $q->where('employment_type', 'Temporary'))->count(),
                'contract' => (clone $statsQuery)->whereHas('employee', fn ($q) => $q->where('employment_type', 'Contract'))->count(),
            ];

            // Handle search
            if ($request->has('search') && !empty($request->search)) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%')
                        ->orWhereHas('employee', function ($eq) use ($request) {
                            $eq->where('employee_id', 'like', '%' . $request->search . '%')
                                ->orWhere('phone', 'like', '%' . $request->search . '%');
                        });
                });
            }

            // Handle department filter
            if ($request->has('department') && !empty($request->department) && $request->department !== 'all') {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('department_id', $request->department);
                });
            }

            // Handle branch filter
            if ($request->has('branch') && !empty($request->branch) && $request->branch !== 'all') {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('branch_id', $request->branch);
                });
            }

            // Handle designation filter
            if ($request->has('designation') && !empty($request->designation) && $request->designation !== 'all') {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('designation_id', $request->designation);
                });
            }

            // Handle status filter
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('employee_status', $request->status);
                });
            }

            // Handle employment type filter (used by the overview tabs).
            if ($request->filled('employment_type') && $request->employment_type !== 'all') {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('employment_type', $request->employment_type);
                });
            }

            // Handle sorting
            if ($request->has('sort_field') && !empty($request->sort_field)) {
                $direction = $request->sort_direction === 'desc' ? 'desc' : 'asc';
                if ($request->sort_field === 'employee_id') {
                    $query->orderBy(
                        Employee::select('employee_id')->whereColumn('employees.user_id', 'users.id'),
                        $direction
                    );
                } else {
                    $query->orderBy('name', $direction);
                }
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $employees = $query->paginate($request->per_page ?? 10);

            // Get branches, departments, and designations for filters
            $branches = Branch::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name']);

            $departments = Department::with('branch')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'branch_id']);

            $designations = Designation::with('department')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'department_id']);


            // Unlimited employees in this version
            $planLimits = [
                'current_users' => User::where('type', 'employee')->whereIn('created_by', getCompanyAndUsersId())->count(),
                'max_users' => 'Unlimited',
                'can_create' => true
            ];


            return Inertia::render('hr/employees/index', [
                'employees' => $employees,
                'branches' => $branches,
                'planLimits' => $planLimits,
                'departments' => $departments,
                'designations' => $designations,
                'stats' => $stats,
                'filters' => $request->all(['search', 'department', 'branch', 'designation', 'status', 'employment_type', 'sort_field', 'sort_direction', 'per_page']),
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    public function export()
    {
        $employees = User::with(['employee.branch', 'employee.department', 'employee.designation'])
            ->where(function ($query) {
                if (Auth::user()->can('manage-any-employees')) {
                    $query->whereIn('created_by', getCompanyAndUsersId());
                } elseif (Auth::user()->can('manage-own-employees')) {
                    $query->where('created_by', Auth::id())->orWhere('id', Auth::id());
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->where('type', 'employee')
            ->orderBy('name')
            ->get();

        $headers = [
            'employee_id', 'name', 'email', 'password', 'phone', 'date_of_birth', 'gender',
            'branch_id', 'branch', 'department_id', 'department', 'designation_id', 'designation',
            'date_of_joining', 'employment_type', 'employee_status', 'address_line_1', 'address_line_2',
            'city', 'state', 'country', 'postal_code', 'emergency_contact_name',
            'emergency_contact_relationship', 'emergency_contact_number', 'bank_name',
            'account_holder_name', 'account_number', 'bank_identifier_code', 'bank_branch',
            'tax_payer_id', 'salary', 'profile_image',
        ];

        return response()->streamDownload(function () use ($employees, $headers) {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, $headers);

            foreach ($employees as $user) {
                $employee = $user->employee;
                $values = [
                    $employee?->employee_id, $user->name, $user->email, '', $employee?->phone,
                    $employee?->date_of_birth, $employee?->gender, $employee?->branch_id,
                    $employee?->branch?->name, $employee?->department_id, $employee?->department?->name,
                    $employee?->designation_id, $employee?->designation?->name, $employee?->date_of_joining,
                    $employee?->employment_type, $employee?->employee_status, $employee?->address_line_1,
                    $employee?->address_line_2, $employee?->city, $employee?->state, $employee?->country,
                    $employee?->postal_code, $employee?->emergency_contact_name,
                    $employee?->emergency_contact_relationship, $employee?->emergency_contact_number,
                    $employee?->bank_name, $employee?->account_holder_name, $employee?->account_number,
                    $employee?->bank_identifier_code, $employee?->bank_branch, $employee?->tax_payer_id,
                    $employee?->base_salary, $user->avatar,
                ];
                fputcsv($stream, array_map(fn ($value) => is_string($value) && preg_match('/^[=+\-@]/', $value) ? "'" . $value : $value, $values));
            }

            fclose($stream);
        }, 'employees-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:5120']]);

        $stream = fopen($request->file('file')->getRealPath(), 'r');
        $headers = array_map(fn ($header) => ltrim(trim((string) $header), "\xEF\xBB\xBF"), fgetcsv($stream) ?: []);
        $requiredHeaders = ['name', 'email', 'password', 'phone', 'date_of_birth', 'gender', 'branch_id', 'department_id', 'designation_id', 'date_of_joining', 'employment_type'];

        if (array_diff($requiredHeaders, $headers)) {
            fclose($stream);
            return back()->with('error', 'The CSV is missing required columns: ' . implode(', ', array_diff($requiredHeaders, $headers)));
        }

        $companyIds = getCompanyAndUsersId();
        $branchIds = Branch::whereIn('created_by', $companyIds)->pluck('id')->all();
        $departmentIds = Department::whereIn('created_by', $companyIds)->pluck('id')->all();
        $designationIds = Designation::whereIn('created_by', $companyIds)->pluck('id')->all();
        $created = 0;
        $rowNumber = 1;
        $rowErrors = [];

        while (($values = fgetcsv($stream)) !== false) {
            $rowNumber++;
            if (count(array_filter($values, fn ($value) => trim((string) $value) !== '')) === 0) continue;
            if ($rowNumber > 501) {
                $rowErrors[] = 'Only the first 500 data rows were processed.';
                break;
            }

            $values = array_pad($values, count($headers), null);
            $row = array_combine($headers, array_slice($values, 0, count($headers)));
            $validator = Validator::make($row, [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
                'phone' => ['required', 'string', 'max:20'],
                'date_of_birth' => ['required', 'date'],
                'gender' => ['required', Rule::in(['male', 'female', 'other'])],
                'branch_id' => ['required', Rule::in($branchIds)],
                'department_id' => ['required', Rule::in($departmentIds)],
                'designation_id' => ['required', Rule::in($designationIds)],
                'date_of_joining' => ['required', 'date'],
                'employment_type' => ['required', Rule::in(['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'])],
                'employee_status' => ['nullable', Rule::in(['active', 'inactive', 'probation', 'terminated'])],
                'salary' => ['nullable', 'numeric', 'min:0'],
            ]);

            if ($validator->fails()) {
                $rowErrors[] = 'Row ' . $rowNumber . ': ' . implode(' ', $validator->errors()->all());
                continue;
            }

            $departmentMatchesBranch = Department::where('id', $row['department_id'])->where('branch_id', $row['branch_id'])->exists();
            $designationMatchesDepartment = Designation::where('id', $row['designation_id'])->where('department_id', $row['department_id'])->exists();
            if (!$departmentMatchesBranch || !$designationMatchesDepartment) {
                $rowErrors[] = 'Row ' . $rowNumber . ': Department, branch, and designation do not belong to the same hierarchy.';
                continue;
            }

            DB::transaction(function () use ($row, &$created) {
                $user = User::create([
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'password' => Hash::make($row['password']),
                    'type' => 'employee',
                    'avatar' => $row['profile_image'] ?? null,
                    'created_by' => creatorId(),
                ]);

                $employeeRole = isSaaS()
                    ? Role::where('created_by', createdBy())->where('name', 'employee')->first()
                    : Role::where('name', 'employee')->first();
                if ($employeeRole) $user->assignRole($employeeRole);

                Employee::create([
                    'user_id' => $user->id,
                    'employee_id' => Employee::generateEmployeeId(),
                    'phone' => $row['phone'], 'date_of_birth' => $row['date_of_birth'], 'gender' => $row['gender'],
                    'branch_id' => $row['branch_id'], 'department_id' => $row['department_id'], 'designation_id' => $row['designation_id'],
                    'date_of_joining' => $row['date_of_joining'], 'employment_type' => $row['employment_type'],
                    'employee_status' => ($row['employee_status'] ?? '') ?: 'active', 'address_line_1' => $row['address_line_1'] ?? null,
                    'address_line_2' => $row['address_line_2'] ?? null, 'city' => $row['city'] ?? null,
                    'state' => $row['state'] ?? null, 'country' => $row['country'] ?? null, 'postal_code' => $row['postal_code'] ?? null,
                    'emergency_contact_name' => $row['emergency_contact_name'] ?? null,
                    'emergency_contact_relationship' => $row['emergency_contact_relationship'] ?? null,
                    'emergency_contact_number' => $row['emergency_contact_number'] ?? null, 'bank_name' => $row['bank_name'] ?? null,
                    'account_holder_name' => $row['account_holder_name'] ?? null, 'account_number' => $row['account_number'] ?? null,
                    'bank_identifier_code' => $row['bank_identifier_code'] ?? null, 'bank_branch' => $row['bank_branch'] ?? null,
                    'tax_payer_id' => $row['tax_payer_id'] ?? null, 'base_salary' => ($row['salary'] ?? '') ?: null, 'created_by' => creatorId(),
                ]);
                $created++;
            });
        }

        fclose($stream);
        $message = $created . ' employee(s) imported successfully.';
        if ($rowErrors) $message .= ' ' . count($rowErrors) . ' row(s) skipped: ' . implode(' | ', array_slice($rowErrors, 0, 5));
        return back()->with($created > 0 ? 'success' : 'error', $message);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        if (Auth::user()->can('create-employees')) {
            // Get branches, departments, designations, and document types for the form
            $branches = Branch::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name']);

            $departments = Department::with('branch')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'branch_id']);

            $designations = Designation::with('department')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'department_id']);

            $documentTypes = DocumentType::whereIn('created_by', getCompanyAndUsersId())
                ->get(['id', 'name', 'is_required']);

            $shifts = \App\Models\Shift::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'start_time', 'end_time']);

            $attendancePolicies = \App\Models\AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name']);

            return Inertia::render('hr/employees/create', [
                'branches' => $branches,
                'departments' => $departments,
                'designations' => $designations,
                'documentTypes' => $documentTypes,
                'shifts' => $shifts,
                'attendancePolicies' => $attendancePolicies,
                'generatedEmployeeId' => Employee::generateEmployeeId(),
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (Auth::user()->can('create-employees')) {
            try {
                // Validate basic information
                $validator = Validator::make($request->all(), [
                    'name' => 'required|string|max:255',
                    'biometric_emp_id' => 'nullable|string|max:255|unique:employees,biometric_emp_id',
                    'email' => 'required|email|max:255|unique:users,email',
                    'password' => 'required|string|min:8',
                    'phone' => 'required|string|max:20',
                    'date_of_birth' => 'required|date',
                    'gender' => 'required|in:male,female,other',
                    'profile_image' => 'required',
                    'shift_id' => 'nullable|exists:shifts,id',
                    'attendance_policy_id' => 'nullable|exists:attendance_policies,id',

                    // Employment details
                    'branch_id' => 'required|exists:branches,id',
                    'department_id' => 'required|exists:departments,id',
                    'designation_id' => 'required|exists:designations,id',
                    'date_of_joining' => 'required|date',
                    'employment_type' => 'required|string|max:50',
                    'employee_status' => 'required|string|max:50',

                    // Contact information
                    'address_line_1' => 'required|string|max:255',
                    'address_line_2' => 'required|string|max:255',
                    'city' => 'required|string|max:100',
                    'state' => 'required|string|max:100',
                    'country' => 'required|string|max:100',
                    'postal_code' => 'required|string|max:20',
                    'emergency_contact_name' => 'required|string|max:255',
                    'emergency_contact_relationship' => 'required|string|max:100',
                    'emergency_contact_number' => 'required|string|max:20',

                    // Banking information
                    'bank_name' => 'required|string|max:255',
                    'account_holder_name' => 'nullable|string|max:255',
                    'account_number' => 'nullable|string|max:50',
                    'bank_identifier_code' => 'nullable|string|max:50',
                    'bank_branch' => 'nullable|string|max:255',
                    'tax_payer_id' => 'nullable|string|max:50',

                    // Documents
                    'documents' => 'nullable|array',
                    'documents.*.document_type_id' => 'required|exists:document_types,id',
                    'documents.*.file_path' => 'required|string',
                    'documents.*.expiry_date' => 'nullable|date',
                ]);

                if ($validator->fails()) {
                    return redirect()->back()->withErrors($validator)->withInput();
                }

                // Create User model object
                $user = new User();
                $user->name = $request->name;
                $user->email = $request->email;
                $user->password = Hash::make($request->password);
                $user->type = 'employee';
                $user->created_by = creatorId();

                // Handle profile image upload for user
                if ($request->has('profile_image')) {
                    $user->avatar = $request->profile_image;
                }
                $user->save();

                // Assign Employee role
                if (isSaaS()) {
                    $employeeRole = Role::where('created_by', createdBy())->where('name', 'employee')->first();
                    if ($employeeRole) {
                        $user->assignRole($employeeRole);
                    }
                } else {
                    $employeeRole = Role::where('name', 'employee')->first();
                    if ($employeeRole) {
                        $user->assignRole($employeeRole);
                    }
                }


                // Create Employee model object
                $employee = new Employee();
                $employee->user_id = $user->id;
                $employee->employee_id = Employee::generateEmployeeId();
                $employee->biometric_emp_id = $request->biometric_emp_id;
                $employee->phone = $request->phone;
                $employee->date_of_birth = $request->date_of_birth;
                $employee->gender = $request->gender;
                $employee->branch_id = $request->branch_id;
                $employee->department_id = $request->department_id;
                $employee->designation_id = $request->designation_id;
                $employee->date_of_joining = $request->date_of_joining;
                $employee->employment_type = $request->employment_type;
                $employee->employee_status = $request->employee_status;
                $employee->address_line_1 = $request->address_line_1;
                $employee->address_line_2 = $request->address_line_2;
                $employee->city = $request->city;
                $employee->state = $request->state;
                $employee->country = $request->country;
                $employee->postal_code = $request->postal_code;
                $employee->emergency_contact_name = $request->emergency_contact_name;
                $employee->emergency_contact_relationship = $request->emergency_contact_relationship;
                $employee->emergency_contact_number = $request->emergency_contact_number;
                $employee->bank_name = $request->bank_name;
                $employee->account_holder_name = $request->account_holder_name;
                $employee->account_number = $request->account_number;
                $employee->bank_identifier_code = $request->bank_identifier_code;
                $employee->bank_branch = $request->bank_branch;
                $employee->tax_payer_id = $request->tax_payer_id;
                $employee->base_salary = $request->salary;
                $employee->created_by = creatorId();
                $employee->save();

                if (!$employee->save()) {
                    throw new \Exception('Failed to save employee data');
                }

                // Handle document uploads
                if ($request->has('documents') && is_array($request->documents)) {
                    foreach ($request->documents as $document) {
                        if (isset($document['file_path']) && !empty($document['file_path'])) {
                            EmployeeDocument::create([
                                'employee_id' => $employee->user_id,
                                'document_type_id' => $document['document_type_id'],
                                'file_path' => $document['file_path'],
                                'expiry_date' => $document['expiry_date'] ?? null,
                                'verification_status' => 'pending',
                                'created_by' => creatorId(),
                            ]);
                        }
                    }
                }

                // Check if this is a candidate conversion
                if ($request->has('candidate_id')) {
                    $candidate = Candidate::find($request->candidate_id);
                    if ($candidate) {
                        $candidate->update(['is_employee' => true]);
                    }
                    return redirect()->route('hr.recruitment.candidates.index')->with('success', __('Candidate converted to employee successfully'));
                }

                return redirect()->route('hr.employees.index')->with('success', __('Employee created successfully'));
            } catch (\Exception $e) {
                \Log::error('Employee creation failed: ' . $e->getMessage());
                \Log::error('Stack trace: ' . $e->getTraceAsString());
                return redirect()->back()->with('error', __('Failed to create employee: :message', ['message' => $e->getMessage()]))->withInput();
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        if (Auth::user()->can('view-employees')) {
            // Check if employee belongs to current company
            $companyUserIds = getCompanyAndUsersId();
            if (!in_array($employee->created_by, $companyUserIds)) {
                return redirect()->back()->with('error', __('You do not have permission to view this employee'));
            }

            // Load user with employee relationships
            $user = User::with(['employee.branch', 'employee.department', 'employee.designation', 'employee.shift', 'employee.attendancePolicy', 'employee.documents.documentType'])
                ->where('id', $employee->user_id)
                ->first();

            return Inertia::render('hr/employees/show', [
                'employee' => $user,
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employee $employee)
    {
        if (Auth::user()->can('edit-employees')) {
            // Check if employee belongs to current company
            $companyUserIds = getCompanyAndUsersId();
            if (!in_array($employee->created_by, $companyUserIds)) {
                return redirect()->back()->with('error', __('You do not have permission to edit this employee'));
            }

            // Load user with employee relationships
            $user = User::with(['employee.branch', 'employee.department', 'employee.designation', 'employee.documents.documentType'])
                ->where('id', $employee->user_id)
                ->first();

            // Get branches, departments, designations, and document types for the form
            $branches = Branch::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name']);

            $departments = Department::with('branch')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'branch_id']);

            $designations = Designation::with('department')
                ->whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'department_id']);

            $documentTypes = DocumentType::whereIn('created_by', getCompanyAndUsersId())
                ->get(['id', 'name', 'is_required']);

            $shifts = \App\Models\Shift::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name', 'start_time', 'end_time']);

            $attendancePolicies = \App\Models\AttendancePolicy::whereIn('created_by', getCompanyAndUsersId())
                ->where('status', 'active')
                ->get(['id', 'name']);

            return Inertia::render('hr/employees/edit', [
                'employee' => $user,
                'branches' => $branches,
                'departments' => $departments,
                'designations' => $designations,
                'documentTypes' => $documentTypes,
                'shifts' => $shifts,
                'attendancePolicies' => $attendancePolicies,
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        if (Auth::user()->can('edit-employees')) {
            // Check if employee belongs to current company
            $companyUserIds = getCompanyAndUsersId();
            if (!in_array($employee->created_by, $companyUserIds)) {
                return redirect()->back()->with('error', __('You do not have permission to update this employee'));
            }

            try {
                // Validate basic information
                $validator = Validator::make($request->all(), [
                    'name' => 'required|string|max:255',
                    'biometric_emp_id' => 'nullable|string|max:255|unique:employees,biometric_emp_id,' . $employee->id,
                    'email' => 'required|email|max:255|unique:users,email,' . $employee->user_id,
                    'password' => 'nullable|string|min:8',
                    'phone' => 'required|string|max:20',
                    'date_of_birth' => 'required|date',
                    'gender' => 'required|in:male,female,other',
                    'profile_image' => 'nullable|max:2048',
                    'shift_id' => 'nullable|exists:shifts,id',
                    'attendance_policy_id' => 'nullable|exists:attendance_policies,id',

                    // Employment details
                    'branch_id' => 'required|exists:branches,id',
                    'department_id' => 'required|exists:departments,id',
                    'designation_id' => 'required|exists:designations,id',
                    'date_of_joining' => 'required|date',
                    'employment_type' => 'required|string|max:50',
                    'employee_status' => 'required|string|max:50',

                    // Contact information
                    'address_line_1' => 'required|string|max:255',
                    'address_line_2' => 'required|string|max:255',
                    'city' => 'required|string|max:100',
                    'state' => 'required|string|max:100',
                    'country' => 'required|string|max:100',
                    'postal_code' => 'required|string|max:20',
                    'emergency_contact_name' => 'required|string|max:255',
                    'emergency_contact_relationship' => 'required|string|max:100',
                    'emergency_contact_number' => 'required|string|max:20',

                    // Banking information
                    'bank_name' => 'required|string|max:255',
                    'account_holder_name' => 'required|string|max:255',
                    'account_number' => 'required|string|max:50',
                    'bank_identifier_code' => 'nullable|string|max:50',
                    'bank_branch' => 'nullable|string|max:255',
                    'tax_payer_id' => 'nullable|string|max:50',

                    // Documents
                    'documents' => 'nullable|array',
                    'documents.*.document_type_id' => 'required|exists:document_types,id',
                    'documents.*.file' => 'nullable|max:5120',
                    'documents.*.expiry_date' => 'nullable|date',
                ]);

                if ($validator->fails()) {
                    return redirect()->back()->withErrors($validator)->withInput();
                }

                // Get the user
                $user = $employee->user;

                // Update User model object
                $user->name = $request->name;
                $user->email = $request->email;

                // Hash password if provided
                if ($request->has('password') && !empty($request->password)) {
                    $user->password = Hash::make($request->password);
                }

                // Handle profile image upload for user
                if ($request->has('profile_image')) {
                    $user->avatar = $request->profile_image;
                }

                $user->save();

                // Update Employee model object
                // Keep existing auto-generated employee_id, don't regenerate on update
                $employee->biometric_emp_id = $request->biometric_emp_id;
                $employee->shift_id = $request->shift_id;
                $employee->attendance_policy_id = $request->attendance_policy_id;
                $employee->phone = $request->phone;
                $employee->date_of_birth = $request->date_of_birth;
                $employee->gender = $request->gender;
                $employee->branch_id = $request->branch_id;
                $employee->department_id = $request->department_id;
                $employee->designation_id = $request->designation_id;
                $employee->date_of_joining = $request->date_of_joining;
                $employee->employment_type = $request->employment_type;
                $employee->employee_status = $request->employee_status;
                $employee->address_line_1 = $request->address_line_1;
                $employee->address_line_2 = $request->address_line_2;
                $employee->city = $request->city;
                $employee->state = $request->state;
                $employee->country = $request->country;
                $employee->postal_code = $request->postal_code;
                $employee->emergency_contact_name = $request->emergency_contact_name;
                $employee->emergency_contact_relationship = $request->emergency_contact_relationship;
                $employee->emergency_contact_number = $request->emergency_contact_number;
                $employee->bank_name = $request->bank_name;
                $employee->account_holder_name = $request->account_holder_name;
                $employee->account_number = $request->account_number;
                $employee->bank_identifier_code = $request->bank_identifier_code;
                $employee->bank_branch = $request->bank_branch;
                $employee->tax_payer_id = $request->tax_payer_id;
                $employee->base_salary = $request->salary;

                $employee->save();

                // Handle document uploads
                if ($request->has('documents') && is_array($request->documents)) {
                    foreach ($request->documents as $document) {
                        if (isset($document['file_path']) && !empty($document['file_path'])) {
                            EmployeeDocument::create([
                                'employee_id' => $employee->user_id,
                                'document_type_id' => $document['document_type_id'],
                                'file_path' => $document['file_path'],
                                'expiry_date' => $document['expiry_date'] ?? null,
                                'verification_status' => 'pending',
                                'created_by' => creatorId(),
                            ]);
                        }
                    }
                }

                return redirect()->route('hr.employees.index')->with('success', __('Employee updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update employee'));
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($userId)
    {
        if (Auth::user()->can('delete-employees')) {
            try {
                $user = User::with('employee')->where('id', $userId)->whereIn('created_by', getCompanyAndUsersId())->first();

                if (!$user || !$user->employee) {
                    return redirect()->back()->with('error', __('Employee not found'));
                }

                $employee = $user->employee;

                // Delete documents first
                EmployeeDocument::where('employee_id', $employee->id)->delete();

                // Delete employee record
                $employee->delete();

                // Delete user record and avatar
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }
                $user->delete();

                return redirect()->route('hr.employees.index')->with('success', __('Employee deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', __('Failed to delete employee: :message', ['message' => $e->getMessage()]));
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Update employee status.
     */
    public function toggleStatus(Employee $employee)
    {
        if (Auth::user()->can('edit-employees')) {
            // Check if employee belongs to current company
            $companyUserIds = getCompanyAndUsersId();
            if (!in_array($employee->created_by, $companyUserIds)) {
                return redirect()->back()->with('error', __('You do not have permission to update this employee'));
            }

            try {
                $user = $employee->user;
                $newStatus = $user->status === 'active' ? 'inactive' : 'active';
                $user->update(['status' => $newStatus]);

                return redirect()->back()->with('success', __('Employee status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update employee status'));
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Change employee password.
     */
    public function changePassword(Request $request, Employee $employee)
    {
        if (Auth::user()->can('edit-employees')) {
            // Check if employee belongs to current company
            $companyUserIds = getCompanyAndUsersId();
            if (!in_array($employee->created_by, $companyUserIds)) {
                return redirect()->back()->with('error', __('You do not have permission to change this employee password'));
            }

            try {
                $validated = $request->validate([
                    'password' => 'required|string|min:8|confirmed',
                ]);

                $user = $employee->user;
                $user->password = Hash::make($validated['password']);
                $user->save();

                return redirect()->back()->with('success', __('Employee password changed successfully.'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to change employee password'));
            }
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Delete employee document.
     */
    public function deleteDocument($userId, $documentId)
    {
        $user = User::with('employee')->find($userId);

        if (!$user || !$user->employee) {
            return redirect()->back()->with('error', __('Employee not found'));
        }

        $companyUserIds = getCompanyAndUsersId();
        if (!in_array($user->created_by, $companyUserIds)) {
            return redirect()->back()->with('error', __('You do not have permission to access this employee'));
        }

        $document = EmployeeDocument::where('id', $documentId)
            ->where('employee_id', $userId)
            ->first();

        if (!$document) {
            return redirect()->back()->with('error', __('Document not found'));
        }

        try {
            $document->delete();
            return redirect()->back()->with('success', __('Document deleted successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to delete document'));
        }
    }

    /**
     * Approve employee document.
     */
    public function approveDocument($userId, $documentId)
    {
        $user = User::with('employee')->find($userId);
        if (!$user || !$user->employee) {
            return redirect()->back()->with('error', __('Employee not found'));
        }

        $document = EmployeeDocument::where('id', $documentId)
            ->where('employee_id', $userId)
            ->first();

        if (!$document) {
            return redirect()->back()->with('error', __('Document not found'));
        }

        try {
            $document->update(['verification_status' => 'verified']);
            return redirect()->back()->with('success', __('Document approved successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to approve document'));
        }
    }

    /**
     * Reject employee document.
     */
    public function rejectDocument($userId, $documentId)
    {
        $user = User::with('employee')->find($userId);
        if (!$user || !$user->employee) {
            return redirect()->back()->with('error', __('Employee not found'));
        }

        $document = EmployeeDocument::where('id', $documentId)
            ->where('employee_id', $userId)
            ->first();

        if (!$document) {
            return redirect()->back()->with('error', __('Document not found'));
        }

        try {
            $document->update(['verification_status' => 'rejected']);
            return redirect()->back()->with('success', __('Document rejected successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to reject document'));
        }
    }

    /**
     * Download employee document.
     */
    public function downloadDocument($userId, $documentId)
    {

        $user = User::with('employee')->find($userId);
        if (!$user || !$user->employee) {
            return redirect()->back()->with('error', __('Employee not found'));
        }

        $companyUserIds = getCompanyAndUsersId();
        if (!in_array($user->created_by, $companyUserIds)) {
            return redirect()->back()->with('error', __('You do not have permission to access this employee'));
        }

        $document = EmployeeDocument::where('id', $documentId)
            ->where('employee_id', $userId)
            ->first();


        if (!$document) {
            return redirect()->back()->with('error', __('Document not found'));
        }

        if (!$document->file_path) {
            return redirect()->back()->with('error', __('Document file not found'));
        }

        $filePath = getStorageFilePath($document->file_path);

        if (!file_exists($filePath)) {
            return redirect()->back()->with('error', __('Document file not found'));
        }

        return response()->download($filePath);
    }
}
