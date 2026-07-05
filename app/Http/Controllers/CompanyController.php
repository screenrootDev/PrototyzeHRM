<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AddOn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('type', 'company');

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Apply sorting
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Get paginated results
        $perPage = $request->input('per_page', 10);
        $companies = $query->paginate($perPage)->withQueryString();

        // Transform data for frontend
        $companies->getCollection()->transform(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'phone' => $company->phone,
                'status' => $company->status,
                'created_at' => $company->created_at,
                'total_storage_limit' => $company->total_storage_limit,
                'avatar' => $company->avatar,
                'active_module' => $company->active_module,
            ];
        });

        return Inertia::render('companies/index', [
            'companies' => $companies,
            'filters' => $request->only(['search', 'status', 'start_date', 'end_date', 'sort_field', 'sort_direction', 'per_page']),
            'availableModules' => AddOn::where('is_enable', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'status' => 'nullable|in:active,inactive',
            'total_storage_limit' => 'nullable|numeric|min:0',
            'avatar' => 'nullable|string',
            'active_module' => 'nullable|array',
        ]);

        $company = new User;
        $company->name = $validated['name'];
        $company->email = $validated['email'];
        $company->phone = $validated['phone'] ?? null;

        // Only set password if provided
        if (isset($validated['password'])) {
            $company->password = Hash::make($validated['password']);
        }

        $company->type = 'company';
        $company->status = $validated['status'] ?? 'active';
        $company->total_storage_limit = $validated['total_storage_limit'] ?? 5.00;
        $company->avatar = $validated['avatar'] ?? null;
        $company->active_module = $validated['active_module'] ?? [];
        $company->created_by = creatorId() ?? 1;

        // Language support has been removed


        $company->save();

        // Assign role and settings to the user
        defaultRoleAndSetting($company);

        // Trigger email notification
        event(new \App\Events\UserCreated($company, $validated['password'] ?? ''));

        // Check for email errors
        if (session()->has('email_error')) {
            return redirect()->back()->with('warning', __('Company created successfully, but welcome email failed: ') . session('email_error'));
        }

        return redirect()->back()->with('success', __('Company created successfully'));
    }

    public function update(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $company->id,
            'phone' => 'nullable|string|max:20',
            'total_storage_limit' => 'nullable|numeric|min:0',
            'avatar' => 'nullable|string',
            'active_module' => 'nullable|array',
        ]);

        $company->name = $validated['name'];
        $company->email = $validated['email'];
        if ($request->has('phone')) {
            $company->phone = $request->input('phone');
        }
        if (isset($validated['total_storage_limit'])) {
            $company->total_storage_limit = $validated['total_storage_limit'];
        }
        
        if (array_key_exists('avatar', $validated)) {
            $company->avatar = $validated['avatar'];
        }
        if (array_key_exists('active_module', $validated)) {
            $company->active_module = $validated['active_module'];
        }

        $company->save();

        return redirect()->back()->with('success', __('Company updated successfully'));
    }

    public function destroy(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $company->delete();

        return redirect()->back()->with('success', __('Company deleted successfully'));
    }

    public function resetPassword(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $company->password = Hash::make($validated['password']);
        $company->save();

        return redirect()->back()->with('success', __('Password reset successfully'));
    }

    public function toggleStatus(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $company->status = $company->status === 'active' ? 'inactive' : 'active';
        $company->save();

        return redirect()->back()->with('success', __('Company status updated successfully'));
    }

}
