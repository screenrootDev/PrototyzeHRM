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
import { Plus, FileText, Download, Eye, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import { format } from 'date-fns';

export default function HrDocuments() {
  
  const { auth, hrDocuments, categories, filters: pageFilters = {}, errors, flash } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [categoryFilter, setCategoryFilter] = useState(pageFilters.category_id || '_empty_');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || '_empty_');

  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const hasActiveFilters = () => {
    return categoryFilter !== '_empty_' || statusFilter !== '_empty_' || searchTerm !== '';
  };
  
  const activeFilterCount = () => {
    return (categoryFilter !== '_empty_' ? 1 : 0) + (statusFilter !== '_empty_' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const applyFilters = () => {
    router.get(route('hr.documents.hr-documents.index'), { 
      page: 1,
      search: searchTerm || undefined,
      category_id: categoryFilter !== '_empty_' ? categoryFilter : undefined,
      status: statusFilter !== '_empty_' ? statusFilter : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    router.get(route('hr.documents.hr-documents.index'), { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      search: searchTerm || undefined,
      category_id: categoryFilter !== '_empty_' ? categoryFilter : undefined,
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
      case 'download':
        window.open(route('hr.documents.hr-documents.download', item.id), '_blank');
        break;
      case 'update-status':
        setIsStatusModalOpen(true);
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
      toast.loading('Uploading document...');

      router.post(route('hr.documents.hr-documents.store'), formData, {
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
            toast.error(`Failed to upload document: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating document...');

      router.put(route('hr.documents.hr-documents.update', currentItem.id), formData, {
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
            toast.error(`Failed to update document: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting document...');

    router.delete(route('hr.documents.hr-documents.destroy', currentItem.id), {
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
          toast.error(`Failed to delete document: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('_empty_');
    setStatusFilter('_empty_');
    setShowFilters(false);
    
    router.get(route('hr.documents.hr-documents.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };
  
  const handleStatusUpdate = (formData: any) => {
    toast.loading('Updating status...');

    router.put(route('hr.documents.hr-documents.update-status', currentItem.id), formData, {
      onSuccess: (page) => {
        setIsStatusModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to update status: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };

  const pageActions = [];
  
  if (hasPermission(permissions, 'create-hr-documents')) {
    pageActions.push({
      label: 'Upload Document',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Document Management', href: route('hr.documents.hr-documents.index') },
    { title: 'HR Documents' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      case 'Under Review': return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'Approved': return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'Published': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'Archived': return 'bg-purple-50 text-purple-700 ring-purple-600/20';
      case 'Expired': return 'bg-red-50 text-red-700 ring-red-600/10';
      default: return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FileText className="h-3 w-3" />;
      case 'Under Review': return <Clock className="h-3 w-3" />;
      case 'Approved': return <CheckCircle className="h-3 w-3" />;
      case 'Published': return <Eye className="h-3 w-3" />;
      case 'Archived': return <FileText className="h-3 w-3" />;
      case 'Expired': return <AlertTriangle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };



  const formatFileSize = (bytes: number) => {
    if (bytes >= 1073741824) {
      return (bytes / 1073741824).toFixed(2) + ' GB';
    } else if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return bytes + ' bytes';
    }
  };

  const columns = [
    { 
      key: 'title', 
      label: 'Document', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: row.category?.color || '#3B82F6' }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium flex items-center gap-2">
              {value}
              {row.requires_acknowledgment && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500">
              {row.file_name} • v{row.version}
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'category.name', 
      label: 'Category',
      render: (_, row) => row.category?.name || '-'
    },
    { 
      key: 'file_size', 
      label: 'Size',
      render: (value) => formatFileSize(value)
    },

    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(value)}`}>
          {getStatusIcon(value)}
          {value}
        </span>
      )
    },
    { 
      key: 'download_count', 
      label: 'Downloads',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Download className="h-4 w-4 text-gray-500" />
          <span>{value || 0}</span>
        </div>
      )
    },
    { 
      key: 'expiry_date', 
      label: 'Expires',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const isExpired = new Date(value) < new Date();
        return (
          <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
            {window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()}
            {isExpired && (
              <div className="text-xs text-red-500">Expired</div>
            )}
          </div>
        );
      }
    },
    { 
      key: 'uploader.name', 
      label: 'Uploaded By',
      render: (_, row) => row.uploader?.name || '-'
    }
  ];

  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'view-hr-documents'
    },
    { 
      label: 'Download', 
      icon: 'Download', 
      action: 'download', 
      className: 'text-green-500',
      requiredPermission: 'view-hr-documents'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'edit-hr-documents'
    },
    { 
      label: 'Update Status', 
      icon: 'RefreshCw', 
      action: 'update-status', 
      className: 'text-purple-500',
      requiredPermission: 'edit-hr-documents'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'delete-hr-documents'
    }
  ];

  const categoryOptions = [
    { value: '_empty_', label: 'All Categories' , disabled: true },
    ...(categories || []).map((cat: any) => ({
      value: cat.id.toString(),
      label: cat.name
    }))
  ];

  const statusOptions = [
    { value: '_empty_', label: 'All Statuses' , disabled: true },
    { value: 'Draft', label: 'Draft' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Published', label: 'Published' },
    { value: 'Archived', label: 'Archived' },
    { value: 'Expired', label: 'Expired' }
  ];



  const categorySelectOptions = [
    { value: '_empty_', label: 'Select Category' },
    ...(categories || []).map((cat: any) => ({
      value: cat.id.toString(),
      label: cat.name
    }))
  ];

  return (
    <PageTemplate 
      title={"HR Documents"} 
      url="/hr/documents/hr-documents"
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
              name: 'category_id',
              label: 'Category',
              type: 'select',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions,
              searchable: true
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions
            },

          ]}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            router.get(route('hr.documents.hr-documents.index'), { 
              page: 1, 
              per_page: parseInt(value),
              search: searchTerm || undefined,
              category_id: categoryFilter !== '_empty_' ? categoryFilter : undefined,
              status: statusFilter !== '_empty_' ? statusFilter : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={hrDocuments?.data || []}
          from={hrDocuments?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-hr-documents',
            create: 'create-hr-documents',
            edit: 'edit-hr-documents',
            delete: 'delete-hr-documents'
          }}
        />

        <Pagination
          from={hrDocuments?.from || 0}
          to={hrDocuments?.to || 0}
          total={hrDocuments?.total || 0}
          links={hrDocuments?.links}
          entityName={"documents"}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        errors={errors}
        formConfig={{
          fields: [
            { 
              name: 'title', 
              label: 'Document Title', 
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
              name: 'category_id', 
              label: 'Category', 
              type: 'select', 
              required: true,
              options: categorySelectOptions.filter(opt => opt.value !== '_empty_'),
              searchable: true
            },
            { 
              name: 'file', 
              label: 'File', 
              type: 'custom',
              required: formMode === 'create',
              render: (field, formData, handleChange) => (
                <div>
                  <MediaPicker
                    value={String(formData[field.name] || formData.file_path || '')}
                    onChange={(url) => handleChange(field.name, url)}
                    placeholder={'Select document file...'}
                  />
                </div>
              ),
              helpText: 'Max file size: 10MB. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT'
            },

            { 
              name: 'effective_date', 
              label: 'Effective Date', 
              type: 'date'
            },
            { 
              name: 'expiry_date', 
              label: 'Expiry Date', 
              type: 'date'
            },
            { 
              name: 'requires_acknowledgment', 
              label: 'Requires Acknowledgment', 
              type: 'checkbox',
              helpText: 'Users must acknowledge reading this document'
            }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem ? {
          ...currentItem,
          effective_date: currentItem.effective_date ? window.appSettings.formatDateTimeSimple(currentItem.effective_date, false) : currentItem.effective_date
        } : null}
        title={
          formMode === 'create'
            ? 'Upload New Document'
            : formMode === 'edit'
              ? 'Edit Document'
              : 'View Document'
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.title || ''}
        entityName="document"
      />
      
      <CrudFormModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={handleStatusUpdate}
        formConfig={{
          fields: [
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              required: true,
              options: [
                { value: 'Draft', label: 'Draft' },
                { value: 'Under Review', label: 'Under Review' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Published', label: 'Published' },
                { value: 'Archived', label: 'Archived' },
                { value: 'Expired', label: 'Expired' }
              ]
            }
          ]
        }}
        initialData={{ status: currentItem?.status }}
        title={'Update Document Status'}
        mode="edit"
        errors={errors}
      />
    </PageTemplate>
  );
}