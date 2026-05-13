// config/crud/currencies.ts
import { CrudConfig } from '@/types/crud';

export const currenciesConfig: CrudConfig = {
  entity: {
    name: 'currencies',
    endpoint: route('currencies.index'),
    permissions: {
      view: 'manage-currencies',
      create: 'manage-currencies',
      edit: 'manage-currencies',
      delete: 'manage-currencies'
    }
  },
  table: {
    columns: [
      { 
        key: 'name', 
        label: 'Name', 
        sortable: true 
      },
      { 
        key: 'code', 
        label: 'Code', 
        sortable: true 
      },
      { 
        key: 'symbol', 
        label: 'Symbol', 
        sortable: true 
      },
      { 
        key: 'description', 
        label: 'Description' 
      },
      { 
        key: 'is_default', 
        label: 'Default', 
        type: 'boolean'
      }
    ],
    actions: [
      { 
        label: 'Edit', 
        icon: 'Edit', 
        action: 'edit', 
        className: 'text-amber-500',
        requiredPermission: 'manage-currencies'
      },
      { 
        label: 'Delete', 
        icon: 'Trash2', 
        action: 'delete', 
        className: 'text-red-500',
        requiredPermission: 'manage-currencies',
        condition: (row) => !row.is_default // Don't allow deleting default currency
      }
    ]
  },
  filters: [],
  form: {
    fields: [
      { 
        name: 'name', 
        label: 'Currency Name', 
        type: 'text', 
        required: true 
      },
      { 
        name: 'code', 
        label: 'Currency Code', 
        type: 'text', 
        required: true,
        placeholder: 'e.g. USD, EUR, GBP'
      },
      { 
        name: 'symbol', 
        label: 'Currency Symbol', 
        type: 'text', 
        required: true,
        placeholder: 'e.g. $, €, £'
      },
      { 
        name: 'description', 
        label: 'Description', 
        type: 'textarea' 
      },
      { 
        name: 'is_default', 
        label: 'Set as Default Currency', 
        type: 'checkbox' 
      }
    ]
  }
};