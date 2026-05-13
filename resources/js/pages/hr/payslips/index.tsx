// pages/hr/payslips/index.tsx
import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Download, FileText } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';

import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function Payslips() {
  
  const { auth, payslips, employees, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedEmployee, setSelectedEmployee] = useState(pageFilters.employee_id || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [dateFrom, setDateFrom] = useState(pageFilters.date_from || '');
  const [dateTo, setDateTo] = useState(pageFilters.date_to || '');
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedEmployee !== 'all' || selectedStatus !== 'all' || dateFrom !== '' || dateTo !== '';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedEmployee !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('hr.payslips.index'), {
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('hr.payslips.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    switch (action) {
      case 'download':
        handleDownload(item);
        break;
    }
  };

  const handleDownload = (payslip: any) => {
    toast.loading('Downloading payslip...');

    window.location.href = route('hr.payslips.download', payslip.id);
    
    // Clear loading toast and refresh data after download
    setTimeout(() => {
      toast.dismiss();
      toast.success('Payslip downloaded successfully');
      router.reload({ only: ['payslips'] });
    }, 100);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmployee('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);

    router.get(route('hr.payslips.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];

  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Payroll Management', href: route('hr.payslips.index') },
    { title: 'Payslips' }
  ];

  // Define table columns
  const columns = [
    {
      key: 'payslip_number',
      label: 'Payslip Number',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-blue-600">{value}</span>
      )
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (value: any, row: any) => row.employee?.name || '-'
    },
    {
      key: 'pay_period',
      label: 'Pay Period',
      render: (value: any, row: any) => (
        <div className="text-sm">
          <div>{window.appSettings?.formatDateTimeSimple(row.pay_period_start, false) || new Date(row.pay_period_start).toLocaleDateString()}</div>
          <div className="text-gray-500">to {window.appSettings?.formatDateTimeSimple(row.pay_period_end, false) || new Date(row.pay_period_end).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      key: 'pay_date',
      label: 'Pay Date',
      sortable: true,
      render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    },
    {
      key: 'net_pay',
      label: 'Net Pay',
      render: (value: any, row: any) => (
        <span className="font-mono text-green-600">
          {window.appSettings?.formatCurrency(row.payroll_entry?.net_pay || 0)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const statusColors = {
          generated: 'bg-blue-50 text-blue-700 ring-blue-600/20',
          sent: 'bg-green-50 text-green-700 ring-green-600/20',
          downloaded: 'bg-purple-50 text-purple-700 ring-purple-600/20'
        };
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[value as keyof typeof statusColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Generated On',
      sortable: true,
      render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  // Define table actions
  const actions = [
    {
      label: 'Download PDF',
      icon: 'Download',
      action: 'download',
      className: 'text-blue-500',
      requiredPermission: 'download-payslips'
    }
  ];

  // Prepare options for filters
  const employeeOptions = [
    { value: 'all', label: 'All Employees' },
    ...(employees || []).map((emp: any) => ({
      value: emp.id.toString(),
      label: emp.name
    }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'generated', label: 'Generated' },
    { value: 'sent', label: 'Sent' },
    { value: 'downloaded', label: 'Downloaded' }
  ];

  return (
    <PageTemplate
      title={"Payslips"}
      url="/hr/payslips"
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
              name: 'employee_id',
              label: 'Employee',
              type: 'select',
              value: selectedEmployee,
              onChange: setSelectedEmployee,
              options: employeeOptions
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
              name: 'date_from',
              label: 'Period From',
              type: 'date',
              value: dateFrom,
              onChange: setDateFrom
            },
            {
              name: 'date_to',
              label: 'Period To',
              type: 'date',
              value: dateTo,
              onChange: setDateTo
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
            router.get(route('hr.payslips.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
              employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={payslips?.data || []}
          from={payslips?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-payslips',
            create: 'create-payslips',
            edit: 'edit-payslips',
            delete: 'delete-payslips'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={payslips?.from || 0}
          to={payslips?.to || 0}
          total={payslips?.total || 0}
          links={payslips?.links}
          entityName={"payslips"}
          onPageChange={(url) => router.get(url)}
        />
      </div>
    </PageTemplate>
  );
}