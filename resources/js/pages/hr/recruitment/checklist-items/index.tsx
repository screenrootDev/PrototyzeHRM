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

export default function ChecklistItems() {
  
  const { auth, checklistItems, checklists, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [categoryFilter, setCategoryFilter] = useState(pageFilters.category || '_empty_');
  const [checklistFilter, setChecklistFilter] = useState(pageFilters.checklist_id || '_empty_');
  const [requiredFilter, setRequiredFilter] = useState(pageFilters.is_required || '_empty_');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const hasActiveFilters = () => {
    return categoryFilter !== '_empty_' || checklistFilter !== '_empty_' || requiredFilter !== '_empty_' || searchTerm !== '';
  };

  const activeFilterCount = () => {
    return (categoryFilter !== '_empty_' ? 1 : 0) + (checklistFilter !== '_empty_' ? 1 : 0) + (requiredFilter !== '_empty_' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('hr.recruitment.checklist-items.index'), {
      page: 1,
      search: searchTerm || undefined,
      category: categoryFilter !== '_empty_' ? categoryFilter : undefined,
      checklist_id: checklistFilter !== '_empty_' ? checklistFilter : undefined,
      is_required: requiredFilter !== '_empty_' ? requiredFilter : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('hr.recruitment.checklist-items.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      category: categoryFilter !== '_empty_' ? categoryFilter : undefined,
      checklist_id: checklistFilter !== '_empty_' ? checklistFilter : undefined,
      is_required: requiredFilter !== '_empty_' ? requiredFilter : undefined,
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
      toast.loading('Creating checklist item...');

      router.post(route('hr.recruitment.checklist-items.store'), formData, {
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
            toast.error(`Failed to create checklist item: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating checklist item...');

      router.put(route('hr.recruitment.checklist-items.update', currentItem.id), formData, {
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
            toast.error(`Failed to update checklist item: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading('Deleting checklist item...');

    router.delete(route('hr.recruitment.checklist-items.destroy', currentItem.id), {
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
          toast.error(`Failed to delete checklist item: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleToggleStatus = (item: any) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} checklist item...`);

    router.put(route('hr.recruitment.checklist-items.toggle-status', item.id), {}, {
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
          toast.error(`Failed to update checklist item status: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('_empty_');
    setChecklistFilter('_empty_');
    setRequiredFilter('_empty_');
    setShowFilters(false);

    router.get(route('hr.recruitment.checklist-items.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const pageActions = [];

  if (hasPermission(permissions, 'create-checklist-items')) {
    pageActions.push({
      label: 'Add Item',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Recruitment', href: route('hr.recruitment.checklist-items.index') },
    { title: 'Checklist Items' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Documentation': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'IT Setup': return 'bg-purple-50 text-purple-700 ring-purple-600/20';
      case 'Training': return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'HR': return 'bg-orange-50 text-orange-700 ring-orange-600/20';
      case 'Facilities': return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'Other': return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      default: return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    }
  };

  const columns = [
    {
      key: 'checklist.name',
      label: 'Checklist',
      render: (_, row) => row.checklist?.name || '-'
    },
    {
      key: 'task_name',
      label: 'Task',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.is_required && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
              {'Required'}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getCategoryColor(value)}`}>
          {value}
        </span>
      )
    },
    // {
    //   key: 'assigned_to_role',
    //   label: 'Assigned To',
    //   render: (value) => value || '-'
    // },
    // {
    //   key: 'due_day',
    //   label: 'Due Day',
    //   sortable: true,
    //   render: (value) => (
    //     <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
    //       {'Day'} {value}
    //     </span>
    //   )
    // },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${value === 'active'
            ? 'bg-green-50 text-green-700 ring-green-600/20'
            : 'bg-red-50 text-red-700 ring-red-600/20'
          }`}>
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'View',
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-checklist-items'
    },
    {
      label: 'Edit',
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-checklist-items'
    },
    {
      label: 'Toggle Status',
      icon: 'Lock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'edit-checklist-items'
    },
    {
      label: 'Delete',
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-checklist-items'
    }
  ];

  const categoryOptions = [
    { value: '_empty_', label: 'All Categories', disabled: true },
    { value: 'Documentation', label: 'Documentation' },
    { value: 'IT Setup', label: 'IT Setup' },
    { value: 'Training', label: 'Training' },
    { value: 'HR', label: 'HR' },
    { value: 'Facilities', label: 'Facilities' },
    { value: 'Other', label: 'Other' }
  ];

  const checklistOptions = [
    { value: '_empty_', label: 'All Checklists', disabled: true },
    ...(checklists || []).map((checklist: any) => ({
      value: checklist.id.toString(),
      label: checklist.name
    }))
  ];

  const requiredOptions = [
    { value: '_empty_', label: 'All', disabled: true },
    { value: 'true', label: 'Required' },
    { value: 'false', label: 'Optional' }
  ];

  const checklistSelectOptions = [
    { value: '_empty_', label: 'Select Checklist' },
    ...(checklists || []).map((checklist: any) => ({
      value: checklist.id.toString(),
      label: checklist.name
    }))
  ];

  return (
    <PageTemplate
      title={"Checklist Items"}
      url="/hr/recruitment/checklist-items"
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
              name: 'category',
              label: 'Category',
              type: 'select',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions
            },
            {
              name: 'checklist_id',
              label: 'Checklist',
              type: 'select',
              value: checklistFilter,
              onChange: setChecklistFilter,
              options: checklistOptions,
              searchable: true
            },
            {
              name: 'is_required',
              label: 'Required',
              type: 'select',
              value: requiredFilter,
              onChange: setRequiredFilter,
              options: requiredOptions
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
            router.get(route('hr.recruitment.checklist-items.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
              category: categoryFilter !== '_empty_' ? categoryFilter : undefined,
              checklist_id: checklistFilter !== '_empty_' ? checklistFilter : undefined,
              is_required: requiredFilter !== '_empty_' ? requiredFilter : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={checklistItems?.data || []}
          from={checklistItems?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-checklist-items',
            create: 'create-checklist-items',
            edit: 'edit-checklist-items',
            delete: 'delete-checklist-items'
          }}
        />

        <Pagination
          from={checklistItems?.from || 0}
          to={checklistItems?.to || 0}
          total={checklistItems?.total || 0}
          links={checklistItems?.links}
          entityName={"checklist items"}
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
              name: 'checklist_id',
              label: 'Checklist',
              type: 'select',
              required: true,
              options: checklistSelectOptions.filter(opt => opt.value !== '_empty_'),
              searchable: true
            },
            {
              name: 'task_name',
              label: 'Task Name',
              type: 'text',
              required: true
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea'
            },
            {
              name: 'category',
              label: 'Category',
              type: 'select',
              required: true,
              options: categoryOptions.filter(opt => opt.value !== '_empty_'),
              searchable: true
            },
            // {
            //   name: 'assigned_to_role',
            //   label: 'Assigned To Role',
            //   type: 'text'
            // },
            // {
            //   name: 'due_day',
            //   label: 'Due Day',
            //   type: 'number',
            //   required: true,
            //   min: 1,
            //   helpText: 'Number of days from start date'
            // },
            {
              name: 'is_required',
              label: 'Required Task',
              type: 'checkbox'
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              required: true,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Checklist Item'
            : formMode === 'edit'
              ? 'Edit Checklist Item'
              : 'View Checklist Item'
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.task_name || ''}
        entityName="checklist item"
      />
    </PageTemplate>
  );
}