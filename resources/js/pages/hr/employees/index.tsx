// pages/hr/employees/index.tsx
import React, { useState, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Users, Edit, MoreHorizontal, Unlock, Briefcase, Clock, Calendar, FileText, LayoutGrid } from 'lucide-react';
import { 
  EyeIcon, 
  Trash2Icon, 
  KeyIcon, 
  LockIcon 
} from '@animateicons/react/lucide';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useInitials } from '@/hooks/use-initials';
import { NoRecordsFound } from '@/components/ui/no-records-found';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import {CrudFormModal} from '@/components/CrudFormModal';
import { getImagePath } from '@/utils/helpers';

const AnimatedActionButton = ({ icon: Icon, onClick, className, children, size = 16 }: any) => {
  const iconRef = useRef<any>(null);
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick} 
      className={className + " group"}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="transition-transform duration-300 group-hover:scale-125 flex items-center justify-center">
        <Icon ref={iconRef} size={size} isAnimated={true} />
      </div>
      {children}
    </Button>
  );
};

const AnimatedActionMenuItem = ({ icon: Icon, onClick, className, children, size = 16 }: any) => {
  const iconRef = useRef<any>(null);
  return (
    <DropdownMenuItem 
      onClick={onClick} 
      className={className + " group cursor-pointer"}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="mr-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
        <Icon ref={iconRef} size={size} isAnimated={true} />
      </div>
      {children}
    </DropdownMenuItem>
  );
};

export default function Employees() {
  
  const { auth, employees, branches, planLimits, departments, designations, stats = {}, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();
  
  // State
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedDepartment, setSelectedDepartment] = useState(pageFilters.department || 'all');
  const [selectedBranch, setSelectedBranch] = useState(pageFilters.branch || 'all');
  const [selectedDesignation, setSelectedDesignation] = useState(pageFilters.designation || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState(pageFilters.employment_type || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedDepartment !== 'all' || selectedBranch !== 'all' || selectedDesignation !== 'all' || selectedStatus !== 'all' || selectedEmploymentType !== 'all' || searchTerm !== '';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (selectedDepartment !== 'all' ? 1 : 0) + 
           (selectedBranch !== 'all' ? 1 : 0) + 
           (selectedDesignation !== 'all' ? 1 : 0) + 
           (selectedStatus !== 'all' ? 1 : 0) + 
           (selectedEmploymentType !== 'all' ? 1 : 0) +
           (searchTerm ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.employees.index'), { 
      page: 1,
      search: searchTerm || undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      branch: selectedBranch !== 'all' ? selectedBranch : undefined,
      designation: selectedDesignation !== 'all' ? selectedDesignation : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      employment_type: selectedEmploymentType !== 'all' ? selectedEmploymentType : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.employees.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      branch: selectedBranch !== 'all' ? selectedBranch : undefined,
      designation: selectedDesignation !== 'all' ? selectedDesignation : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      employment_type: selectedEmploymentType !== 'all' ? selectedEmploymentType : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view':
        router.get(route('hr.employees.show', item.employee?.id || item.id));
        break;
      case 'edit':
        router.get(route('hr.employees.edit', item.employee?.id || item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;
      case 'change-password':
        setIsPasswordModalOpen(true);
        break;
    }
  };
  
  const handleAddNew = () => {
    router.get(route('hr.employees.create'));
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting employee...');
    
    router.delete(route('hr.employees.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to delete employee: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleToggleStatus = (employee: any) => {
    const currentStatus = employee.status || 'inactive';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} employee...`);
    
    router.put(route('hr.employees.toggle-status', employee.employee?.id || employee.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to update employee status: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };

  const handlePasswordChange = (formData: any) => {
    toast.loading('Changing password...');
    
    router.put(route('hr.employees.change-password', currentItem.employee?.id || currentItem.id), formData, {
      onSuccess: (page) => {
        setIsPasswordModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to change password: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedBranch('all');
    setSelectedDesignation('all');
    setSelectedStatus('all');
    setSelectedEmploymentType('all');
    setShowFilters(false);
    
    router.get(route('hr.employees.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleEmploymentTypeChange = (employmentType: string) => {
    setSelectedEmploymentType(employmentType);
    router.get(route('hr.employees.index'), {
      page: 1,
      search: searchTerm || undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      branch: selectedBranch !== 'all' ? selectedBranch : undefined,
      designation: selectedDesignation !== 'all' ? selectedDesignation : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      employment_type: employmentType !== 'all' ? employmentType : undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleQuickFilterChange = (filter: 'branch' | 'department' | 'designation', value: string) => {
    if (filter === 'branch') setSelectedBranch(value);
    if (filter === 'department') setSelectedDepartment(value);
    if (filter === 'designation') setSelectedDesignation(value);

    router.get(route('hr.employees.index'), {
      page: 1,
      search: searchTerm || undefined,
      branch: (filter === 'branch' ? value : selectedBranch) !== 'all' ? (filter === 'branch' ? value : selectedBranch) : undefined,
      department: (filter === 'department' ? value : selectedDepartment) !== 'all' ? (filter === 'department' ? value : selectedDepartment) : undefined,
      designation: (filter === 'designation' ? value : selectedDesignation) !== 'all' ? (filter === 'designation' ? value : selectedDesignation) : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      employment_type: selectedEmploymentType !== 'all' ? selectedEmploymentType : undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions: import('@/components/page-template').PageAction[] = [];
  
  // Add the "Add New Employee" button if user has permission
  if (hasPermission(permissions, 'create-employees')) {
    const canCreate = !planLimits || planLimits.can_create;
    pageActions.push({
      label: planLimits && !canCreate ? `Employee Create Limit Reached (${planLimits.current_users}/${planLimits.max_users})` : 'Add Employee',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: canCreate ? 'default' as const : 'outline' as const,
      onClick: canCreate ? () => handleAddNew() : () => toast.error(`Employee limit exceeded. Your plan allows maximum ${planLimits.max_users} users. Please upgrade your plan.`),
      disabled: !canCreate
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.employees.index') },
    { title: 'Employees' }
  ];

  // Define table columns
  const columns = [
    { 
      key: 'name', 
      label: 'Employee Name',
      sortable: true,
      className: 'min-w-[300px]',
      render: (value: any, row: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-primary/10 text-primary">
              {row.avatar ? (
                <img src={getImagePath(row.avatar)} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(row.name)
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{row.name}</div>
              <div className="text-xs text-muted-foreground">{row.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'employee_id',
      label: 'Employee ID',
      sortable: true,
      className: 'min-w-[150px]',
      render: (_value: any, row: any) => (
        <button className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400" onClick={() => handleAction('view', row)}>
          {row.employee?.employee_id || '-'}
        </button>
      )
    },
    {
      key: 'branch',
      label: 'Branch',
      className: 'min-w-[150px]',
      render: (_value: any, row: any) => row.employee?.branch?.name ? (
        <span className="inline-flex rounded-md border bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">{row.employee.branch.name}</span>
      ) : '-'
    },
    { 
      key: 'department', 
      label: 'Department',
      className: 'min-w-[170px]',
      render: (value: any, row: any) => {
        return row.employee?.department?.name ? <span className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">{row.employee.department.name}</span> : '-';
      }
    },
    { 
      key: 'designation', 
      label: 'Designation',
      className: 'min-w-[150px]',
      render: (value: any, row: any) => {
        return row.employee?.designation?.name ? <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">{row.employee.designation.name}</span> : '-';
      }
    },
    {
      key: 'employment_type',
      label: 'Employment Type',
      className: 'min-w-[150px]',
      render: (_value: any, row: any) => {
        const type = row.employee?.employment_type;
        if (!type) return '-';
        const style = type === 'Full-time'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : type === 'Part-time'
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
        return <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${style}`}>{type.replace('-', ' ')}</span>;
      }
    },
    { 
      key: 'date_of_joining', 
      label: 'Date Of Joining',
      sortable: false,
      className: 'min-w-[150px]',
      render: (value: any, row: any) => {
        const joinDate = row.employee?.date_of_joining;
        return joinDate ? (
          <span className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <Calendar className="size-4" aria-hidden="true" />
            {window.appSettings?.formatDateTimeSimple(joinDate, false) || new Date(joinDate).toLocaleDateString()}
          </span>
        ) : '-';
      }
    }
  ];

  // Define table actions
  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-employees',
      animated: true
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-employees'
    },
    { 
      label: 'Change Password', 
      icon: 'Key', 
      action: 'change-password', 
      className: 'text-green-500',
      requiredPermission: 'edit-employees',
      animated: true
    },
    { 
      label: 'Toggle Status', 
      icon: 'Lock', 
      action: 'toggle-status', 
      className: 'text-amber-500',
      requiredPermission: 'edit-employees',
      animated: true
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-employees',
      animated: true
    }
  ];

  // Prepare filter options
  const branchOptions = [
    { value: 'all', label: 'All Branches' },
    ...(branches || []).map((branch: any) => ({
      value: branch.id.toString(),
      label: branch.name
    }))
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...(departments || []).map((department: any) => ({
      value: department.id.toString(),
      label: `${department.name} (${department.branch?.name || 'No Branch'})`
    }))
  ];

  const designationOptions = [
    { value: 'all', label: 'All Designations' },
    ...(designations || []).map((designation: any) => ({
      value: designation.id.toString(),
      label: `${designation.name} (${designation.department?.name || 'No Department'})`
    }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'probation', label: 'Probation' },
    { value: 'terminated', label: 'Terminated' }
  ];

  return (
    <PageTemplate 
      title={"Employees"} 
      description="View and manage employee profiles, branches, departments, and designations."
      url="/hr/employees"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-gray-900">
        <div className="p-6">
          <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'branch',
              label: 'Branch',
              type: 'select',
              value: selectedBranch,
              onChange: (value) => handleQuickFilterChange('branch', value),
              options: branchOptions,
              searchable: true,
              inline: true,
            },
            {
              name: 'department',
              label: 'Department',
              type: 'select',
              value: selectedDepartment,
              onChange: (value) => handleQuickFilterChange('department', value),
              options: departmentOptions,
              searchable: true,
              inline: true,
            },
            {
              name: 'designation',
              label: 'Designation',
              type: 'select',
              value: selectedDesignation,
              onChange: (value) => handleQuickFilterChange('designation', value),
              options: designationOptions,
              searchable: true,
              inline: true,
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: statusOptions
            }
          ]}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            router.get(route('hr.employees.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
              branch: selectedBranch !== 'all' ? selectedBranch : undefined,
              designation: selectedDesignation !== 'all' ? selectedDesignation : undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
              employment_type: selectedEmploymentType !== 'all' ? selectedEmploymentType : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
          showViewToggle={true}
          activeView={activeView}
          onViewChange={setActiveView}
          />
        </div>

        <div className="overflow-x-auto border-t bg-white px-5 dark:bg-gray-900">
          <div className="flex min-w-max items-center gap-1">
          {[
            { key: 'all', label: 'All', icon: LayoutGrid, count: stats.total ?? 0 },
            { key: 'Full-time', label: 'Full Time', icon: Briefcase, count: stats.full_time ?? 0 },
            { key: 'Part-time', label: 'Part Time', icon: Clock, count: stats.part_time ?? 0 },
            { key: 'Temporary', label: 'Temporary', icon: Calendar, count: stats.temporary ?? 0 },
            { key: 'Contract', label: 'Contract', icon: FileText, count: stats.contract ?? 0 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedEmploymentType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleEmploymentTypeChange(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
                <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums ${active ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Content section */}
      {activeView === 'list' ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-gray-900">
          <div className="max-h-[70vh] w-full max-w-full overflow-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400">
            <div className="min-w-[1100px]">
              <CrudTable
            columns={columns}
            actions={actions}
            data={employees?.data || []}
            from={employees?.from || 1}
            onAction={handleAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            onSort={handleSort}
            permissions={permissions}
            showRowNumber={false}
            entityPermissions={{
              view: 'view-employees',
              edit: 'edit-employees',
              delete: 'delete-employees'
            }}
            emptyState={
              <NoRecordsFound
                icon={Users}
                title="No Employees found"
                description="Get started by creating your first Employee."
                hasFilters={hasActiveFilters()}
                onClearFilters={handleResetFilters}
                createPermission="create-employees"
                onCreateClick={handleAddNew}
                createButtonText="Create Employee"
                className="h-auto py-12"
              />
            }
              />
            </div>
          </div>

          {/* Pagination section */}
          <Pagination
            from={employees?.from || 0}
            to={employees?.to || 0}
            total={employees?.total || 0}
            links={employees?.links}
            entityName={"employees"}
            onPageChange={(url) => router.get(url)}
          />
        </div>
      ) : (
        <div>
          {/* Grid View */}
          {(!employees?.data || employees.data.length === 0) ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
              <NoRecordsFound
                icon={Users}
                title="No Employees found"
                description="Get started by creating your first Employee."
                hasFilters={hasActiveFilters()}
                onClearFilters={handleResetFilters}
                createPermission="create-employees"
                onCreateClick={handleAddNew}
                createButtonText="Create Employee"
                className="h-auto py-12"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employees.data.map((employee: any) => (
              <Card key={employee.id} className="p-0 hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {employee.avatar ? (
                      <img src={getImagePath(employee.avatar)} alt={employee.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
                        {getInitials(employee.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{employee.employee?.employee_id || '-'}</h3>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 min-h-0">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-xs min-w-0">
                      <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide font-semibold">{"Employee Name"}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">{employee.name || '-'}</p>
                    </div>
                    <div className="text-xs min-w-0">
                      <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide font-semibold">{"Branch"}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">{employee.employee?.branch?.name || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-xs min-w-0">
                      <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide font-semibold">{"Department"}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">{employee.employee?.department?.name || '-'}</p>
                    </div>
                    <div className="text-xs min-w-0">
                      <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide font-semibold">{"Designation"}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">{employee.employee?.designation?.name || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-xs min-w-0">
                      <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide font-semibold">{"Employment Type"}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                        {employee.employee?.employment_type || '-'}
                      </p>
                    </div>
                    <div className="text-xs min-w-0">
                      <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide font-semibold">{"Date Of Joining"}</p>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                        {employee.employee?.date_of_joining 
                          ? (window.appSettings?.formatDateTimeSimple(employee.employee.date_of_joining, false) || new Date(employee.employee.date_of_joining).toLocaleDateString()) 
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-1 p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0 mt-auto">
                  {hasPermission(permissions, 'view-employees') && (
                    <AnimatedActionButton icon={EyeIcon} onClick={() => handleAction('view', employee)} className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" />
                  )}
                  {hasPermission(permissions, 'edit-employees') && (
                    <Button variant="ghost" size="sm" onClick={() => handleAction('edit', employee)} className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission(permissions, 'delete-employees') && (
                    <AnimatedActionButton icon={Trash2Icon} onClick={() => handleAction('delete', employee)} className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" />
                  )}
                  
                  {hasPermission(permissions, 'edit-employees') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 z-50">
                        <AnimatedActionMenuItem icon={KeyIcon} onClick={() => handleAction('change-password', employee)}>
                          <span>{"Change Password"}</span>
                        </AnimatedActionMenuItem>
                        <AnimatedActionMenuItem icon={employee.status === 'active' ? LockIcon : Unlock} onClick={() => handleAction('toggle-status', employee)}>
                          <span>{employee.status === 'active' ? "Deactivate" : "Activate"}</span>
                        </AnimatedActionMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {/* Pagination for grid view */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={employees?.from || 0}
              to={employees?.to || 0}
              total={employees?.total || 0}
              links={employees?.links}
              entityName={"employees"}
              onPageChange={(url) => router.get(url)}
            />
          </div>
          </>
          )}
        </div>
      )}

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="employee"
      />

      {/* Change Password Modal */}
      <CrudFormModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
        formConfig={{
          fields: [
            { 
              name: 'password', 
              label: 'New Password', 
              type: 'password', 
              required: true 
            },
            { 
              name: 'password_confirmation', 
              label: 'Confirm Password', 
              type: 'password', 
              required: true 
            }
          ],
          modalSize: 'md'
        }}
        initialData={{}}
        title={'Change Employee Password'}
        mode='edit'
      />
    </PageTemplate>
  );
}
