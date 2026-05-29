<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckFeatureAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $feature
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $feature)
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }

        // Super admins can access everything
        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $next($request);
        }

        // Get active_modules based on whether the user is a company or an employee
        $activeModules = [];
        if ($user->type === 'company') {
            $activeModules = $user->active_module ?? [];
        } else {
            $companyId = getCompanyId($user->id);
            $company = \App\Models\User::find($companyId);
            if ($company) {
                $activeModules = $company->active_module ?? [];
            }
        }

        // Check if the requested feature is enabled
        if (!in_array($feature, $activeModules)) {
            // Return 403 Forbidden if feature is disabled
            abort(403, 'This feature is not enabled for your company.');
        }

        return $next($request);
    }
}
