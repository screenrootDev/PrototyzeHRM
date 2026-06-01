// pages/hr/employees/index.tsx
import React, { useState, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Users, Edit, MoreHorizontal, Unlock } from 'lucide-react';
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
  
  const { auth, employees, branches, planLimits,departments, designations, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();
  
  // State
  const [activeView, setActiveView] = useState('list');
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedDepartment, setSelectedDepartment] = useState(pageFilters.department || 'all');
  const [selectedBranch, setSelectedBranch] = useState(pageFilters.branch || 'all');
  const [selectedDesignation, setSelectedDesignation] = useState(pageFilters.designation || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedDepartment !== 'all' || selectedBranch !== 'all' || selectedDesignation !== 'all' || selectedStatus !== 'all' || searchTerm !== '';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (selectedDepartment !== 'all' ? 1 : 0) + 
           (selectedBranch !== 'all' ? 1 : 0) + 
           (selectedDesignation !== 'all' ? 1 : 0) + 
           (selectedStatus !== 'all' ? 1 : 0) + 
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
    setShowFilters(false);
    
    router.get(route('hr.employees.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Add New Employee" button if user has permission
  if (hasPermission(permissions, 'create-employees')) {
    const canCreate = !planLimits || planLimits.can_create;
    pageActions.push({
      label: planLimits && !canCreate ? `Employee Create Limit Reached (${planLimits.current_users}/${planLimits.max_users})` : 'Add Employee',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: canCreate ? 'default' : 'outline',
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
      key: 'employee_id', 
      label: 'Employee ID',
      sortable: false,
      render: (value: any, row: any) => {
        const empId = row.employee?.employee_id || '-';
        if (empId === '-') return empId;
        return (
          <span 
            className="cursor-pointer font-medium text-primary hover:underline"
            onClick={() => handleAction('view', row)}
          >
            {empId}
          </span>
        );
      }
    },
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      render: (value: any, row: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white overflow-hidden">
              {row.avatar ? (
                <img src={getImagePath(row.avatar)} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(row.name)
              )}
            </div>
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.email}</div>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'department', 
      label: 'Department',
      render: (value: any, row: any) => {
        return row.employee?.department?.name || '-';
      }
    },
    { 
      key: 'designation', 
      label: 'Designation',
      render: (value: any, row: any) => {
        return row.employee?.designation?.name || '-';
      }
    },
    { 
      key: 'employee_status', 
      label: 'Employee Status',
      render: (value: any, row: any) => {
        const status = row.employee?.employee_status || 'active';
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            status === 'active' 
              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
              : status === 'inactive'
                ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                : status === 'probation'
                  ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                  : status === 'terminated'
                    ? 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                    : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
          }`}>
            {status === 'active' && 'Active'}
            {status === 'inactive' && 'Inactive'}
            {status === 'probation' && 'Probation'}
            {status === 'terminated' && 'Terminated'}
          </span>
        );
      }
    },
    { 
      key: 'date_of_joining', 
      label: 'Joined', 
      sortable: false,
      render: (value: any, row: any) => {
        const joinDate = row.employee?.date_of_joining;
        return joinDate ? (window.appSettings?.formatDateTimeSimple(joinDate, false) || new Date(joinDate).toLocaleDateString()) : '-';
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
      url="/hr/employees"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
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
              onChange: setSelectedBranch,
              options: branchOptions,
              searchable: true,
            },
            {
              name: 'department',
              label: 'Department',
              type: 'select',
              value: selectedDepartment,
              onChange: setSelectedDepartment,
              options: departmentOptions,
              searchable: true,
            },
            {
              name: 'designation',
              label: 'Designation',
              type: 'select',
              value: selectedDesignation,
              onChange: setSelectedDesignation,
              options: designationOptions,
              searchable: true,
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
              status: selectedStatus !== 'all' ? selectedStatus : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
          showViewToggle={true}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>

      {/* Content section */}
      {activeView === 'list' ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
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
            entityPermissions={{
              view: 'view-employees',
              create: 'create-employees',
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