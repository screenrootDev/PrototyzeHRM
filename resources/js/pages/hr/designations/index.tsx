// pages/hr/designations/index.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function Designations() {
  
  const { auth, designations, departments, filters: pageFilters = {}, globalSettings } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedDepartment, setSelectedDepartment] = useState(pageFilters.department || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedDepartment !== 'all';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedDepartment !== 'all' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.designations.index'), { 
      page: 1,
      search: searchTerm || undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.designations.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
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
      if (!globalSettings?.is_demo) {
        toast.loading('Creating designation...');
      }
      
      router.post(route('hr.designations.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === 'string') {
            toast.error(errors);          } else {
            toast.error(`Failed to create designation: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      if (!globalSettings?.is_demo) {
        toast.loading('Updating designation...');
      }
      
      router.put(route('hr.designations.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === 'string') {
            toast.error(errors);          } else {
            toast.error(`Failed to update designation: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) {
      toast.loading('Deleting designation...');
    }
    
    router.delete(route('hr.designations.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to delete designation: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleToggleStatus = (designation: any) => {
    const newStatus = designation.status === 'active' ? 'inactive' : 'active';
    if (!globalSettings?.is_demo) {
      toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} designation...`);
    }
    
    router.put(route('hr.designations.toggle-status', designation.id), {}, {
      onSuccess: (page) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to update designation status: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setShowFilters(false);
    
    router.get(route('hr.designations.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Add New Designation" button if user has permission
  if (hasPermission(permissions, 'create-designations')) {
    pageActions.push({
      label: 'Add Designation',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.designations.index') },
    { title: 'Designations' }
  ];

  // Define table columns
  const columns = [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (value: string) => value || '-'
    },
    { 
      key: 'department', 
      label: 'Department',
      render: (value: any, row: any) => {
        if (!value) return '-';
        return (
          <div>
            <div>{value.name}</div>
            <div className="text-xs text-muted-foreground">
              {'Branch'}: {value.branch?.name || '-'}
            </div>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => {
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            value === 'active' 
              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
              : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
          }`}>
            {value === 'active' ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      label: 'Created At', 
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
      requiredPermission: 'view-designations'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-designations'
    },
    { 
      label: 'Toggle Status', 
      icon: 'Lock', 
      action: 'toggle-status', 
      className: 'text-amber-500',
      requiredPermission: 'toggle-status-designations'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-designations'
    }
  ];

  // Prepare department options for filter
  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...(departments || []).map((department: any) => ({
      value: department.id.toString(),
      label: `${department.name} (${department.branch?.name || 'No Branch'})`
    }))
  ];

  return (
    <PageTemplate 
      title={"Designations"} 
      url="/hr/designations"
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
              name: 'department',
              label: 'Department',
              type: 'select',
              value: selectedDepartment,
              searchable: true,
              onChange: setSelectedDepartment,
              options: departmentOptions
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
            router.get(route('hr.designations.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              department: selectedDepartment !== 'all' ? selectedDepartment : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={designations?.data || []}
          from={designations?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-designations',
            create: 'create-designations',
            edit: 'edit-designations',
            delete: 'delete-designations'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={designations?.from || 0}
          to={designations?.to || 0}
          total={designations?.total || 0}
          links={designations?.links}
          entityName={"designations"}
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
            { name: 'name', label: 'Designation Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { 
              name: 'department_id', 
              label: 'Department', 
              type: 'select', 
              searchable: true,
              options: departments ? departments.map((department: any) => ({
                value: department.id.toString(),
                label: `${department.name} (${department.branch?.name || 'No Branch'})`
              })) : [],
              required: true
            },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select', 
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ],
              defaultValue: 'active'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create' 
            ? 'Add New Designation' 
            : formMode === 'edit' 
              ? 'Edit Designation' 
              : 'View Designation'
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="designation"
      />
    </PageTemplate>
  );
}