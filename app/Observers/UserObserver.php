<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Plan;

class UserObserver
{
    /**
     * Handle the User "creating" event.
     */
    public function creating(User $user): void
    {
        // No plan assignment in dedicated mode
    }
    
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // No referral logic in dedicated mode
        
        // Create default settings for new company users
        if ($user->type === 'company') {            
            copySettingsFromSuperAdmin($user->id);
        }
    }
}