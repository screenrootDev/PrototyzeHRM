// pages/hr/attendance-regularizations/index.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function AttendanceRegularizations() {
  
  const { auth, regularizations, employees, attendanceRecords, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedEmployee, setSelectedEmployee] = useState(pageFilters.employee_id || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [dateFrom, setDateFrom] = useState(pageFilters.date_from || '');
  const [dateTo, setDateTo] = useState(pageFilters.date_to || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedEmployee !== 'all' || selectedStatus !== 'all' || dateFrom !== '' || dateTo !== '';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedEmployee !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('hr.attendance-regularizations.index'), {
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('hr.attendance-regularizations.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        setFormMode('view');
        setIsFormModalOpen(true);
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'approve':
        handleStatusUpdate(item, 'approved');
        break;
      case 'reject':
        handleStatusUpdate(item, 'rejected');
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading('Creating regularization request...');

      router.post(route('hr.attendance-regularizations.store'), formData, {
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
            toast.error(errors);
          } else {
            toast.error(`Failed to create regularization request: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating regularization request...');

      router.put(route('hr.attendance-regularizations.update', currentItem.id), formData, {
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
            toast.error(errors);
          } else {
            toast.error(`Failed to update regularization request: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading('Deleting regularization request...');

    router.delete(route('hr.attendance-regularizations.destroy', currentItem.id), {
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
          toast.error(errors);
        } else {
          toast.error(`Failed to delete regularization request: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleStatusUpdate = (regularization: any, status: string) => {
    const statusText = status === 'approved' ? 'Approving' : 'Rejecting';
    toast.loading(`${statusText} regularization request...`);

    router.put(route('hr.attendance-regularizations.update-status', regularization.id), {
      status,
      manager_comments: status === 'approved' ? 'Approved' : 'Rejected'
    }, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(`Failed to update regularization request status: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmployee('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);

    router.get(route('hr.attendance-regularizations.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];

  // Add the "Add New Request" button if user has permission
  if (hasPermission(permissions, 'create-attendance-regularizations')) {
    pageActions.push({
      label: 'Add Request',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Shift Management', href: route('hr.attendance-regularizations.index') },
    { title: 'Attendance Regularizations' }
  ];

  // Define table columns
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: any, row: any) => row.employee?.name || '-'
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    },
    {
      key: 'original_times',
      label: 'Original Times',
      render: (value: any, row: any) => (
        <div className="text-sm">
          <div className="text-red-600">In: {window.appSettings.formatTime(row.original_clock_in )|| '-'}</div>
          <div className="text-red-600">Out: {window.appSettings.formatTime(row.original_clock_out) || '-'}</div>
        </div>
      )
    },
    {
      key: 'requested_times',
      label: 'Requested Times',
      render: (value: any, row: any) => (
        <div className="text-sm">
          <div className="text-green-600">In: {window.appSettings.formatTime(row.requested_clock_in) || '-'}</div>
          <div className="text-green-600">Out: {window.appSettings.formatTime(row.requested_clock_out) || '-'}</div>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const statusColors = {
          pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
          approved: 'bg-green-50 text-green-700 ring-green-600/20',
          rejected: 'bg-red-50 text-red-700 ring-red-600/20'
        };
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[value as keyof typeof statusColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Requested On',
      sortable: true,
      render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  // Define table actions
  const actions = [
    {
      label: 'View',
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-attendance-regularizations'
    },
    {
      label: 'Edit',
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-attendance-regularizations',
      condition: (item: any) => item.status === 'pending'
    },
    {
      label: 'Approve',
      icon: 'CheckCircle',
      action: 'approve',
      className: 'text-green-500',
      requiredPermission: 'approve-attendance-regularizations',
      condition: (item: any) => item.status === 'pending'
    },
    {
      label: 'Reject',
      icon: 'XCircle',
      action: 'reject',
      className: 'text-red-500',
      requiredPermission: 'reject-attendance-regularizations',
      condition: (item: any) => item.status === 'pending'
    },
    {
      label: 'Delete',
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-attendance-regularizations',
      condition: (item: any) => item.status === 'pending'
    }
  ];

  // Prepare options for filters and forms
  const employeeOptions = [
    { value: 'all', label: 'All Employees' , disabled : true},
    ...(employees || []).map((emp: any) => ({
      value: emp.id.toString(),
      label: emp.name
    }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' , disabled : true},
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const attendanceRecordOptions = (attendanceRecords || []).map((record: any) => ({
    value: record.id.toString(),
    label: `${record.employee?.name} - ${new Date(record.date).toLocaleDateString()}`
  }));

  return (
    <PageTemplate
      title={"Attendance Regularizations"}
      url="/hr/attendance-regularizations"
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
              searchable : true
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
              name: 'date_from',
              label: 'Date From',
              type: 'date',
              value: dateFrom,
              onChange: setDateFrom
            },
            {
              name: 'date_to',
              label: 'Date To',
              type: 'date',
              value: dateTo,
              onChange: setDateTo
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
            router.get(route('hr.attendance-regularizations.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
              employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={regularizations?.data || []}
          from={regularizations?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-attendance-regularizations',
            create: 'create-attendance-regularizations',
            edit: 'edit-attendance-regularizations',
            delete: 'delete-attendance-regularizations'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={regularizations?.from || 0}
          to={regularizations?.to || 0}
          total={regularizations?.total || 0}
          links={regularizations?.links}
          entityName={"regularization requests"}
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
            // {
            //   name: 'employee_id',
            //   label: 'Employee',
            //   type: 'select',
            //   required: true,
            //   options: employees ? employees.map((emp: any) => ({
            //     value: emp.id.toString(),
            //     label: emp.name
            //   })) : []
            // },
            // {
            //   name: 'attendance_record_id',
            //   label: 'Attendance Record',
            //   type: 'select',
            //   required: true,
            //   options: attendanceRecordOptions
            // },
            {
              name: 'employee_id',
              type: 'dependent-dropdown',
              
              dependentConfig: [
                {
                  name: 'employee_id',
                  label: 'Employee',
                  required: true,
                  searchable: true,
                  options: employees ? employees.map((emp: any) => ({
                    value: emp.id.toString(),
                    label: emp.name
                  })) : []
                },
                {
                  name: 'attendance_record_id',
                  label: 'Attendance Record',
                  apiEndpoint: '/hr/attendance-regularizations/get-employee-attendance/{employee_id}',
                  showCurrentValue: true,
                  searchable: true
                }
              ]
            },
            { name: 'requested_clock_in', label: 'Requested Clock In', type: 'time' },
            { name: 'requested_clock_out', label: 'Requested Clock Out', type: 'time' },
            { name: 'reason', label: 'Reason', type: 'textarea', required: true }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Regularization Request'
            : formMode === 'edit'
              ? 'Edit Regularization Request'
              : 'View Regularization Request'
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`${currentItem?.employee?.name} ` || ''}
        entityName="regularization request"
      />
    </PageTemplate>
  );
}