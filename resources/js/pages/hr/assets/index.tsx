// pages/hr/assets/index.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Plus, BarChart, QrCode, UserPlus, ArrowDownLeft, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import MediaPicker from '@/components/MediaPicker';

export default function Assets() {
  
  const { auth, assets, assetTypes, locations, employees, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedAssetType, setSelectedAssetType] = useState(pageFilters.asset_type_id || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || '');
  const [selectedCondition, setSelectedCondition] = useState(pageFilters.condition || '');
  const [selectedLocation, setSelectedLocation] = useState(pageFilters.location || '');
  const [purchaseDateFrom, setPurchaseDateFrom] = useState(pageFilters.purchase_date_from || '');
  const [purchaseDateTo, setPurchaseDateTo] = useState(pageFilters.purchase_date_to || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedAssetType !== '' || 
           selectedStatus !== '' ||
           selectedCondition !== '' ||
           selectedLocation !== '' ||
           purchaseDateFrom !== '' || 
           purchaseDateTo !== '' || 
           searchTerm !== '';
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (selectedAssetType !== '' ? 1 : 0) + 
           (selectedStatus !== '' ? 1 : 0) +
           (selectedCondition !== '' ? 1 : 0) +
           (selectedLocation !== '' ? 1 : 0) +
           (purchaseDateFrom !== '' ? 1 : 0) + 
           (purchaseDateTo !== '' ? 1 : 0) + 
           (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const handleViewDashboard = () => {
    router.get(route('hr.assets.dashboard'));
  };
  
  const handleViewDepreciationReport = () => {
    router.get(route('hr.assets.depreciation-report'));
  };
  
  const applyFilters = () => {
    router.get(route('hr.assets.index'), { 
      page: 1,
      search: searchTerm || undefined,
      asset_type_id: selectedAssetType || undefined,
      status: selectedStatus || undefined,
      condition: selectedCondition || undefined,
      location: selectedLocation || undefined,
      purchase_date_from: purchaseDateFrom || undefined,
      purchase_date_to: purchaseDateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.assets.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      asset_type_id: selectedAssetType || undefined,
      status: selectedStatus || undefined,
      condition: selectedCondition || undefined,
      location: selectedLocation || undefined,
      purchase_date_from: purchaseDateFrom || undefined,
      purchase_date_to: purchaseDateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view':
        router.get(route('hr.assets.show', item.id));
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'assign':
        setIsAssignModalOpen(true);
        break;
      case 'return':
        setIsReturnModalOpen(true);
        break;
      case 'maintenance':
        setIsMaintenanceModalOpen(true);
        break;

      case 'download-document':
        window.open(route('hr.assets.download-document', item.id), '_blank');
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
      toast.loading('Creating asset...');

      router.post(route('hr.assets.store'), data, {
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
            toast.error(`Failed to create asset: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating asset...');
      
      router.put(route('hr.assets.update', currentItem.id), data, {
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
            toast.error(`Failed to update asset: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleAssignSubmit = (formData: any) => {
    toast.loading('Assigning asset...');
    
    router.post(route('hr.assets.assign', currentItem.id), formData, {
      onSuccess: (page) => {
        setIsAssignModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to assign asset: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleReturnSubmit = (formData: any) => {
    toast.loading('Returning asset...');
    
    router.post(route('hr.assets.return', currentItem.id), formData, {
      onSuccess: (page) => {
        setIsReturnModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to return asset: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleMaintenanceSubmit = (formData: any) => {
    toast.loading('Scheduling maintenance...');
    
    router.post(route('hr.assets.schedule-maintenance', currentItem.id), formData, {
      onSuccess: (page) => {
        setIsMaintenanceModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to schedule maintenance: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting asset...');
    
    router.delete(route('hr.assets.destroy', currentItem.id), {
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
          toast.error(`Failed to delete asset: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAssetType('');
    setSelectedStatus('');
    setSelectedCondition('');
    setSelectedLocation('');
    setPurchaseDateFrom('');
    setPurchaseDateTo('');
    setShowFilters(false);
    
    router.get(route('hr.assets.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Dashboard" button
  pageActions.push({
    label: 'Dashboard',
    icon: <BarChart className="h-4 w-4 mr-2" />,
    variant: 'outline',
    onClick: handleViewDashboard
  });
  
  // Add the "Depreciation Report" button
  pageActions.push({
    label: 'Depreciation Report',
    icon: <BarChart className="h-4 w-4 mr-2" />,
    variant: 'outline',
    onClick: handleViewDepreciationReport
  });
  
  // Add the "Add New Asset" button if user has permission
  if (hasPermission(permissions, 'create-assets')) {
    pageActions.push({
      label: 'Add Asset',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.assets.index') },
    { title: 'Asset Management', href: route('hr.assets.index') },
    { title: 'Assets' }
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
          <div className="text-xs text-gray-500">{row.asset_type?.name || '-'}</div>
        </div>
      )
    },
    { 
      key: 'asset_code', 
      label: 'Asset Code',
      render: (value, row) => (
        <div>
          <div>{value || '-'}</div>
          <div className="text-xs text-gray-500">{row.serial_number || '-'}</div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => {
        const statusClasses = {
          'available': 'bg-green-50 text-green-700 ring-green-600/20',
          'assigned': 'bg-blue-50 text-blue-700 ring-blue-600/20',
          'under_maintenance': 'bg-amber-50 text-amber-700 ring-amber-600/20',
          'disposed': 'bg-red-50 text-red-700 ring-red-600/20'
        };
        
        const statusLabels = {
          'available': 'Available',
          'assigned': 'Assigned',
          'under_maintenance': 'Under Maintenance',
          'disposed': 'Disposed'
        };
        
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses[value] || ''}`}>
            {statusLabels[value] || value}
          </span>
        );
      }
    },
    { 
      key: 'assigned_to', 
      label: 'Assigned To',
      render: (_, row) => {
        if (row.status !== 'assigned' || !row.current_assignment?.employee) {
          return '-';
        }
        
        return (
          <div>
            <div className="font-medium">{row.current_assignment.employee.name}</div>
            <div className="text-xs text-gray-500">{row.current_assignment.employee.employee_id}</div>
          </div>
        );
      }
    },
    { 
      key: 'purchase_date', 
      label: 'Purchase Date',
      sortable: true,
      render: (value) => value ? (window.appSettings?.formatDateTimeSimple(value,false) || new Date(value).toLocaleString()) : '-'
    },
    { 
      key: 'purchase_cost', 
      label: 'Purchase Cost',
      sortable: true,
      render: (value) => value ? window.appSettings.formatCurrency(value): '-'
    },
    { 
      key: 'location', 
      label: 'Location',
      render: (value) => value || '-'
    }
  ];

  // Define table actions
  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-assets'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-assets'
    },
    { 
      label: 'Assign', 
      icon: 'UserPlus', 
      action: 'assign', 
      className: 'text-green-500',
      requiredPermission: 'assign-assets',
      showWhen: (item) => item.status === 'available'
    },
    { 
      label: 'Return', 
      icon: 'ArrowDownLeft', 
      action: 'return', 
      className: 'text-purple-500',
      requiredPermission: 'assign-assets',
      showWhen: (item) => item.status === 'assigned'
    },
    { 
      label: 'Maintenance', 
      icon: 'Wrench', 
      action: 'maintenance', 
      className: 'text-indigo-500',
      requiredPermission: 'manage-asset-maintenance',
      showWhen: (item) => item.status !== 'disposed'
    },

    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-assets',
      showWhen: (item) => item.status !== 'assigned'
    }
  ];

  // Prepare asset type options for filter
  const assetTypeOptions = [
    { value: '_none_', label: 'All Types' },
    ...(assetTypes || []).map((type: any) => ({
      value: type.id.toString(),
      label: type.name
    }))
  ];

  // Prepare status options for filter
  const statusOptions = [
    { value: '_none_', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'under_maintenance', label: 'Under Maintenance' },
    { value: 'disposed', label: 'Disposed' }
  ];

  // Prepare condition options for filter
  const conditionOptions = [
    { value: '_none_', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  // Prepare location options for filter
  const locationOptions = [
    { value: '_none_', label: 'All Locations' },
    ...(locations || []).map((location: string) => ({
      value: location,
      label: location
    }))
  ];

  return (
    <PageTemplate 
      title={"Assets"} 
      url="/hr/assets"
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
              name: 'asset_type_id',
              label: 'Asset Type',
              type: 'select',
              value: selectedAssetType,
              onChange: setSelectedAssetType,
              options: assetTypeOptions
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
              name: 'condition',
              label: 'Condition',
              type: 'select',
              value: selectedCondition,
              onChange: setSelectedCondition,
              options: conditionOptions
            },
            {
              name: 'location',
              label: 'Location',
              type: 'select',
              value: selectedLocation,
              onChange: setSelectedLocation,
              options: locationOptions
            },
            {
              name: 'purchase_date_from',
              label: 'Purchase Date From',
              type: 'date',
              value: purchaseDateFrom,
              onChange: setPurchaseDateFrom
            },
            {
              name: 'purchase_date_to',
              label: 'Purchase Date To',
              type: 'date',
              value: purchaseDateTo,
              onChange: setPurchaseDateTo
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
            router.get(route('hr.assets.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              asset_type_id: selectedAssetType || undefined,
              status: selectedStatus || undefined,
              condition: selectedCondition || undefined,
              location: selectedLocation || undefined,
              purchase_date_from: purchaseDateFrom || undefined,
              purchase_date_to: purchaseDateTo || undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={assets?.data || []}
          from={assets?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-assets',
            create: 'create-assets',
            edit: 'edit-assets',
            delete: 'delete-assets'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={assets?.from || 0}
          to={assets?.to || 0}
          total={assets?.total || 0}
          links={assets?.links}
          entityName={"assets"}
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
              name: 'asset_type_id', 
              label: 'Asset Type', 
              type: 'select',
              required: true,
              options: assetTypeOptions.filter(opt => opt.value !== '_none_')
            },
            { 
              name: 'serial_number', 
              label: 'Serial Number', 
              type: 'text'
            },
            { 
              name: 'asset_code', 
              label: 'Asset Code', 
              type: 'text'
            },
            { 
              name: 'purchase_date', 
              label: 'Purchase Date', 
              type: 'date'
            },
            { 
              name: 'purchase_cost', 
              label: 'Purchase Cost', 
              type: 'number',
              min: 0,
              step: 0.01
            },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select',
              required: true,
              options: [
                { value: 'available', label: 'Available' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'under_maintenance', label: 'Under Maintenance' },
                { value: 'disposed', label: 'Disposed' }
              ]
            },
            { 
              name: 'condition', 
              label: 'Condition', 
              type: 'select',
              options: [
                { value: 'new', label: 'New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' }
              ]
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea'
            },
            { 
              name: 'location', 
              label: 'Location', 
              type: 'text'
            },
            { 
              name: 'supplier', 
              label: 'Supplier', 
              type: 'text'
            },
            { 
              name: 'warranty_info', 
              label: 'Warranty Information', 
              type: 'text'
            },
            { 
              name: 'warranty_expiry_date', 
              label: 'Warranty Expiry Date', 
              type: 'date'
            },
            { 
              name: 'images', 
              label: 'Images', 
              type: 'custom',
              render: (field, formData, handleChange) => (
                <MediaPicker
                  value={String(formData[field.name] || '')}
                  onChange={(url) => handleChange(field.name, url)}
                  placeholder={'Select image file...'}
                />
              ),
              helpText: 'Upload image file (max 5MB)'
            },
            { 
              name: 'documents', 
              label: 'Documents', 
              type: 'custom',
              render: (field, formData, handleChange) => (
                <MediaPicker
                  value={String(formData[field.name] || '')}
                  onChange={(url) => handleChange(field.name, url)}
                  placeholder={'Select document file...'}
                />
              ),
              helpText: 'Upload PDF or Word document (max 5MB)'
            },
            { 
              name: 'depreciation_method', 
              label: 'Depreciation Method', 
              type: 'select',
              options: [
                { value: '_none_', label: 'No Depreciation' },
                { value: 'straight_line', label: 'Straight Line' },
                { value: 'reducing_balance', label: 'Reducing Balance' }
              ],
              showWhen: (formData) => formData.purchase_cost && formData.purchase_date
            },
            { 
              name: 'useful_life_years', 
              label: 'Useful Life (Years)', 
              type: 'number',
              min: 1,
              step: 1,
              defaultValue: 5,
              showWhen: (formData) => formData.depreciation_method
            },
            { 
              name: 'salvage_value', 
              label: 'Salvage Value', 
              type: 'number',
              min: 0,
              step: 0.01,
              showWhen: (formData) => formData.depreciation_method
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Asset'
            : formMode === 'edit'
              ? 'Edit Asset'
              : 'View Asset'
        }
        mode={formMode}
      />

      {/* Assign Modal */}
      <CrudFormModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubmit={handleAssignSubmit}
        formConfig={{
          fields: [
            { 
              name: 'employee_id', 
              label: 'Employee', 
              type: 'select',
              required: true,
              options: (employees || []).map((emp: any) => ({
                value: emp.id.toString(),
                label: `${emp.name} (${emp.employee_id})`
              }))
            },
            { 
              name: 'checkout_date', 
              label: 'Checkout Date', 
              type: 'date',
              required: true,
              defaultValue: new Date().toISOString().split('T')[0]
            },
            { 
              name: 'expected_return_date', 
              label: 'Expected Return Date', 
              type: 'date'
            },
            { 
              name: 'checkout_condition', 
              label: 'Checkout Condition', 
              type: 'select',
              options: [
                { value: 'new', label: 'New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' }
              ],
              defaultValue: currentItem?.condition
            },
            { 
              name: 'notes', 
              label: 'Notes', 
              type: 'textarea'
            }
          ],
          modalSize: 'md'
        }}
        initialData={{}}
        title={'Assign Asset'}
        mode="create"
      />

      {/* Return Modal */}
      <CrudFormModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={handleReturnSubmit}
        formConfig={{
          fields: [
            { 
              name: 'checkin_date', 
              label: 'Check-in Date', 
              type: 'date',
              required: true,
              defaultValue: new Date().toISOString().split('T')[0]
            },
            { 
              name: 'checkin_condition', 
              label: 'Check-in Condition', 
              type: 'select',
              options: [
                { value: 'new', label: 'New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' }
              ],
              defaultValue: currentItem?.condition
            },
            { 
              name: 'notes', 
              label: 'Notes', 
              type: 'textarea'
            }
          ],
          modalSize: 'md'
        }}
        initialData={{}}
        title={'Return Asset'}
        mode="create"
      />

      {/* Maintenance Modal */}
      <CrudFormModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSubmit={handleMaintenanceSubmit}
        formConfig={{
          fields: [
            { 
              name: 'maintenance_type', 
              label: 'Maintenance Type', 
              type: 'select',
              required: true,
              options: [
                { value: 'repair', label: 'Repair' },
                { value: 'preventive', label: 'Preventive' },
                { value: 'calibration', label: 'Calibration' },
                { value: 'software update', label: 'Software Update' },
                { value: 'hardware upgrade', label: 'Hardware Upgrade' }
              ]
            },
            { 
              name: 'start_date', 
              label: 'Start Date', 
              type: 'date',
              required: true,
              defaultValue: new Date().toISOString().split('T')[0]
            },
            { 
              name: 'end_date', 
              label: 'End Date', 
              type: 'date'
            },
            { 
              name: 'cost', 
              label: 'Cost', 
              type: 'number',
              min: 0,
              step: 0.01
            },
            { 
              name: 'details', 
              label: 'Details', 
              type: 'textarea'
            },
            { 
              name: 'supplier', 
              label: 'Supplier', 
              type: 'text'
            }
          ],
          modalSize: 'md'
        }}
        initialData={{}}
        title={'Schedule Maintenance'}
        mode="create"
      />



      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="asset"
      />
    </PageTemplate>
  );
}