// pages/hr/training/employee-trainings/index.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Plus, BarChart, Download, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import MediaPicker from '@/components/MediaPicker';

export default function EmployeeTrainings() {
  
  const { auth, employeeTrainings, employees, trainingPrograms, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedEmployee, setSelectedEmployee] = useState(pageFilters.employee_id || '');
  const [selectedProgram, setSelectedProgram] = useState(pageFilters.training_program_id || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || '');
  const [assignedDateFrom, setAssignedDateFrom] = useState(pageFilters.assigned_date_from || '');
  const [assignedDateTo, setAssignedDateTo] = useState(pageFilters.assigned_date_to || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedEmployee !== '' || 
           selectedProgram !== '' || 
           selectedStatus !== '' || 
           assignedDateFrom !== '' || 
           assignedDateTo !== '' || 
           searchTerm !== '';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (selectedEmployee !== '' ? 1 : 0) + 
           (selectedProgram !== '' ? 1 : 0) + 
           (selectedStatus !== '' ? 1 : 0) + 
           (assignedDateFrom !== '' ? 1 : 0) + 
           (assignedDateTo !== '' ? 1 : 0) + 
           (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const handleViewDashboard = () => {
    router.get(route('hr.employee-trainings.dashboard'));
  };
  
  const applyFilters = () => {
    router.get(route('hr.employee-trainings.index'), { 
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee || undefined,
      training_program_id: selectedProgram || undefined,
      status: selectedStatus || undefined,
      assigned_date_from: assignedDateFrom || undefined,
      assigned_date_to: assignedDateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.employee-trainings.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee || undefined,
      training_program_id: selectedProgram || undefined,
      status: selectedStatus || undefined,
      assigned_date_from: assignedDateFrom || undefined,
      assigned_date_to: assignedDateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view':
        router.get(route('hr.employee-trainings.show', item.id), {}, {
          onSuccess: (page) => {
            if (page.props.flash?.error) {
              toast.error(page.props.flash.error);            }
          },
          onError: (errors) => {
            if (typeof errors === 'string') {
              toast.error(errors);            } else if (errors.message) {
              toast.error(errors.message);            } else {
              toast.error('Failed to load training details');
            }
          }
        });
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'download-certification':
        window.open(route('hr.employee-trainings.download-certification', item.id), '_blank');
        break;
    }
  };
  
  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };
  
  const handleBulkAssign = () => {
    setIsBulkAssignModalOpen(true);
  };
  
  const handleFormSubmit = (formData: any) => {
    const data = formData;
    
    if (formMode === 'create') {
      toast.loading('Assigning training...');

      router.post(route('hr.employee-trainings.store'), data, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);          } else {
            toast.error(`Failed to assign training: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating training...');
      
      router.put(route('hr.employee-trainings.update', currentItem.id), data, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);          } else {
            toast.error(`Failed to update training: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleBulkAssignSubmit = (formData: any) => {
    toast.loading('Assigning training to employees...');

    router.post(route('hr.employee-trainings.bulk-assign'), formData, {
      onSuccess: (page) => {
        setIsBulkAssignModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to assign training: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting training assignment...');
    
    router.delete(route('hr.employee-trainings.destroy', currentItem.id), {
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
          toast.error(`Failed to delete training assignment: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmployee('');
    setSelectedProgram('');
    setSelectedStatus('');
    setAssignedDateFrom('');
    setAssignedDateTo('');
    setShowFilters(false);
    
    router.get(route('hr.employee-trainings.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Dashboard" button
  pageActions.push({
    label: 'Dashboard',
    icon: <BarChart className="h-4 w-4 mr-2" />,
    variant: 'outline' as const,
    onClick: handleViewDashboard
  });
  
  // Add the "Bulk Assign" button if user has permission
  if (hasPermission(permissions, 'create-employee-trainings')) {
    pageActions.push({
      label: 'Bulk Assign',
      icon: <UserPlus className="h-4 w-4 mr-2" />,
      variant: 'outline' as const,
      onClick: handleBulkAssign
    });
  }
  
  // Add the "Assign Training" button if user has permission
  if (hasPermission(permissions, 'create-employee-trainings')) {
    pageActions.push({
      label: 'Assign Training',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default' as const,
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.employee-trainings.index') },
    { title: 'Training Management', href: route('hr.employee-trainings.index') },
    { title: 'Employee Trainings' }
  ];

  // Define table columns
  const columns = [
    { 
      key: 'employee', 
      label: 'Employee',
      sortable: true,
      sortField: 'employee_name',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.employee?.name || '-'}</div>
          <div className="text-xs text-gray-500">{row.employee?.employee?.employee_id || '-'}</div>
        </div>
      )
    },
    { 
      key: 'program', 
      label: 'Training Program',
      sortable: true,
      sortField: 'program_name',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.training_program?.name || '-'}</div>
          <div className="text-xs text-gray-500">{row.training_program?.training_type?.name || '-'}</div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusClasses = {
          'assigned': 'bg-blue-50 text-blue-700 ring-blue-600/20',
          'in_progress': 'bg-amber-50 text-amber-700 ring-amber-600/20',
          'completed': 'bg-green-50 text-green-700 ring-green-600/20',
          'failed': 'bg-red-50 text-red-700 ring-red-600/20'
        };
        
        const statusLabels = {
          'assigned': 'Assigned',
          'in_progress': 'In Progress',
          'completed': 'Completed',
          'failed': 'Failed'
        };
        
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
            {statusLabels[value] || value}
          </span>
        );
      }
    },
    { 
      key: 'assigned_date', 
      label: 'Assigned Date',
      sortable: true,
      render: (value) => value ? (window.appSettings?.formatDateTimeSimple(value, false) || format(new Date(value), 'MMM dd, yyyy')) : '-'
    },
    { 
      key: 'completion_date', 
      label: 'Completion Date',
      sortable: true,
      render: (value) => value ? (window.appSettings?.formatDateTimeSimple(value, false) || format(new Date(value), 'MMM dd, yyyy')) : '-'
    },
    { 
      key: 'score', 
      label: 'Score',
      sortable: true,
      render: (value) => value !== null ? `${value}%` : '-'
    },
    { 
      key: 'is_passed', 
      label: 'Result',
      render: (value) => {
        if (value === null) return '-';
        
        return value ? (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {'Passed'}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {'Failed'}
          </Badge>
        );
      }
    },
    { 
      key: 'assessment_results_count', 
      label: 'Assessments',
      render: (value) => value || '0'
    },
    { 
      key: 'certification', 
      label: 'Certificate',
      render: (value, row) => value && value.trim() !== '' ? (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center text-blue-500"
          onClick={(e) => {
            e.stopPropagation();
            handleAction('download-certification', row);
          }}
        >
          <Download className="h-4 w-4 mr-1" />
          {'Download'}
        </Button>
      ) : '-'
    }
  ];

  // Define table actions
  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-employee-trainings'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-employee-trainings'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-employee-trainings'
    }
  ];

  // Prepare employee options for filter
  const employeeOptions = [
    { value: '', label: 'All Employees', disabled: true },
    ...(employees || []).map((employee: any) => ({
      value: employee.id.toString(),
      label: employee.name
    }))
  ];

  // Prepare training program options for filter
  const trainingProgramOptions = [
    { value: '', label: 'All Programs', disabled: true },
    ...(trainingPrograms || []).map((program: any) => ({
      value: program.id.toString(),
      label: program.name
    }))
  ];

  // Prepare status options for filter
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  return (
    <PageTemplate 
      title={"Employee Trainings"} 
      url="/hr/training/employee-trainings"
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
              name: 'employee_id',
              label: 'Employee',
              type: 'select',
              value: selectedEmployee,
              onChange: setSelectedEmployee,
              options: employeeOptions,
              searchable: true
            },
            {
              name: 'training_program_id',
              label: 'Training Program',
              type: 'select',
              value: selectedProgram,
              onChange: setSelectedProgram,
              options: trainingProgramOptions,
              searchable: true
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: statusOptions
            },
            {
              name: 'assigned_date_from',
              label: 'Assigned From',
              type: 'date',
              value: assignedDateFrom,
              onChange: setAssignedDateFrom
            },
            {
              name: 'assigned_date_to',
              label: 'Assigned To',
              type: 'date',
              value: assignedDateTo,
              onChange: setAssignedDateTo
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
            router.get(route('hr.employee-trainings.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              employee_id: selectedEmployee || undefined,
              training_program_id: selectedProgram || undefined,
              status: selectedStatus || undefined,
              assigned_date_from: assignedDateFrom || undefined,
              assigned_date_to: assignedDateTo || undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={employeeTrainings?.data || []}
          from={employeeTrainings?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-employee-trainings',
            create: 'create-employee-trainings',
            edit: 'edit-employee-trainings',
            delete: 'delete-employee-trainings'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={employeeTrainings?.from || 0}
          to={employeeTrainings?.to || 0}
          total={employeeTrainings?.total || 0}
          links={employeeTrainings?.links}
          entityName={"employee trainings"}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { 
              name: 'employee_id', 
              label: 'Employee', 
              type: 'select',
              required: true,
              options: employeeOptions.filter(opt => opt.value !== ''),
              searchable: true
            },
            { 
              name: 'training_program_id', 
              label: 'Training Program', 
              type: 'select',
              required: true,
              options: trainingProgramOptions.filter(opt => opt.value !== ''),
              searchable: true
            },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select',
              required: true,
              options: [
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' }
              ]
            },
            { 
              name: 'assigned_date', 
              label: 'Assigned Date', 
              type: 'date',
              required: true,
              defaultValue: new Date().toISOString().split('T')[0]
            },
            { 
              name: 'completion_date', 
              label: 'Completion Date', 
              type: 'date',
              showWhen: (formData) => ['completed', 'failed'].includes(formData.status)
            },
            { 
              name: 'certification', 
              label: 'Certification', 
              type: 'custom',
              render: (field, formData, handleChange) => (
                <MediaPicker
                  value={String(formData[field.name] || '')}
                  onChange={(url) => handleChange(field.name, url)}
                  placeholder={'Select certification file...'}
                />
              ),
              helpText: 'Upload certification file (max 5MB)',
              showWhen: (formData) => formData.status === 'completed'
            },
            { 
              name: 'score', 
              label: 'Score (%)', 
              type: 'number',
              min: 0,
              max: 100,
              step: 0.01,
              showWhen: (formData) => ['completed', 'failed'].includes(formData.status)
            },
            { 
              name: 'is_passed', 
              label: 'Passed', 
              type: 'checkbox',
              showWhen: (formData) => ['completed', 'failed'].includes(formData.status)
            },
            { 
              name: 'feedback', 
              label: 'Feedback', 
              type: 'textarea',
              showWhen: (formData) => ['completed', 'failed'].includes(formData.status)
            },
            { 
              name: 'notes', 
              label: 'Notes', 
              type: 'textarea'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Assign Training'
            : formMode === 'edit'
              ? 'Edit Training Assignment'
              : 'View Training Assignment'
        }
        mode={formMode}
      />

      {/* Bulk Assign Modal */}
      <CrudFormModal
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        onSubmit={handleBulkAssignSubmit}
        formConfig={{
          fields: [
            { 
              name: 'employee_ids', 
              label: 'Employees', 
              type: 'multi-select',
              required: true,
              options: employeeOptions.filter(opt => opt.value !== '')
            },
            { 
              name: 'training_program_id', 
              label: 'Training Program', 
              type: 'select',
              required: true,
              options: trainingProgramOptions.filter(opt => opt.value !== '')
            },
            { 
              name: 'assigned_date', 
              label: 'Assigned Date', 
              type: 'date',
              required: true,
              defaultValue: new Date().toISOString().split('T')[0]
            },
            { 
              name: 'notes', 
              label: 'Notes', 
              type: 'textarea'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={{}}
        title={'Bulk Assign Training'}
        mode="create"
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`${currentItem?.employee?.name || ''} - ${currentItem?.training_program?.name || ''}`}
        entityName="training assignment"
      />
    </PageTemplate>
  );
}