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
        Schema::disableForeignKeyConstraints();

        // Drop foreign key if it exists
        try {
            Schema::table('users', function (Blueprint $table) {
                // Laravel convention for foreign key name is [table]_[column]_foreign
                $table->dropForeign('users_plan_id_foreign');
            });
        } catch (\Exception $e) {
            // If the convention name fails, try the array syntax which is also common
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['plan_id']);
                });
            } catch (\Exception $e) {
                // Ignore if foreign key doesn't exist or has a different name
            }
        }

        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [
                'plan_id',
                'plan_expire_date',
                'requested_plan',
                'plan_is_active',
                'is_trial',
                'trial_day',
                'trial_expire_date',
            ];

            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'plan_id')) {
                $table->unsignedBigInteger('plan_id')->nullable();
            }
            if (!Schema::hasColumn('users', 'plan_expire_date')) {
                $table->date('plan_expire_date')->nullable();
            }
            if (!Schema::hasColumn('users', 'requested_plan')) {
                $table->unsignedBigInteger('requested_plan')->nullable();
            }
            if (!Schema::hasColumn('users', 'plan_is_active')) {
                $table->boolean('plan_is_active')->default(true);
            }
            if (!Schema::hasColumn('users', 'is_trial')) {
                $table->boolean('is_trial')->default(false);
            }
            if (!Schema::hasColumn('users', 'trial_day')) {
                $table->integer('trial_day')->default(0);
            }
            if (!Schema::hasColumn('users', 'trial_expire_date')) {
                $table->date('trial_expire_date')->nullable();
            }
        });
    }
};
