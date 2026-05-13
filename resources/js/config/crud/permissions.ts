// config/crud/permissions.ts
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';

export const permissionsConfig: CrudConfig = {
  entity: {
    name: 'permissions',
    endpoint: route('permissions.index'),
    permissions: {
      view: 'view-permissions',
      create: 'create-permissions',
      edit: 'edit-permissions',
      delete: 'delete-permissions'
    }
  },
  description: 'Manage system permissions for different modules',
  table: {
    columns: [
      { 
        key: 'module', 
        label: 'Module', 
        sortable: true,
        render: columnRenderers.status({
          ['Products']: 'bg-blue-100 text-blue-800',
          ['Categories']: 'bg-green-100 text-green-800',
          ['Contacts']: 'bg-purple-100 text-purple-800',
          ['Permissions']: 'bg-amber-100 text-amber-800',
          ['Roles']: 'bg-red-100 text-red-800',
          ['Users']: 'bg-indigo-100 text-indigo-800'
        })
      },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'label', label: 'Label', sortable: true },
      { key: 'description', label: 'Description' },
      { 
        key: 'created_at', 
        label: 'Created At', 
        sortable: true, 
        render: (value) => `${window.appSettings.formatDateTime(value, false)}` 
      }
    ],
    actions: [
      { 
        label: 'View', 
        icon: 'Eye', 
        action: 'view', 
        className: 'text-blue-500',
        requiredPermission: 'view-permissions'
      },
      { 
        label: 'Edit', 
        icon: 'Edit', 
        action: 'edit', 
        className: 'text-amber-500',
        requiredPermission: 'edit-permissions'
      },
      { 
        label: 'Delete', 
        icon: 'Trash2', 
        action: 'delete', 
        className: 'text-red-500',
        requiredPermission: 'delete-permissions'
      }
    ]
  },
  filters: [
    {
      key: 'module',
      label: 'Module',
      type: 'select',
      options: []
    }
  ],
  form: {
    fields: [
      { name: 'module', label: 'Module', type: 'text', required: true },
      { 
        name: 'label', 
        label: 'Label', 
        type: 'text', 
        required: true, 
        description: 'The name field will be automatically generated from this label' 
      },
      { name: 'description', label: 'Description', type: 'textarea' }
    ]
  }
};