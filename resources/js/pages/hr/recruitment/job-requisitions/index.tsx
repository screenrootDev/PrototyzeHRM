import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function JobRequisitions() {
  
  const { auth, jobRequisitions, jobCategories, departments, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || '_empty_');
  const [priorityFilter, setPriorityFilter] = useState(pageFilters.priority || '_empty_');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const hasActiveFilters = () => {
    return statusFilter !== '_empty_' || priorityFilter !== '_empty_' || searchTerm !== '';
  };
  
  const activeFilterCount = () => {
    return (statusFilter !== '_empty_' ? 1 : 0) + (priorityFilter !== '_empty_' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.recruitment.job-requisitions.index'), { 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      priority: priorityFilter !== '_empty_' ? priorityFilter : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.recruitment.job-requisitions.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      priority: priorityFilter !== '_empty_' ? priorityFilter : undefined,
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
        router.put(route('hr.recruitment.job-requisitions.update-status', item.id), { status: 'Approved' }, {
          onSuccess: (page) => {
            if (page.props.flash.success) {
              toast.success(page.props.flash.success);            } else if (page.props.flash.error) {
              toast.error(page.props.flash.error);            }
          },
          onError: (errors) => {
            if (typeof errors === 'string') {
              toast.error(errors);            } else {
              toast.error(`Failed to approve job requisition: ${Object.values(errors).join(', ')}`);            }
          }
        });
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
      router.post(route('hr.recruitment.job-requisitions.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          if (typeof errors === 'string') {
            toast.error(errors);          } else {
            toast.error(`Failed to create job requisition: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      router.put(route('hr.recruitment.job-requisitions.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          if (typeof errors === 'string') {
            toast.error(errors);          } else {
            toast.error(`Failed to update job requisition: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    router.delete(route('hr.recruitment.job-requisitions.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to delete job requisition: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('_empty_');
    setPriorityFilter('_empty_');
    setShowFilters(false);
    
    router.get(route('hr.recruitment.job-requisitions.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const pageActions = [];
  
  if (hasPermission(permissions, 'create-job-requisitions')) {
    pageActions.push({
      label: 'Add Job Requisition',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Recruitment', href: route('hr.recruitment.job-requisitions.index') },
    { title: 'Job Requisitions' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      case 'Pending Approval': return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'Approved': return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'On Hold': return 'bg-red-50 text-red-700 ring-red-600/10';
      case 'Closed': return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      default: return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-700 ring-red-600/10';
      case 'Medium': return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'Low': return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      default: return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    }
  };

  const columns = [
    { 
      key: 'requisition_code', 
      label: 'Code', 
      sortable: true,
      render: (value) => <div className="font-mono text-sm">{value}</div>
    },
    { 
      key: 'title', 
      label: 'Title', 
      sortable: true,
      render: (value) => <div className="font-medium">{value}</div>
    },
    { 
      key: 'job_category.name', 
      label: 'Category',
      render: (_, row) => row.job_category?.name || '-'
    },
    { 
      key: 'department.name', 
      label: 'Department',
      render: (_, row) => row.department ? `${row.department.name} (${row.department.branch?.name || 'No Branch'})` : '-'
    },
    { 
      key: 'positions_count', 
      label: 'Positions',
      render: (value) => value || 1
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'priority', 
      label: 'Priority',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getPriorityColor(value)}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created At',
      sortable: true,
      render: (value) =>window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-job-requisitions'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-job-requisitions'
    },
    { 
      label: 'Approve', 
      icon: 'CheckCircle', 
      action: 'approve', 
      className: 'text-green-500',
      requiredPermission: 'approve-job-requisitions',
      condition: (item) => item.status !== 'Approved'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-job-requisitions'
    }
  ];

  const statusOptions = [
    { value: '_empty_', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Pending Approval', label: 'Pending Approval' },
    { value: 'Approved', label: 'Approved' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Closed', label: 'Closed' }
  ];

  const priorityOptions = [
    { value: '_empty_', label: 'All Priorities' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  const jobCategoryOptions = [
    { value: '_empty_', label: 'Select Category' },
    ...(jobCategories || []).map((cat: any) => ({
      value: cat.id.toString(),
      label: cat.name
    }))
  ];

  const departmentOptions = [
    { value: '_empty_', label: 'Select Department' },
    ...(departments || []).map((dept: any) => ({
      value: dept.id.toString(),
      label: `${dept.name} (${dept.branch?.name || 'No Branch'})`
    }))
  ];

  return (
    <PageTemplate 
      title={"Job Requisitions"} 
      url="/hr/recruitment/job-requisitions"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions
            },
            {
              name: 'priority',
              label: 'Priority',
              type: 'select',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: priorityOptions
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
            router.get(route('hr.recruitment.job-requisitions.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              status: statusFilter !== '_empty_' ? statusFilter : undefined,
              priority: priorityFilter !== '_empty_' ? priorityFilter : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={jobRequisitions?.data || []}
          from={jobRequisitions?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-job-requisitions',
            create: 'create-job-requisitions',
            edit: 'edit-job-requisitions',
            delete: 'delete-job-requisitions'
          }}
        />

        <Pagination
          from={jobRequisitions?.from || 0}
          to={jobRequisitions?.to || 0}
          total={jobRequisitions?.total || 0}
          links={jobRequisitions?.links}
          entityName={"job requisitions"}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { 
              name: 'title', 
              label: 'Title', 
              type: 'text', 
              required: true 
            },
            { 
              name: 'job_category_id', 
              label: 'Job Category', 
              type: 'select', 
              required: true,
              options: jobCategoryOptions.filter(opt => opt.value !== '_empty_'),
              searchable : true,
            },
            { 
              name: 'department_id', 
              label: 'Department', 
              type: 'select',
              options: departmentOptions.filter(opt => opt.value !== '_empty_'),
              searchable : true,
            },
            { 
              name: 'positions_count', 
              label: 'Positions', 
              type: 'number', 
              required: true,
              min: 1
            },
            { 
              name: 'budget_min', 
              label: 'Min Budget', 
              type: 'number',
              min: 0,
              step: 0.01
            },
            { 
              name: 'budget_max', 
              label: 'Max Budget', 
              type: 'number',
              min: 0,
              step: 0.01
            },
            { 
              name: 'priority', 
              label: 'Priority', 
              type: 'select', 
              required: true,
              options: priorityOptions.filter(opt => opt.value !== '_empty_')
            },
            { 
              name: 'skills_required', 
              label: 'Skills Required', 
              type: 'textarea' 
            },
            { 
              name: 'education_required', 
              label: 'Education Required', 
              type: 'textarea' 
            },
            { 
              name: 'experience_required', 
              label: 'Experience Required', 
              type: 'textarea' 
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea' 
            },
            { 
              name: 'responsibilities', 
              label: 'Responsibilities', 
              type: 'textarea' 
            }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Job Requisition'
            : formMode === 'edit'
              ? 'Edit Job Requisition'
              : 'View Job Requisition'
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.title || ''}
        entityName="job requisition"
      />
    </PageTemplate>
  );
}