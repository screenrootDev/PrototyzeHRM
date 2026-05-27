<?php

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Candidate;
use App\Models\EmployeeTransfer;
use App\Models\JobPosting;
use App\Models\TrainingType;
use App\Models\Designation;
use App\Models\JobRequisition;
use App\Models\Offer;
use Illuminate\Support\Facades\DB;

DB::beginTransaction();

try {
    $company = User::where('type', 'company')
        ->where('name', 'like', '%Screenroot%')
        ->first();

    if (!$company) {
        throw new \Exception("Screenroot company not found");
    }

    $mainBranch = Branch::where('created_by', $company->id)
        ->where('name', 'Main Office')
        ->first();

    if (!$mainBranch) {
        $mainBranch = Branch::where('created_by', $company->id)->first();
        if ($mainBranch) {
            $mainBranch->update(['name' => 'Main Office']);
        } else {
            $mainBranch = Branch::create([
                'name' => 'Main Office',
                'created_by' => $company->id,
                'status' => 'active'
            ]);
        }
    }

    $otherBranches = Branch::where('created_by', $company->id)
        ->where('id', '!=', $mainBranch->id)
        ->get();

    foreach ($otherBranches as $branch) {
        // Handle departments specifically to avoid unique constraints
        $departments = Department::where('branch_id', $branch->id)->get();
        foreach ($departments as $dept) {
            $existingMainDept = Department::where('branch_id', $mainBranch->id)
                                        ->where('name', $dept->name)
                                        ->first();
            if ($existingMainDept) {
                // If exists, re-assign everything pointing to $dept to $existingMainDept
                Employee::where('department_id', $dept->id)->update(['department_id' => $existingMainDept->id]);
                Designation::where('department_id', $dept->id)->update(['department_id' => $existingMainDept->id]);
                // Some models might not have department_id, we will check their schemas if needed, but typically:
                // Just in case, wrap in try/catch or assume it exists if we know they do.
                // It's safer to use DB facade to ignore errors if column doesn't exist
                $tablesWithDept = ['candidates', 'job_requisitions', 'employee_transfers', 'offers', 'job_postings'];
                foreach ($tablesWithDept as $table) {
                    try {
                        DB::table($table)->where('department_id', $dept->id)->update(['department_id' => $existingMainDept->id]);
                    } catch (\Exception $e) {}
                }
                
                $dept->delete();
            } else {
                // Safe to just move it
                $dept->update(['branch_id' => $mainBranch->id]);
            }
        }

        // Now move everything else to the main branch
        Employee::where('branch_id', $branch->id)->update(['branch_id' => $mainBranch->id]);
        
        $tablesWithBranch = ['candidates', 'employee_transfers', 'job_postings', 'training_types'];
        foreach ($tablesWithBranch as $table) {
            try {
                DB::table($table)->where('branch_id', $branch->id)->update(['branch_id' => $mainBranch->id]);
            } catch (\Exception $e) {}
        }

        $branch->delete();
    }

    DB::commit();
    echo "Successfully updated branches. Kept only Main Office.";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . " at " . $e->getLine();
}
