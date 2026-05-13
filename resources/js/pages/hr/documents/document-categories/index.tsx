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
import { Plus, Folder, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentCategories() {
  
  const { auth, documentCategories, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || '_empty_');
  const [mandatoryFilter, setMandatoryFilter] = useState(pageFilters.is_mandatory || '_empty_');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const hasActiveFilters = () => {
    return statusFilter !== '_empty_' || mandatoryFilter !== '_empty_' || searchTerm !== '';
  };
  
  const activeFilterCount = () => {
    return (statusFilter !== '_empty_' ? 1 : 0) + (mandatoryFilter !== '_empty_' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.documents.document-categories.index'), { 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      is_mandatory: mandatoryFilter !== '_empty_' ? mandatoryFilter : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.documents.document-categories.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      is_mandatory: mandatoryFilter !== '_empty_' ? mandatoryFilter : undefined,
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
      toast.loading('Creating document category...');

      router.post(route('hr.documents.document-categories.store'), formData, {
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
            toast.error(`Failed to create document category: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating document category...');

      router.put(route('hr.documents.document-categories.update', currentItem.id), formData, {
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
            toast.error(`Failed to update document category: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting document category...');

    router.delete(route('hr.documents.document-categories.destroy', currentItem.id), {
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
          toast.error(`Failed to delete document category: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };
  
  const handleToggleStatus = (item: any) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} document category...`);

    router.put(route('hr.documents.document-categories.toggle-status', item.id), {}, {
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
          toast.error(`Failed to update document category status: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('_empty_');
    setMandatoryFilter('_empty_');
    setShowFilters(false);
    
    router.get(route('hr.documents.document-categories.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const pageActions = [];
  
  if (hasPermission(permissions, 'create-document-categories')) {
    pageActions.push({
      label: 'Add Category',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Document Management', href: route('hr.documents.document-categories.index') },
    { title: 'Document Categories' }
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Category', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: row.color }}
          >
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium flex items-center gap-2">
              {value}
              {row.is_mandatory && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500">{row.description}</div>
          </div>
        </div>
      )
    },
    // { 
    //   key: 'sort_order', 
    //   label: 'Order',
    //   sortable: true,
    //   render: (value) => (
    //     <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
    //       #{value}
    //     </span>
    //   )
    // },
    { 
      key: 'documents_count', 
      label: 'Documents',
      render: (value) => (
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-gray-500" />
          <span>{value || 0} {'documents'}</span>
        </div>
      )
    },
    { 
      key: 'is_mandatory', 
      label: 'Type',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
          value 
            ? 'bg-red-50 text-red-700 ring-red-600/10' 
            : 'bg-blue-50 text-blue-700 ring-blue-600/20'
        }`}>
          {value ? (
            <>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {'Mandatory'}
            </>
          ) : (
            'Optional'
          )}
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
      requiredPermission: 'view-document-categories'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-document-categories'
    },
    { 
      label: 'Toggle Status', 
      icon: 'Lock', 
      action: 'toggle-status', 
      className: 'text-amber-500',
      requiredPermission: 'edit-document-categories'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-document-categories'
    }
  ];

  const statusOptions = [
    { value: '_empty_', label: 'All Statuses' , disabled: true },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const mandatoryOptions = [
    { value: '_empty_', label: 'All Types', disabled: true  },
    { value: 'true', label: 'Mandatory' },
    { value: 'false', label: 'Optional' }
  ];

  const iconOptions = [
    { value: 'FileText', label: 'FileText' },
    { value: 'Folder', label: 'Folder' },
    { value: 'Shield', label: 'Shield' },
    { value: 'Book', label: 'Book' },
    { value: 'ClipboardList', label: 'ClipboardList' },
    { value: 'Scale', label: 'Scale' },
    { value: 'GraduationCap', label: 'GraduationCap' },
    { value: 'Building', label: 'Building' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Users', label: 'Users' },
    { value: 'Settings', label: 'Settings' },
    { value: 'Archive', label: 'Archive' }
  ];

  return (
    <PageTemplate 
      title={"Document Categories"} 
      url="/hr/documents/document-categories"
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
              name: 'is_mandatory',
              label: 'Type',
              type: 'select',
              value: mandatoryFilter,
              onChange: setMandatoryFilter,
              options: mandatoryOptions
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
            router.get(route('hr.documents.document-categories.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              status: statusFilter !== '_empty_' ? statusFilter : undefined,
              is_mandatory: mandatoryFilter !== '_empty_' ? mandatoryFilter : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={documentCategories?.data || []}
          from={documentCategories?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-document-categories',
            create: 'create-document-categories',
            edit: 'edit-document-categories',
            delete: 'delete-document-categories'
          }}
        />

        <Pagination
          from={documentCategories?.from || 0}
          to={documentCategories?.to || 0}
          total={documentCategories?.total || 0}
          links={documentCategories?.links}
          entityName={"document categories"}
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
              label: 'Category Name', 
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
              name: 'color', 
              label: 'Color', 
              type: 'color', 
              required: true,
              helpText: 'Choose a color to represent this category'
            },
            { 
              name: 'icon', 
              label: 'Icon', 
              type: 'select', 
              required: true,
              options: iconOptions,
              searchable  : true
            },
            // { 
            //   name: 'sort_order', 
            //   label: 'Sort Order', 
            //   type: 'number',
            //   min: 0,
            //   helpText: 'Lower numbers appear first'
            // },
            { 
              name: 'is_mandatory', 
              label: 'Mandatory Category', 
              type: 'checkbox',
              helpText: 'Documents in mandatory categories require acknowledgment'
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
            ? 'Add New Document Category'
            : formMode === 'edit'
              ? 'Edit Document Category'
              : 'View Document Category'
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="document category"
      />
    </PageTemplate>
  );
}