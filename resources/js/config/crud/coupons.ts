// config/crud/coupons.ts
import React from 'react';
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/custom-toast';
import { router } from '@inertiajs/react';

// Separate component for status toggle to properly handle hooks
const StatusToggle = ({ initialValue, rowId }: { initialValue: boolean, rowId: number }) => {
  const [isChecked, setIsChecked] = React.useState(initialValue);

  const handleToggle = () => {
    toast.loading(`${isChecked ? 'Deactivating' : 'Activating'} coupon...`);

    // Use Inertia router for consistent error handling
    router.put(route('coupons.toggle-status', rowId), {}, {
      onSuccess: (page: any) => {
        toast.dismiss();
        setIsChecked(!isChecked);
        
        if (page.props.flash?.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash?.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);        } else {
          toast.error(`Failed to update coupon status: ${Object.values(errors).join(', ')}`);        }
      }
    });
  };

  return React.createElement('div', { className: 'flex items-center justify-center' }, [
    React.createElement(Switch, {
      key: 'status-switch',
      checked: isChecked,
      onCheckedChange: handleToggle
    })
  ]);
};

export const couponsConfig: CrudConfig = {
  entity: {
    name: 'coupons',
    endpoint: route('coupons.index'),
    permissions: {
      view: 'view-coupons',
      create: 'create-coupons',
      edit: 'create-coupons',
      delete: 'delete-coupons'
    }
  },
  modalSize: '4xl',
  description: 'Manage discount coupons and promotional codes',
  table: {
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        render: (value) => {
          const className = value === 'percentage'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800';
          return value === 'percentage' ? 'Percentage' : 'Flat Amount';
        }
      },
      {
        key: 'minimum_spend',
        label: 'Min Spend',
        render: (value) => value ? (window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}`) : '-'
      },
      {
        key: 'maximum_spend',
        label: 'Max Spend',
        render: (value) => value ? (window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}`) : '-'
      },
      {
        key: 'discount_amount',
        label: 'Discount',
        render: (value, row) => {
          const amount = parseFloat(value);
          return row.type === 'percentage'
            ? `${amount}%`
            : (window.appSettings?.formatCurrency(amount) || `$${amount.toFixed(2)}`);
        }
      },
      { key: 'use_limit_per_coupon', label: 'Coupon Limit', render: (value) => value || 'Unlimited' },
      { key: 'use_limit_per_user', label: 'User Limit', render: (value) => value || 'Unlimited' },
      {
        key: 'expiry_date',
        label: 'Expiry Date',
        sortable: true,
        render: (value) => `${window.appSettings.formatDateTime(value, false)}`
      },
      { key: 'code', label: 'Code', sortable: true },
      {
        key: 'status',
        label: 'Status',
        render: (value, row) => {
          // Use a component to properly handle hooks
          return React.createElement(StatusToggle, { initialValue: !!value, rowId: row.id });
        }
      }
    ],
    actions: [
      {
        label: 'View Details',
        icon: 'Eye',
        action: 'view-details',
        href: (row: any) => route('coupons.show', row.id),
        className: 'text-blue-500'
      },
      {
        label: 'Edit',
        icon: 'Edit',
        action: 'edit',
        className: 'text-amber-500'
      },
      {
        label: 'Delete',
        icon: 'Trash2',
        action: 'delete',
        className: 'text-red-500'
      }
    ]
  },
  search: {
    enabled: true,
    placeholder: 'Search coupons...',
    fields: ['name', 'code']
  },
  filters: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'percentage', label: 'Percentage' },
        { value: 'flat', label: 'Flat Amount' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: '1', label: 'Active' },
        { value: '0', label: 'Inactive' }
      ]
    }
  ],
  form: {
    fields: [
      {
        name: 'name',
        label: 'Coupon Name',
        type: 'text',
        required: true,
        colSpan: 12,
        placeholder: 'Enter coupon name'
      },
      {
        name: 'type',
        label: 'Discount Type',
        type: 'select',
        required: true,
        colSpan: 6,
        options: [
          { value: 'percentage', label: 'Percentage (%)' },
          { value: 'flat', label: 'Fixed Amount ($)' }
        ]
      },
      {
        name: 'discount_amount',
        label: 'Discount Value',
        type: 'number',
        required: true,
        colSpan: 6,
        min: 0,
        max: 99,
        step: 0.01,
        placeholder: 'Enter value'
      },
      {
        name: 'code_type',
        label: 'Code Generation',
        type: 'radio',
        required: true,
        colSpan: 12,
        options: [
          { value: 'manual', label: 'Manual Entry' },
          { value: 'auto', label: 'Auto Generate' }
        ],
        defaultValue: 'manual'
      },
      {
        name: 'code',
        label: 'Coupon Code',
        type: 'custom',
        colSpan: 12,
        render: (field: any, formData: any, onChange: any) => {
          const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 10; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            onChange('code', result);
          };

          const isAuto = formData.code_type === 'auto';

          return React.createElement('div', { className: 'space-y-2' }, [
            React.createElement('div', {
              className: isAuto ? 'flex gap-2' : '',
              key: 'input-group'
            }, isAuto ? [
              React.createElement('input'),
              React.createElement('button', {
                key: 'generate-btn',
                type: 'button',
                onClick: generateCode,
                className: 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
              }, 'Generate')
            ] : [
              React.createElement('input')
            ])
          ]);
        }
      },
      {
        name: 'minimum_spend',
        label: 'Minimum Spend ($)',
        type: 'number',
        colSpan: 6,
        min: 0,
        step: 0.01,
        placeholder: 'Optional'
      },
      {
        name: 'maximum_spend',
        label: 'Maximum Spend ($)',
        type: 'number',
        colSpan: 6,
        min: 0,
        step: 0.01,
        placeholder: 'Optional'
      },
      {
        name: 'use_limit_per_coupon',
        label: 'Total Usage Limit',
        type: 'number',
        colSpan: 6,
        min: 1,
        placeholder: 'Leave empty for unlimited'
      },
      {
        name: 'use_limit_per_user',
        label: 'Usage Limit Per User',
        type: 'number',
        colSpan: 6,
        min: 1,
        placeholder: 'Leave empty for unlimited'
      },
      {
        name: 'expiry_date',
        label: 'Expiry Date',
        type: 'date',
        colSpan: 6
      },
      {
        name: 'status',
        label: 'Status',
        type: 'switch',
        colSpan: 6,
        defaultValue: true,
        placeholder: 'Enable or disable this coupon'
      }
    ]
  }
};