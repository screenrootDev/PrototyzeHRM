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
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('total_storage_limit', 15, 2)->default(5.00)->after('plan_id');
        });

        // Populate total_storage_limit for existing companies from their plans
        $companies = \DB::table('users')
            ->where('type', 'company')
            ->whereNotNull('plan_id')
            ->get();

        foreach ($companies as $company) {
            $plan = \DB::table('plans')->where('id', $company->plan_id)->first();
            if ($plan) {
                \DB::table('users')
                    ->where('id', $company->id)
                    ->update(['total_storage_limit' => $plan->storage_limit]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('total_storage_limit');
        });
    }
};
