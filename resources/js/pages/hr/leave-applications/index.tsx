// pages/hr/leave-applications/index.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaveTimeline } from '@/components/leave-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeaveApplications() {
  
  const { auth, leaveApplications, employees, leaveTypes, timelineLeaves, timelineMonth, timelineYear, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedEmployee, setSelectedEmployee] = useState(pageFilters.employee_id || 'all');
  const [selectedLeaveType, setSelectedLeaveType] = useState(pageFilters.leave_type_id || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedEmployee !== 'all' || selectedLeaveType !== 'all' || selectedStatus !== 'all';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedEmployee !== 'all' ? 1 : 0) + (selectedLeaveType !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('hr.leave-applications.index'), {
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      leave_type_id: selectedLeaveType !== 'all' ? selectedLeaveType : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      per_page: pageFilters.per_page,
      timeline_month: timelineMonth,
      timeline_year: timelineYear
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('hr.leave-applications.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      leave_type_id: selectedLeaveType !== 'all' ? selectedLeaveType : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      per_page: pageFilters.per_page,
      timeline_month: timelineMonth,
      timeline_year: timelineYear
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
      toast.loading('Creating leave application...');

      router.post(route('hr.leave-applications.store'), formData, {
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
            toast.error(`Failed to create leave application: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating leave application...');

      router.put(route('hr.leave-applications.update', currentItem.id), formData, {
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
            toast.error(`Failed to update leave application: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading('Deleting leave application...');

    router.delete(route('hr.leave-applications.destroy', currentItem.id), {
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
          toast.error(`Failed to delete leave application: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleStatusUpdate = (application: any, status: string) => {
    const statusText = status === 'approved' ? 'Approving' : 'Rejecting';
    toast.loading(`${statusText} leave application...`);

    router.put(route('hr.leave-applications.update-status', application.id), { 
      status,
      manager_comments: '' // Add empty manager_comments to avoid undefined key error
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
          toast.error(`Failed to update leave application status: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmployee('all');
    setSelectedLeaveType('all');
    setSelectedStatus('all');
    setShowFilters(false);

    router.get(route('hr.leave-applications.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];

  // Add the "Add New Leave Application" button if user has permission
  if (hasPermission(permissions, 'create-leave-applications')) {
    pageActions.push({
      label: 'Add Leave Application',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Leave Management', href: route('hr.leave-applications.index') },
    { title: 'Leave Applications' }
  ];

  // Define table columns
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: any, row: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {row.employee?.avatar ? <AvatarImage src={(window as any).storage ? (window as any).storage(row.employee.avatar) : row.employee.avatar} /> : null}
            <AvatarFallback>{row.employee?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{row.employee?.name || '-'}</span>
            <span className="text-xs text-muted-foreground">{row.employee?.email || row.employee?.employee_id || 'Employee'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (value: any, row: any) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: row.leave_type?.color }}
          />
          <span>{row.leave_type?.name || '-'}</span>
        </div>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      // render: (value: string) => new Date(value).toLocaleDateString()
      render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
      
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      // render: (value: string) => new Date(value).toLocaleDateString()
      render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    },
    {
      key: 'total_days',
      label: 'Days',
      render: (value: number) => (
        <span className="font-mono">{value}</span>
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
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColors[value as keyof typeof statusColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Applied On',
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
      requiredPermission: 'view-leave-applications'
    },
    {
      label: 'Edit',
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-leave-applications',
      condition: (item: any) => item.status === 'pending'
    },
    {
      label: 'Approve',
      icon: 'CheckCircle',
      action: 'approve',
      className: 'text-green-500',
      requiredPermission: 'approve-leave-applications',
      condition: (item: any) => item.status === 'pending'
    },
    {
      label: 'Reject',
      icon: 'XCircle',
      action: 'reject',
      className: 'text-red-500',
      requiredPermission: 'reject-leave-applications',
      condition: (item: any) => item.status === 'pending'
    },
    {
      label: 'Delete',
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-leave-applications'
    }
  ];

  // Prepare options for filters and forms
  const employeeOptions = [
    { value: 'all', label: 'All Employees' , disabled: true },
    ...(employees || []).map((emp: any) => ({
      value: emp.id.toString(),
      label: emp.name
    }))
  ];

  const leaveTypeOptions = [
    { value: 'all', label: 'All Leave Types' , disabled: true },
    ...(leaveTypes || []).map((type: any) => ({
      value: type.id.toString(),
      label: type.name
    }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses', disabled: true },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const handleTabChange = (value: string) => {
    setSelectedStatus(value);
    router.get(route('hr.leave-applications.index'), {
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      leave_type_id: selectedLeaveType !== 'all' ? selectedLeaveType : undefined,
      status: value !== 'all' ? value : undefined,
      per_page: pageFilters.per_page,
      timeline_month: timelineMonth,
      timeline_year: timelineYear
    }, { preserveState: true, preserveScroll: true });
  };

  return (
    <PageTemplate
      title={"Leave Applications"}
      url="/hr/leave-applications"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="flex flex-col gap-6">
        <LeaveTimeline 
          leaves={timelineLeaves || []} 
          currentMonth={timelineMonth || new Date().getMonth() + 1}
          currentYear={timelineYear || new Date().getFullYear()}
          leaveTypes={leaveTypes || []}
          employees={employees || []}
        />

        <Tabs defaultValue={selectedStatus === 'all' ? 'pending' : selectedStatus} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Leaves</TabsTrigger>
              <TabsTrigger value="approved">Approved Leaves</TabsTrigger>
              <TabsTrigger value="rejected">Rejected Leaves</TabsTrigger>
              <TabsTrigger value="all">All Leaves</TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4 border">
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
                  name: 'leave_type_id',
                  label: 'Leave Type',
                  type: 'select',
                  value: selectedLeaveType,
                  onChange: setSelectedLeaveType,
                  options: leaveTypeOptions,
                  searchable: true
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
                router.get(route('hr.leave-applications.index'), {
                  page: 1,
                  per_page: parseInt(value),
                  search: searchTerm || undefined,
                  employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
                  leave_type_id: selectedLeaveType !== 'all' ? selectedLeaveType : undefined,
                  status: selectedStatus !== 'all' ? selectedStatus : undefined,
                  timeline_month: timelineMonth,
                  timeline_year: timelineYear
                }, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border">
            <CrudTable
              columns={columns}
              actions={actions}
              data={leaveApplications?.data || []}
              from={leaveApplications?.from || 1}
              onAction={handleAction}
              sortField={pageFilters.sort_field}
              sortDirection={pageFilters.sort_direction}
              onSort={handleSort}
              permissions={permissions}
              entityPermissions={{
                view: 'view-leave-applications',
                create: 'create-leave-applications',
                edit: 'edit-leave-applications',
                delete: 'delete-leave-applications'
              }}
            />

            <Pagination
              from={leaveApplications?.from || 0}
              to={leaveApplications?.to || 0}
              total={leaveApplications?.total || 0}
              links={leaveApplications?.links}
              entityName={"leave applications"}
              onPageChange={(url) => router.get(url)}
            />
          </div>
        </Tabs>
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
              searchable : true,
              options: employees ? employees.map((emp: any) => ({
                value: emp.id.toString(),
                label: emp.name
              })) : []
            },
            {
              name: 'leave_type_id',
              label: 'Leave Type',
              type: 'select',
              required: true,
              searchable : true,
              options: leaveTypes ? leaveTypes.map((type: any) => ({
                value: type.id.toString(),
                label: type.name
              })) : []
            },
            { name: 'start_date', label: 'Start Date', type: 'date', required: true },
            { name: 'end_date', label: 'End Date', type: 'date', required: true },
            { name: 'reason', label: 'Reason', type: 'textarea', required: true },
            { 
              name: 'attachment', 
              label: 'Attachment', 
              type: 'custom',
              render: (field, formData, handleChange) => (
                <div>
                  <MediaPicker
                    value={String(formData[field.name] || '')}
                    onChange={(url) => handleChange(field.name, url)}
                    placeholder={'Select attachment file...'}
                  />
                </div>
              ),
              helpText: 'Upload PDF, DOC, DOCX, JPG, JPEG, PNG files'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem ? {
          ...currentItem,
          start_date: currentItem.start_date ? window.appSettings.formatDateTimeSimple(currentItem.start_date, false) : currentItem.start_date,
          end_date: currentItem.end_date ? window.appSettings.formatDateTimeSimple(currentItem.end_date, false) : currentItem.end_date
        } : null}
        title={
          formMode === 'create'
            ? 'Add New Leave Application'
            : formMode === 'edit'
              ? 'Edit Leave Application'
              : 'View Leave Application'
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`${currentItem?.employee?.name} - ${currentItem?.leave_type?.name}` || ''}
        entityName="leave application"
      />
    </PageTemplate>
  );
}