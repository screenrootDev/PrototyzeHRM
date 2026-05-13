import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';

export const planRequestsConfig: CrudConfig = {
  entity: {
    name: 'planRequests',
    endpoint: route('plan-requests.index'),
    permissions: {
      view: 'view-plan-requests',
      create: 'create-plan-requests',
      edit: 'edit-plan-requests',
      delete: 'delete-plan-requests'
    }
  },
  modalSize: '4xl',
  description: 'Manage plan upgrade requests from users',
  table: {
    columns: [
      { key: 'user.name', label: 'Name', sortable: true },
      { key: 'user.email', label: 'Email', sortable: true },
      { key: 'plan.name', label: 'Plan Name', sortable: true },
      { 
        key: 'plan.duration', 
        label: 'Plan Duration', 
        render: (value) => value === 'monthly' ? 'Monthly' : 'Yearly'
      },
      { 
        key: 'status', 
        label: 'Status', 
        render: columnRenderers.status({
          'pending': 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
          'approved': 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
          'rejected': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
        })
      },
      { 
        key: 'created_at', 
        label: 'Requested At', 
        sortable: true, 
        render: (value) => `${window.appSettings.formatDateTime(value, false)}`
      }
    ],
    actions: [
      { 
        label: 'Approve', 
        icon: 'Check', 
        action: 'approve', 
        className: 'text-green-600',
        condition: (item: any) => item.status === 'pending',
        requiredPermission: 'approve-plan-requests'
      },
      { 
        label: 'Reject', 
        icon: 'X', 
        action: 'reject', 
        className: 'text-red-600',
        condition: (item: any) => item.status === 'pending',
        requiredPermission: 'reject-plan-requests'
      }
    ]
  },
  search: {
    enabled: true,
    placeholder: 'Search plan requests...',
    fields: ['user.name', 'user.email', 'plan.name']
  },
  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ],
  form: {
    fields: []
  }
};