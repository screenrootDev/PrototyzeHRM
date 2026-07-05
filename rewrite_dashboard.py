import re

# Update Controller
with open('app/Http/Controllers/DashboardController.php', 'r') as f:
    controller_content = f.read()

# Replace deptDistribution with companyDistribution
old_query = """        $deptDistribution = \App\Models\Department::leftJoin('employees', 'departments.id', '=', 'employees.department_id')
            ->select('departments.name', \DB::raw('count(employees.id) as count'))
            ->groupBy('departments.id', 'departments.name')
            ->orderBy('count', 'desc')
            ->get();"""
            
new_query = """        $companyDistribution = \App\Models\User::where('type', 'company')
            ->leftJoin('employees', 'users.id', '=', 'employees.created_by')
            ->select('users.name', \DB::raw('count(employees.id) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderBy('count', 'desc')
            ->get();"""

controller_content = controller_content.replace(old_query, new_query)
controller_content = controller_content.replace("'deptDistribution' => $deptDistribution,", "'companyDistribution' => $companyDistribution,")

with open('app/Http/Controllers/DashboardController.php', 'w') as f:
    f.write(controller_content)

# Update React Component
with open('resources/js/pages/superadmin/dashboard.tsx', 'r') as f:
    react_content = f.read()

react_content = react_content.replace("deptDistribution: Array<{", "companyDistribution: Array<{")
react_content = react_content.replace("const deptData = dashboardData.deptDistribution || [];", "const companyData = dashboardData.companyDistribution || [];")
react_content = react_content.replace("Employees By Department", "Employees By Company")
react_content = react_content.replace("{deptData.length > 0 ?", "{companyData.length > 0 ?")
react_content = react_content.replace("data={deptData}", "data={companyData}")
react_content = react_content.replace("{deptData.map((entry, index) => (", "{companyData.map((entry, index) => (")

with open('resources/js/pages/superadmin/dashboard.tsx', 'w') as f:
    f.write(react_content)
