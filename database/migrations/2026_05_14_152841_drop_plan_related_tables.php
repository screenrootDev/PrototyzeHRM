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
        // Disable foreign key checks to ensure smooth dropping
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('plan_orders');
        Schema::dropIfExists('plan_requests');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('payment_settings');

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is destructive and part of decommissioning legacy SaaS.
        // Restoration should be handled via database backups if ever needed.
    }
};
