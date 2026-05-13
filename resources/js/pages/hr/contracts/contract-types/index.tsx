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
import { Plus, FileText, Calendar, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function ContractTypes() {
  
  const { auth, contractTypes, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || '_empty_');
  const [renewableFilter, setRenewableFilter] = useState(pageFilters.is_renewable || '_empty_');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const hasActiveFilters = () => {
    return statusFilter !== '_empty_' || renewableFilter !== '_empty_' || searchTerm !== '';
  };
  
  const activeFilterCount = () => {
    return (statusFilter !== '_empty_' ? 1 : 0) + (renewableFilter !== '_empty_' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.contracts.contract-types.index'), { 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      is_renewable: renewableFilter !== '_empty_' ? renewableFilter : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.contracts.contract-types.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      is_renewable: renewableFilter !== '_empty_' ? renewableFilter : undefined,
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
      toast.loading('Creating contract type...');

      router.post(route('hr.contracts.contract-types.store'), formData, {
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
            toast.error(`Failed to create contract type: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating contract type...');

      router.put(route('hr.contracts.contract-types.update', currentItem.id), formData, {
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
            toast.error(`Failed to update contract type: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting contract type...');

    router.delete(route('hr.contracts.contract-types.destroy', currentItem.id), {
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
          toast.error(`Failed to delete contract type: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };
  
  const handleToggleStatus = (item: any) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} contract type...`);

    router.put(route('hr.contracts.contract-types.toggle-status', item.id), {}, {
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
          toast.error(`Failed to update contract type status: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('_empty_');
    setRenewableFilter('_empty_');
    setShowFilters(false);
    
    router.get(route('hr.contracts.contract-types.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const pageActions = [];
  
  if (hasPermission(permissions, 'create-contract-types')) {
    pageActions.push({
      label: 'Add Contract Type',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Contract Management', href: route('hr.contracts.contract-types.index') },
    { title: 'Contract Types' }
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Contract Type', 
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">
              {row.description ? 
                (row.description.split(' ').length > 20 ? 
                  row.description.split(' ').slice(0, 10).join(' ') + '...' : 
                  row.description
                ) : '-'
              }
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'default_duration_months', 
      label: 'Duration',
      render: (value) => {
        if (!value) {
          return (
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {'Permanent'}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{value} {'months'}</span>
          </div>
        );
      }
    },
    { 
      key: 'probation_period_months', 
      label: 'Probation',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{value} {'months'}</span>
        </div>
      )
    },
    { 
      key: 'notice_period_days', 
      label: 'Notice Period',
      render: (value) => (
        <span>{value} {'days'}</span>
      )
    },
    { 
      key: 'is_renewable', 
      label: 'Renewable',
      render: (value) => (
        <div className="flex items-center gap-1">
          {value ? (
            <>
              <RefreshCw className="h-4 w-4 text-green-500" />
              <span className="text-green-700">{'Yes'}</span>
            </>
          ) : (
            <span className="text-gray-500">{'No'}</span>
          )}
        </div>
      )
    },
    { 
      key: 'contracts_count', 
      label: 'Contracts',
      render: (value) => (
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
          {value || 0} {'contracts'}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
          value === 'active' 
            ? 'bg-green-50 text-green-700 ring-green-600/20' 
            : 'bg-red-50 text-red-700 ring-red-600/20'
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
      requiredPermission: 'view-contract-types'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-contract-types'
    },
    { 
      label: 'Toggle Status', 
      icon: 'Lock', 
      action: 'toggle-status', 
      className: 'text-amber-500',
      requiredPermission: 'edit-contract-types'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-contract-types'
    }
  ];

  const statusOptions = [
    { value: '_empty_', label: 'All Statuses' , disabled : true},
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const renewableOptions = [
    { value: '_empty_', label: 'All', disabled : true },
    { value: 'true', label: 'Renewable' },
    { value: 'false', label: 'Non-renewable' }
  ];

  return (
    <PageTemplate 
      title={"Contract Types"} 
      url="/hr/contracts/contract-types"
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
              name: 'is_renewable',
              label: 'Renewable',
              type: 'select',
              value: renewableFilter,
              onChange: setRenewableFilter,
              options: renewableOptions
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
            router.get(route('hr.contracts.contract-types.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              status: statusFilter !== '_empty_' ? statusFilter : undefined,
              is_renewable: renewableFilter !== '_empty_' ? renewableFilter : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={contractTypes?.data || []}
          from={contractTypes?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-contract-types',
            create: 'create-contract-types',
            edit: 'edit-contract-types',
            delete: 'delete-contract-types'
          }}
        />

        <Pagination
          from={contractTypes?.from || 0}
          to={contractTypes?.to || 0}
          total={contractTypes?.total || 0}
          links={contractTypes?.links}
          entityName={"contract types"}
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
              label: 'Contract Type Name', 
              type: 'text', 
              required: true 
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea',
              rows: 3
            },
            { 
              name: 'default_duration_months', 
              label: 'Default Duration (months)', 
              type: 'number',
              min: 1,
              max: 120,
              helpText: 'Leave empty for permanent contracts'
            },
            { 
              name: 'probation_period_months', 
              label: 'Probation Period (months)', 
              type: 'number', 
              required: true,
              min: 0,
              max: 12
            },
            { 
              name: 'notice_period_days', 
              label: 'Notice Period (days)', 
              type: 'number', 
              required: true,
              min: 0,
              max: 365
            },
            { 
              name: 'is_renewable', 
              label: 'Is Renewable', 
              type: 'checkbox',
              helpText: 'Can this contract type be renewed?'
            },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select', 
              required: true,
              options: statusOptions.filter(opt => opt.value !== '_empty_')
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Contract Type'
            : formMode === 'edit'
              ? 'Edit Contract Type'
              : 'View Contract Type'
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="contract type"
      />
    </PageTemplate>
  );
}