// pages/hr/training/assessments/index.tsx
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
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TrainingAssessments() {
  
  const { auth, trainingAssessments, trainingPrograms, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedProgram, setSelectedProgram] = useState(pageFilters.training_program_id || '');
  const [selectedType, setSelectedType] = useState(pageFilters.type || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedProgram !== '' || selectedType !== '' || searchTerm !== '';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (selectedProgram !== '' ? 1 : 0) + (selectedType !== '' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.training-assessments.index'), { 
      page: 1,
      search: searchTerm || undefined,
      training_program_id: selectedProgram || undefined,
      type: selectedType || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.training-assessments.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      training_program_id: selectedProgram || undefined,
      type: selectedType || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view':
        router.get(route('hr.training-assessments.show', item.id));
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
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
      toast.loading('Creating assessment...');

      router.post(route('hr.training-assessments.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          } else {
            toast.success('Assessment created successfully');
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(`Failed to create assessment: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating assessment...');

      router.put(route('hr.training-assessments.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          } else {
            toast.success('Assessment updated successfully');
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(`Failed to update assessment: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting assessment...');
    
    router.delete(route('hr.training-assessments.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        } else {
          toast.success('Assessment deleted successfully');
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(`Failed to delete assessment: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedProgram('');
    setSelectedType('');
    setShowFilters(false);
    
    router.get(route('hr.training-assessments.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Add New Assessment" button if user has permission
  if (hasPermission(permissions, 'manage-assessments')) {
    pageActions.push({
      label: 'Add Assessment',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.training-assessments.index') },
    { title: 'Training Management', href: route('hr.training-assessments.index') },
    { title: 'Training Assessments' }
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
          <div className="text-xs text-gray-500">{row.training_program?.name || '-'}</div>
        </div>
      )
    },
    { 
      key: 'type', 
      label: 'Type',
      sortable: true,
      render: (value) => {
        const typeClasses = {
          'quiz': 'bg-blue-50 text-blue-700 ring-blue-600/20',
          'practical': 'bg-green-50 text-green-700 ring-green-600/20',
          'presentation': 'bg-amber-50 text-amber-700 ring-amber-600/20'
        };
        
        return (
          <Badge className={`${typeClasses[value] || ''}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      }
    },
    { 
      key: 'passing_score', 
      label: 'Passing Score',
      sortable: true,
      render: (value) => `${value}%`
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (value) => value ? (
        <div className="max-w-xs truncate">{value}</div>
      ) : '-'
    },
    { 
      key: 'employee_results_count', 
      label: 'Results',
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
      requiredPermission: 'manage-assessments'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'manage-assessments'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'manage-assessments'
    }
  ];

  // Prepare training program options for filter
  const trainingProgramOptions = [
    { value: '', label: 'All Programs' },
    ...(trainingPrograms || []).map((program: any) => ({
      value: program.id.toString(),
      label: program.name
    }))
  ];

  // Prepare assessment type options for filter
  const assessmentTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'practical', label: 'Practical' },
    { value: 'presentation', label: 'Presentation' }
  ];

  return (
    <PageTemplate 
      title={"Training Assessments"} 
      url="/hr/training/assessments"
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
              name: 'training_program_id',
              label: 'Training Program',
              type: 'select',
              value: selectedProgram,
              onChange: setSelectedProgram,
              options: trainingProgramOptions
            },
            {
              name: 'type',
              label: 'Assessment Type',
              type: 'select',
              value: selectedType,
              onChange: setSelectedType,
              options: assessmentTypeOptions
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
            router.get(route('hr.training-assessments.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              training_program_id: selectedProgram || undefined,
              type: selectedType || undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={trainingAssessments?.data || []}
          from={trainingAssessments?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'manage-assessments',
            create: 'manage-assessments',
            edit: 'manage-assessments',
            delete: 'manage-assessments'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={trainingAssessments?.from || 0}
          to={trainingAssessments?.to || 0}
          total={trainingAssessments?.total || 0}
          links={trainingAssessments?.links}
          entityName={"assessments"}
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
              name: 'training_program_id', 
              label: 'Training Program', 
              type: 'select',
              required: true,
              options: trainingProgramOptions.filter(opt => opt.value !== '')
            },
            { 
              name: 'name', 
              label: 'Assessment Name', 
              type: 'text',
              required: true
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea'
            },
            { 
              name: 'type', 
              label: 'Assessment Type', 
              type: 'select',
              required: true,
              options: [
                { value: 'quiz', label: 'Quiz' },
                { value: 'practical', label: 'Practical' },
                { value: 'presentation', label: 'Presentation' }
              ]
            },
            { 
              name: 'passing_score', 
              label: 'Passing Score (%)', 
              type: 'number',
              required: true,
              min: 0,
              max: 100,
              defaultValue: 70
            },
            { 
              name: 'criteria', 
              label: 'Assessment Criteria', 
              type: 'textarea',
              helpText: 'Describe the criteria used to evaluate this assessment'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Assessment'
            : formMode === 'edit'
              ? 'Edit Assessment'
              : 'View Assessment'
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="assessment"
      />
    </PageTemplate>
  );
}