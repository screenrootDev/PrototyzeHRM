<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ImpersonateController extends Controller
{
    public function start(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Log impersonation event
        Log::info('Impersonation started', [
            'acting_user_id' => auth()->id(),
            'impersonated_user_id' => $userId,
            'ip_address' => $request->ip(),
            'timestamp' => now()
        ]);

        $originalUserId = auth()->id();
        
        // Login as the target user using the web guard
        auth()->guard('web')->loginUsingId($userId);
        
        // Store original user ID in session
        session()->put('impersonated_user_id', (int)$userId);
        session()->put('impersonated_by', (int)$originalUserId);
        session()->save();
        
        // Flush Spatie permission cache for the new user
        $user->forgetCachedPermissions();
        
        $dashboardUrl = route('dashboard');
        Log::info('Impersonation successful, hard redirecting to dashboard', [
            'url' => $dashboardUrl,
            'new_user_id' => auth()->id()
        ]);
        
        // Use a plain redirect so the browser makes a completely fresh HTTP request
        // This ensures Spatie permissions and Inertia shared data load fresh for the new user
        return redirect($dashboardUrl);
    }

    public function leave(Request $request)
    {
        Log::info('Impersonation ended', [
            'timestamp' => now()
        ]);

        $originalUserId = session('impersonated_by');
        
        if ($originalUserId) {
            // Switch back to original user
            auth()->guard('web')->loginUsingId($originalUserId);
            
            // Flush Spatie permission cache for restored user
            $originalUser = User::find($originalUserId);
            if ($originalUser) {
                $originalUser->forgetCachedPermissions();
            }
            
            session()->forget('impersonated_by');
            session()->forget('impersonated_user_id');
            session()->save();
        }
        
        $redirectUrl = route('companies.index');
        Log::info('Leaving impersonation, hard redirecting', [
            'url' => $redirectUrl
        ]);

        return redirect($redirectUrl);
    }
}