// config/crud/contacts.ts
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';

export const contactsConfig: CrudConfig = {
  entity: {
    name: 'contacts',
    endpoint: route('contacts.index'),
    permissions: {
      view: 'view-contacts',
      create: 'create-contacts',
      edit: 'edit-contacts',
      delete: 'delete-contacts'
    }
  },
  table: {
    columns: [
      { key: 'business.name', label: 'Business Name', sortable: false },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone' },
      { key: 'message', label: 'Message' },
      { 
        key: 'status', 
        label: 'Status', 
        sortable: true, 
        render: columnRenderers.status({
          'new': 'bg-blue-100 text-blue-800',
          'contacted': 'bg-yellow-100 text-yellow-800',
          'qualified': 'bg-purple-100 text-purple-800',
          'converted': 'bg-green-100 text-green-800',
          'closed': 'bg-gray-100 text-gray-800'
        })
      }
    ],
    actions: [
      { 
        label: 'Reply', 
        icon: 'MessageSquare', 
        action: 'reply', 
        className: 'text-blue-500',
        requiredPermission: 'edit-contacts'
      },
      { 
        label: 'Delete', 
        icon: 'Trash2', 
        action: 'delete', 
        className: 'text-red-500',
        requiredPermission: 'delete-contacts'
      }
    ]
  },
  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'converted', label: 'Converted' },
        { value: 'closed', label: 'Closed' }
      ]
    }
  ],
  form: {
    fields: [
      { name: 'business_id', label: 'Business', type: 'select', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'message', label: 'Message', type: 'textarea' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'new', label: 'New' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'qualified', label: 'Qualified' },
          { value: 'converted', label: 'Converted' },
          { value: 'closed', label: 'Closed' }
        ]
      },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  }
};