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

export default function CandidateSources() {
  
  const { auth, candidateSources, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || '_empty_');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const hasActiveFilters = () => {
    return statusFilter !== '_empty_' || searchTerm !== '';
  };
  
  const activeFilterCount = () => {
    return (statusFilter !== '_empty_' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.recruitment.candidate-sources.index'), { 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.recruitment.candidate-sources.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
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
      case 'toggle-status':
        handleToggleStatus(item);
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
      toast.loading('Creating candidate source...');

      router.post(route('hr.recruitment.candidate-sources.store'), formData, {
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
            toast.error(`Failed to create candidate source: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating candidate source...');

      router.put(route('hr.recruitment.candidate-sources.update', currentItem.id), formData, {
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
            toast.error(`Failed to update candidate source: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting candidate source...');

    router.delete(route('hr.recruitment.candidate-sources.destroy', currentItem.id), {
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
          toast.error(`Failed to delete candidate source: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleToggleStatus = (candidateSource: any) => {
    const newStatus = candidateSource.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} candidate source...`);

    router.put(route('hr.recruitment.candidate-sources.toggle-status', candidateSource.id), {}, {
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
          toast.error(`Failed to update candidate source status: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('_empty_');
    setShowFilters(false);
    
    router.get(route('hr.recruitment.candidate-sources.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const pageActions = [];
  
  if (hasPermission(permissions, 'create-candidate-sources')) {
    pageActions.push({
      label: 'Add Candidate Source',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Recruitment', href: route('hr.recruitment.candidate-sources.index') },
    { title: 'Candidate Sources' }
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      render: (value) => <div className="font-medium">{value}</div>
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (value) => value || '-'
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
          value === 'active' 
            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
        }`}>
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created At',
      sortable: true,
      render: (value) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-candidate-sources'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-candidate-sources'
    },
    { 
      label: 'Toggle Status', 
      icon: 'Lock', 
      action: 'toggle-status', 
      className: 'text-amber-500',
      requiredPermission: 'edit-candidate-sources'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-candidate-sources'
    }
  ];

  const statusOptions = [
    { value: '_empty_', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return (
    <PageTemplate 
      title={"Candidate Sources"} 
      url="/hr/recruitment/candidate-sources"
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
            router.get(route('hr.recruitment.candidate-sources.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              status: statusFilter !== '_empty_' ? statusFilter : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={candidateSources?.data || []}
          from={candidateSources?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-candidate-sources',
            create: 'create-candidate-sources',
            edit: 'edit-candidate-sources',
            delete: 'delete-candidate-sources'
          }}
        />

        <Pagination
          from={candidateSources?.from || 0}
          to={candidateSources?.to || 0}
          total={candidateSources?.total || 0}
          links={candidateSources?.links}
          entityName={"candidate sources"}
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
              name: 'name', 
              label: 'Name', 
              type: 'text', 
              required: true 
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea' 
            },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select', 
              required: true,
              options: statusOptions.filter(opt => opt.value !== '_empty_')
            }
          ]
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Candidate Source'
            : formMode === 'edit'
              ? 'Edit Candidate Source'
              : 'View Candidate Source'
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="candidate source"
      />
    </PageTemplate>
  );
}