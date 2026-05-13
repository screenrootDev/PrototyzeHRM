// config/crud/roles.ts
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';

export const rolesConfig: CrudConfig = {
  entity: {
    name: 'roles',
    endpoint: route('roles.index'),
    permissions: {
      view: 'view-roles',
      create: 'create-roles',
      edit: 'edit-roles',
      delete: 'delete-roles'
    }
  },
  modalSize: '5xl',
  description: 'Manage user roles and their permissions',
  table: {
    columns: [
      { key: 'label', label: 'Name', sortable: true },
      { key: 'name', label: 'Slug', sortable: true },
      { key: 'description', label: 'Description' }
      // Permissions column will be added dynamically in the Roles component
    ],
    actions: [
      { 
        label: 'View', 
        icon: 'Eye', 
        action: 'view', 
        className: 'text-blue-500',
        requiredPermission: 'view-roles'
      },
      { 
        label: 'Edit', 
        icon: 'Edit', 
        action: 'edit', 
        className: 'text-amber-500',
        requiredPermission: 'edit-roles'
      },
      { 
        label: 'Delete', 
        icon: 'Trash2', 
        action: 'delete', 
        className: 'text-red-500',
        requiredPermission: 'delete-roles',
        condition: (row) => !row.is_system_role
      }
    ]
  },
  filters: [],
  form: {
    fields: [
      { name: 'label', label: 'Role Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' }
      // Permissions field will be added dynamically in the Roles component
    ]
  }
};