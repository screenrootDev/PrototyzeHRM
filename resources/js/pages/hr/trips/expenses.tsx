// pages/hr/trips/expenses.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

import { Plus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MediaPicker from '@/components/MediaPicker';

export default function TripExpenses() {
  
  const { auth, trip, expenses } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  // State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
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
      case 'download-receipt':
        window.open(route('hr.trips.expenses.download-receipt', [trip.id, item.id]), '_blank');
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
      toast.loading('Adding expense...');

      router.post(route('hr.trips.expenses.store', trip.id), data, {
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
            toast.error(`Failed to add expense: ${Object.values(errors).join(', ')}`);          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading('Updating expense...');
      
      router.put(route('hr.trips.expenses.update', [trip.id, currentItem.id]), data, {
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
            toast.error(`Failed to update expense: ${Object.values(errors).join(', ')}`);          }
        }
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading('Deleting expense...');
    
    router.delete(route('hr.trips.expenses.destroy', [trip.id, currentItem.id]), {
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
          toast.error(`Failed to delete expense: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };

  // Define page actions
  const pageActions = [];
  
  // Add the "Back to Trips" button
  pageActions.push({
    label: 'Back to Trips',
    icon: <ArrowLeft className="h-4 w-4 mr-2" />,
    variant: 'outline',
    onClick: () => router.get(route('hr.trips.index'))
  });
  
  // Add the "Add Expense" button if user has permission
  if (hasPermission(permissions, 'manage-trip-expenses')) {
    pageActions.push({
      label: 'Add Expense',
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'HR Management', href: route('hr.trips.index') },
    { title: 'Trips', href: route('hr.trips.index') },
    { title: 'Trip Expenses' }
  ];

  // Define table columns
  const columns = [
    { 
      key: 'expense_type', 
      label: 'Type',
      render: (value, _, index) => value || '-'
    },
    { 
      key: 'expense_date', 
      label: 'Date',
      render: (value) => value ? (window.appSettings?.formatDateTimeSimple(value,false) || new Date(value).toLocaleString()) : '-'
    },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (value) => value || '-'
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (value) => value || '-'
    },
    { 
      key: 'is_reimbursable', 
      label: 'Reimbursable',
      render: (value) => value ? (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          {'Yes'}
        </span>
      ) : (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {'No'}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => {
        const statusClasses = {
          'pending': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
          'approved': 'bg-green-50 text-green-700 ring-green-600/20',
          'rejected': 'bg-red-50 text-red-700 ring-red-600/20'
        };
        
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses[value] || ''}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    { 
      key: 'receipt', 
      label: 'Receipt',
      render: (value, row) => value && value.trim() !== '' ? (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center text-blue-500"
          onClick={(e) => {
            e.stopPropagation();
            handleAction('download-receipt', row);
          }}
        >
          {'View Receipt'}
        </Button>
      ) : '-'
    }
  ];

  // Define table actions
  const actions = [
    { 
      label: 'View', 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500',
      requiredPermission: 'manage-trip-expenses'
    },
    { 
      label: 'Edit', 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500',
      requiredPermission: 'manage-trip-expenses'
    },
    { 
      label: 'Delete', 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500',
      requiredPermission: 'manage-trip-expenses'
    }
  ];

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const totalReimbursable = expenses
    .filter(expense => expense.is_reimbursable)
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <PageTemplate 
      title={`${"Trip Expenses"} - ${trip.purpose}`} 
      url="/hr/trips/expenses"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      {/* Trip details card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{'Trip Details'}</CardTitle>
          <CardDescription>{'Information about the trip'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">{'Employee'}</div>
              <div>{trip.employee?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{'Destination'}</div>
              <div>{trip.destination || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{'Purpose'}</div>
              <div>{trip.purpose || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{'Start Date'}</div>
              <div>{trip.start_date ? (window.appSettings?.formatDateTimeSimple(trip.start_date,false) || new Date(trip.start_date).toLocaleString()) : '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{'End Date'}</div>
              <div>{trip.end_date ? (window.appSettings?.formatDateTimeSimple(trip.end_date,false) || new Date(trip.end_date).toLocaleString()) : '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{'Status'}</div>
              <div>{trip.status ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1) : '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense summary card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{'Expense Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-700">{'Total Expenses'}</div>
              <div className="text-2xl font-bold text-blue-900">{totalExpenses.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-700">{'Reimbursable'}</div>
              <div className="text-2xl font-bold text-green-900">{totalReimbursable.toFixed(2)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-700">{'Advance Amount'}</div>
              <div className="text-2xl font-bold text-purple-900">{(trip.advance_amount || 0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses table */}
      <Card>
        <CardHeader>
          <CardTitle>{'Expense List'}</CardTitle>
        </CardHeader>
        <CardContent>
          <CrudTable
            columns={columns}
            actions={actions}
            data={expenses || []}
            from={1}
            onAction={handleAction}
            permissions={permissions}
            entityPermissions={{
              view: 'manage-trip-expenses',
              create: 'manage-trip-expenses',
              edit: 'manage-trip-expenses',
              delete: 'manage-trip-expenses'
            }}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { 
              name: 'expense_type', 
              label: 'Expense Type', 
              type: 'select',
              required: true,
              options: [
                { value: 'Transportation', label: 'Transportation' },
                { value: 'Accommodation', label: 'Accommodation' },
                { value: 'Meals', label: 'Meals' },
                { value: 'Registration Fees', label: 'Registration Fees' },
                { value: 'Entertainment', label: 'Entertainment' },
                { value: 'Miscellaneous', label: 'Miscellaneous' }
              ]
            },
            { 
              name: 'expense_date', 
              label: 'Expense Date', 
              type: 'date', 
              required: true,
              // Don't use min/max as they can cause type conversion issues
              // Instead, we'll validate on the server side
            },
            { 
              name: 'amount', 
              label: 'Amount', 
              type: 'number',
              required: true,
              min: 0,
              step: 0.01
            },

            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea' 
            },
            { 
              name: 'receipt', 
              label: 'Receipt', 
              type: 'custom',
              render: (field, formData, handleChange) => (
                <MediaPicker
                  value={String(formData[field.name] || '')}
                  onChange={(url) => handleChange(field.name, url)}
                  placeholder={'Select receipt file...'}
                />
              )
            },
            { 
              name: 'is_reimbursable', 
              label: 'Reimbursable', 
              type: 'checkbox',
              defaultValue: true
            },
            ...(formMode === 'edit' && hasPermission(permissions, 'approve-trip-expenses') ? [
              { 
                name: 'status', 
                label: 'Status', 
                type: 'select',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]
              }
            ] : [])
          ],
          modalSize: 'md'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? 'Add New Expense'
            : formMode === 'edit'
              ? 'Edit Expense'
              : 'View Expense'
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`${currentItem?.expense_type || ''} - ${currentItem?.amount || ''}`}
        entityName="expense"
      />
    </PageTemplate>
  );
}