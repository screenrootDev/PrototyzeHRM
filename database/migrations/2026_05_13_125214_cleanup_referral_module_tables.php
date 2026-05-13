<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('referral_transactions');
        Schema::dropIfExists('payout_requests');
        Schema::dropIfExists('referral_settings');
        Schema::dropIfExists('coupons');
        
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'referral_code')) {
                $table->dropColumn('referral_code');
            }
            if (Schema::hasColumn('users', 'used_referral_code')) {
                $table->dropColumn('used_referral_code');
            }
        });
    }

    public function down(): void
    {
        // No rollback for destructive cleanup
    }
};
