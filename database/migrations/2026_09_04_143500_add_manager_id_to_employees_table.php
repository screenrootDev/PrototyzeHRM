<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('manager_id')
                ->nullable()
                ->after('designation_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        // Seed ScreenRoot's approved reporting lines into the new relationship.
        $companyId = DB::table('users')->whereRaw('LOWER(name) = ?', ['screenroot'])->value('id');
        if (!$companyId) {
            return;
        }

        $users = DB::table('users')
            ->where('created_by', $companyId)
            ->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [mb_strtolower(trim($name)) => $id]);

        $reportingLines = [
            'arjun sugathan' => 'priyanka kane',
            'rohit sankpal' => 'priyanka kane',
            'sahil sardessai' => 'pratyay banerjee',
            'pradeep kale' => 'pratyay banerjee',
            'chaitanya patankar' => 'pratyay banerjee',
            'pragathi bhat' => 'pratyay banerjee',
            'shriram parab' => 'pratyay banerjee',
            'abir mondal' => 'pratyay banerjee',
            'esha sharma' => 'pratyay banerjee',
            'manan swarup' => 'pratyay banerjee',
            'prajjwal kumar' => 'pratyay banerjee',
            'samragyee bhattacharjee' => 'pratyay banerjee',
        ];

        foreach ($reportingLines as $employeeName => $managerName) {
            $employeeUserId = $users->get($employeeName);
            $managerUserId = $users->get($managerName);

            if ($employeeUserId && $managerUserId && $employeeUserId !== $managerUserId) {
                DB::table('employees')
                    ->where('user_id', $employeeUserId)
                    ->update(['manager_id' => $managerUserId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropConstrainedForeignId('manager_id');
        });
    }
};
