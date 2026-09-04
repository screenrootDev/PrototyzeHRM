<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const ROLE_PERMISSIONS = [
        'manage-leave-applications',
        'manage-any-leave-applications',
        'view-leave-applications',
        'approve-leave-applications',
        'reject-leave-applications',
    ];

    public function up(): void
    {
        $companyId = DB::table('users')->whereRaw('LOWER(name) = ?', ['screenroot'])->value('id');
        if (!$companyId) {
            return;
        }

        $now = now();
        $roleIds = [];
        $permissionIds = DB::table('permissions')
            ->where('guard_name', 'web')
            ->whereIn('name', self::ROLE_PERMISSIONS)
            ->pluck('id');

        foreach ([
            'project-manager' => ['Project Manager', 'Project Manager Role'],
            'team-lead' => ['Team Lead', 'Team Lead Role'],
        ] as $slug => [$label, $description]) {
            $roleId = DB::table('roles')
                ->where('name', $slug)
                ->where('guard_name', 'web')
                ->where('created_by', $companyId)
                ->value('id');

            if (!$roleId) {
                $roleId = DB::table('roles')->insertGetId([
                    'name' => $slug,
                    'guard_name' => 'web',
                    'label' => $label,
                    'description' => $description,
                    'created_by' => $companyId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $roleIds[$slug] = $roleId;

            foreach ($permissionIds as $permissionId) {
                DB::table('role_has_permissions')->updateOrInsert([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }

        $employees = DB::table('employees')
            ->join('users', 'users.id', '=', 'employees.user_id')
            ->join('designations', 'designations.id', '=', 'employees.designation_id')
            ->where('users.created_by', $companyId)
            ->whereIn(DB::raw('LOWER(designations.name)'), ['project manager', 'team lead'])
            ->select('users.id as user_id', 'designations.name as designation')
            ->get();

        foreach ($employees as $employee) {
            $roleSlug = strtolower($employee->designation) === 'project manager'
                ? 'project-manager'
                : 'team-lead';

            DB::table('model_has_roles')->updateOrInsert([
                'role_id' => $roleIds[$roleSlug],
                'model_type' => App\Models\User::class,
                'model_id' => $employee->user_id,
            ]);

            foreach ($permissionIds as $permissionId) {
                DB::table('model_has_permissions')->updateOrInsert([
                    'permission_id' => $permissionId,
                    'model_type' => App\Models\User::class,
                    'model_id' => $employee->user_id,
                ]);
            }
        }
    }

    public function down(): void
    {
        $companyId = DB::table('users')->whereRaw('LOWER(name) = ?', ['screenroot'])->value('id');
        if (!$companyId) {
            return;
        }

        $roleIds = DB::table('roles')
            ->where('created_by', $companyId)
            ->whereIn('name', ['project-manager', 'team-lead'])
            ->pluck('id');

        $userIds = DB::table('model_has_roles')
            ->whereIn('role_id', $roleIds)
            ->where('model_type', App\Models\User::class)
            ->pluck('model_id');

        $permissionIds = DB::table('permissions')
            ->where('guard_name', 'web')
            ->whereIn('name', self::ROLE_PERMISSIONS)
            ->pluck('id');

        DB::table('model_has_permissions')
            ->where('model_type', App\Models\User::class)
            ->whereIn('model_id', $userIds)
            ->whereIn('permission_id', $permissionIds)
            ->delete();

        DB::table('model_has_roles')->whereIn('role_id', $roleIds)->delete();
        DB::table('role_has_permissions')->whereIn('role_id', $roleIds)->delete();
        DB::table('roles')->whereIn('id', $roleIds)->delete();
    }
};
