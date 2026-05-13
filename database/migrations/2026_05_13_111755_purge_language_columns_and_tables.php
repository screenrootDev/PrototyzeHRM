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
            if (Schema::hasColumn('users', 'lang')) {
                $table->dropColumn('lang');
            }
        });

        Schema::dropIfExists('languages');
        Schema::dropIfExists('email_template_langs');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('lang', 10)->default('en')->after('email');
        });

        // We don't restore the tables as they are complex and being purged permanently
    }
};
