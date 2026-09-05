<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('time_entries', function (Blueprint $table) {
            $table->string('source', 50)->nullable()->after('created_by');
            $table->string('external_id')->nullable()->after('source');
            $table->unique(['created_by', 'source', 'external_id'], 'time_entries_external_unique');
        });
    }

    public function down(): void
    {
        Schema::table('time_entries', function (Blueprint $table) {
            $table->dropUnique('time_entries_external_unique');
            $table->dropColumn(['source', 'external_id']);
        });
    }
};
