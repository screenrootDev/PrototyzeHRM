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
        // Drop the email_template_langs table as it's for multi-language templates
        Schema::dropIfExists('email_template_langs');

        // Remove the lang column from the users table
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'lang')) {
                $table->dropColumn('lang');
            }
        });
        
        // Remove the manage-language permission if it exists
        // (Usually handled via Spatie, but good to clean up DB if needed)
        \DB::table('permissions')->where('name', 'manage-language')->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('email_template_langs', function (Blueprint $table) {
            $table->id();
            $table->string('lang');
            $table->unsignedBigInteger('template_id');
            $table->string('subject');
            $table->text('content');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('lang')->default('en')->nullable();
        });
    }
};
