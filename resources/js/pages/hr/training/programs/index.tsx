// pages/hr/training/programs/index.tsx
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
import { Plus, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MediaPicker from '@/components/MediaPicker';

export default function TrainingPrograms() {
  
  const { auth, trainingPrograms, trainingTypes, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedType, setSelectedType] = useState(pageFilters.training_type_id || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || '');
  const [isMandatory, setIsMandatory] = useState(pageFilters.is_mandatory === 'true');
  const [isSelfEnrollment, setIsSelfEnrollment] = useState(pageFilters.is_self_enrollment === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedType !== '' || 
           selectedStatus !== '' || 
           isMandatory || 
           isSelfEnrollment || 
           searchTerm !== '';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (selectedType !== '' ? 1 : 0) + 
           (selectedStatus !== '' ? 1 : 0) + 
           (isMandatory ? 1 : 0) + 
           (isSelfEnrollment ? 1 : 0) + 
           (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.training-programs.index'), { 
      page: 1,
      search: searchTerm || undefined,
      training_type_id: selectedType || undefined,
      status: selectedStatus || undefined,
      is_mandatory: isMandatory ? 'true' : undefined,
      is_self_enrollment: isSelfEnrollment ? 'true' : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.training-programs.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      training_type_id: selectedType || undefined,
      status: selectedStatus || undefined,
      is_mandatory: isMandatory ? 'true' : undefined,
      is_self_enrollment: isSelfEnrollment ? 'true' : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view':
        router.get(route('hr.training-programs.show', item.id));
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'download-materials':
        window.open(route('hr.training-programs.download-materials', item.id), '_blank');
        break;
    }
  };
  
  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };
  
  const handleFormSubmit = (formData: any) => {
    const data = formData;
    
    if (formMode === 'create') {
      toast.loading('Creating training program...');

      router.post(route('hr.training-programs.store'), data, {
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
            toast.error(`Failed to create training program: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating training program...');
      
      router.put(route('hr.training-programs.update', currentItem.id), data, {
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
            toast.error(`Failed to update training program: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting training program...');
    
    router.delete(route('hr.training-programs.destroy', currentItem.id), {
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
          toast.error(`Failed to delete training program: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setIsMandatory(false);
    setIsSelfEnrollment(false);
    setShowFilters(false);
    
    router.get(route('hr.training-programs.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Add New Training Program" button if user has permission
  if (hasPermission(permissions, 'create-training-programs')) {
    pageActions.push({
      label: 'Add Training Program',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.training-programs.index') },
    { title: 'Training Management', href: route('hr.training-programs.index') },
    { title: 'Training Programs' }
  ];

  // Define table columns
  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{row.training_type?.name || '-'}</div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusClasses = {
          'draft': 'bg-gray-50 text-gray-700 ring-gray-600/20',
          'active': 'bg-green-50 text-green-700 ring-green-600/20',
          'completed': 'bg-blue-50 text-blue-700 ring-blue-600/20',
          'cancelled': 'bg-red-50 text-red-700 ring-red-600/20'
        };
        
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses[value] || ''}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    { 
      key: 'duration', 
      label: 'Duration',
      sortable: true,
      render: (value) => value ? `${value} ${'hours'}` : '-'
    },
    { 
      key: 'cost', 
      label: 'Cost',
      sortable: true,
      render: (value) => value ? window.appSettings?.formatCurrency(parseFloat(value)) : '-'
    },
    { 
      key: 'capacity', 
      label: 'Capacity',
      sortable: true,
      render: (value) => value || '-'
    },
    { 
      key: 'flags', 
      label: 'Flags',
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.is_mandatory && (
            <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
              {'Mandatory'}
            </Badge>
          )}
          {row.is_self_enrollment && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              {'Self-Enrollment'}
            </Badge>
          )}
        </div>
      )
    },
    { 
      key: 'sessions_count', 
      label: 'Sessions',
      render: (value) => value || '0'
    },
    { 
      key: 'employee_trainings_count', 
      label: 'Employees',
      render: (value) => value || '0'
    }
  ];

  // Define table actions
  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-training-programs'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-training-programs'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-training-programs'
    }
  ];

  // Prepare training type options for filter
  const trainingTypeOptions = [
    { value: '', label: 'All Types' },
    ...(trainingTypes || []).map((type: any) => ({
      value: type.id.toString(),
      label: `${type.name} (${type.branch?.name || 'No Branch'} - ${type.departments?.map((d: any) => d.name).join(', ') || 'No Departments'})`
    }))
  ];

  // Prepare status options for filter
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <PageTemplate 
      title={"Training Programs"} 
      url="/hr/training/programs"
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
              name: 'training_type_id',
              label: 'Training Type',
              type: 'select',
              value: selectedType,
              onChange: setSelectedType,
              options: trainingTypeOptions,
              searchable : true,
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: statusOptions,
              searchable : true,
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
            router.get(route('hr.training-programs.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              training_type_id: selectedType || undefined,
              status: selectedStatus || undefined,
              is_mandatory: isMandatory ? 'true' : undefined,
              is_self_enrollment: isSelfEnrollment ? 'true' : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={trainingPrograms?.data || []}
          from={trainingPrograms?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-training-programs',
            create: 'create-training-programs',
            edit: 'edit-training-programs',
            delete: 'delete-training-programs'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={trainingPrograms?.from || 0}
          to={trainingPrograms?.to || 0}
          total={trainingPrograms?.total || 0}
          links={trainingPrograms?.links}
          entityName={"training programs"}
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
              name: 'name', 
              label: 'Name', 
              type: 'text',
              required: true
            },
            { 
              name: 'training_type_id', 
              label: 'Training Type', 
              type: 'select',
              required: true,
              searchable: true,
              options: (trainingTypes || []).map((type: any) => ({
                value: type.id.toString(),
                label: `${type.name} (${type.branch?.name || 'No Branch'} - ${type.departments?.map((d: any) => d.name).join(', ') || 'No Departments'})`
              }))
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea'
            },
            { 
              name: 'duration', 
              label: 'Duration (hours)', 
              type: 'number',
              min: 1
            },
            { 
              name: 'cost', 
              label: 'Cost', 
              type: 'number',
              min: 0,
              step: 0.01
            },
            { 
              name: 'capacity', 
              label: 'Capacity', 
              type: 'number',
              min: 1
            },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select',
              required: true,
              options: [
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]
            },
            { 
              name: 'materials', 
              label: 'Materials', 
              type: 'custom',
              render: (field, formData, handleChange) => (
                <MediaPicker
                  value={String(formData[field.name] || '')}
                  onChange={(url) => handleChange(field.name, url)}
                  placeholder={'Select materials file...'}
                />
              ),
              helpText: 'Upload PDF, Word or ZIP file (max 10MB)'
            },
            { 
              name: 'prerequisites', 
              label: 'Prerequisites', 
              type: 'textarea'
            },
            { 
              name: 'is_mandatory', 
              label: 'Mandatory Training', 
              type: 'checkbox',
              helpText: 'Mark this training as mandatory for employees'
            },
            { 
              name: 'is_self_enrollment', 
              label: 'Allow Self-Enrollment', 
              type: 'checkbox',
              helpText: 'Allow employees to enroll themselves in this training'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Training Program'
            : formMode === 'edit'
              ? 'Edit Training Program'
              : 'View Training Program'
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="training program"
      />
    </PageTemplate>
  );
}