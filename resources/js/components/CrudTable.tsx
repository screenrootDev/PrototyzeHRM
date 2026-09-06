// components/CrudTable.tsx
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import * as LucidIcons from 'lucide-react';
import * as AnimateIcons from '@animateicons/react/lucide';
import { hasPermission } from '@/utils/authorization';
import { TableColumn, TableAction } from '@/types/crud';
import { Link } from '@inertiajs/react';
import React, { useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const AnimatedTableActionButton = ({ iconName, label, onClick, className, href, openInNewTab }: any) => {
  const iconRef = useRef<any>(null);
  const Icon = (AnimateIcons as any)[iconName + 'Icon'] || (LucidIcons as any)[iconName];
  
  const buttonContent = (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 group", className)}
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
    >
      <div className="transition-transform duration-300 group-hover:scale-125 flex items-center justify-center">
        <Icon ref={iconRef} size={16} isAnimated={true} />
      </div>
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {href ? (
            <Link href={href} target={openInNewTab ? '_blank' : undefined}>
              {buttonContent}
            </Link>
          ) : (
            buttonContent
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


interface CrudTableProps {
  columns: TableColumn[];
  actions: TableAction[];
  data: any[];
  from: number;
  onAction: (action: string, row: any) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  statusColors?: Record<string, string>;
  permissions: string[];
  entityPermissions?: {
    view: string;
    edit: string;
    delete: string;
  };
  showActionsAsIcons?: boolean;
  showActions?: boolean;
  showRowNumber?: boolean;
  emptyState?: React.ReactNode;
  selectable?: boolean;
  selectedRows?: Array<number | string>;
  onSelectionChange?: (selectedRows: Array<number | string>) => void;
}

export function CrudTable({
  columns,
  actions,
  data,
  from,
  onAction,
  sortField,
  sortDirection,
  onSort,
  statusColors = {},
  permissions,
  entityPermissions,
  showActions = true,
  showRowNumber = true,
  emptyState,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
}: CrudTableProps) {
  const rowIds = data.map((row) => row.id).filter((id) => id !== undefined && id !== null);
  const allRowsSelected = rowIds.length > 0 && rowIds.every((id) => selectedRows.includes(id));
  const someRowsSelected = rowIds.some((id) => selectedRows.includes(id)) && !allRowsSelected;

  const toggleAllRows = (checked: boolean) => {
    onSelectionChange?.(checked ? rowIds : []);
  };

  const toggleRow = (rowId: number | string, checked: boolean) => {
    onSelectionChange?.(
      checked
        ? Array.from(new Set([...selectedRows, rowId]))
        : selectedRows.filter((id) => id !== rowId)
    );
  };
  
  const renderSortIcon = (column: TableColumn) => {
    if (!column.sortable) return null;

    if (sortField === column.key) {
      return sortDirection === 'asc' ?
        <ChevronUp className="ml-1 h-4 w-4" /> :
        <ChevronDown className="ml-1 h-4 w-4" />;
    }

    return <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />;
  };

  const handleSort = (column: TableColumn) => {
    if (!column.sortable || !onSort) return;
    onSort(column.key);
  };
  const hasAnyActionPermission = actions.some((action) => {
    const permissionKey =
      action.requiredPermission ||
      (entityPermissions &&
        (action.action === 'view'
          ? entityPermissions.view
          : action.action === 'edit'
            ? entityPermissions.edit
            : action.action === 'delete'
              ? entityPermissions.delete
              : action.permission));

    return !permissionKey || hasPermission(permissions, permissionKey);
  });
  const renderActionButtons = (row: any) => {
    return (
      <div className="flex items-center justify-end space-x-2">
        {actions.map((action, index) => {
          // Skip if user doesn't have permission
          const permissionKey = action.requiredPermission || (
            entityPermissions && (
              action.action === 'view'
                ? entityPermissions.view
                : action.action === 'edit'
                  ? entityPermissions.edit
                  : action.action === 'delete'
                    ? entityPermissions.delete
                    : action.permission
            )
          );

          if (permissionKey && !hasPermission(permissions, permissionKey)) {
            return null;
          }

          // Skip if condition function returns false
          if (action.condition && !action.condition(row)) {
            return null;
          }

          const IconComponent = (LucidIcons as any)[action.icon] as React.ElementType;

          // Handle link actions
          if (action.href) {
            const href = typeof action.href === 'function'
              ? action.href(row)
              : action.href.replace(':id', row.id);

            if (action.animated !== false) {
              return (
                <AnimatedTableActionButton 
                  key={index}
                  iconName={action.icon}
                  label={action.label}
                  href={href}
                  openInNewTab={action.openInNewTab}
                  className={action.className}
                />
              );
            }

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={href} target={action.openInNewTab ? '_blank' : undefined}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", action.className)}
                      >
                        <IconComponent size={16} />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          if (action.animated !== false) {
            return (
              <AnimatedTableActionButton 
                key={index}
                iconName={action.icon}
                label={action.label}
                onClick={() => onAction(action.action || '', row)}
                className={action.className}
              />
            );
          }

          // Handle regular action buttons
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", action.className)}
                    onClick={() => onAction(action.action || '', row)}
                  >
                    <IconComponent size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  // Helper function to get nested property value using dot notation
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return null;

    const keys = path.split('.');
    return keys.reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj);
  };

  const renderCellContent = (row: any, col: TableColumn) => {
    // Get value using dot notation for nested properties
    const value = getNestedValue(row, col.key);

    // If column has custom render function, use it
    if (col.render) {
      return col.render(value, row);
    }

    // Handle different column types
    switch (col.type) {
      case 'badge':
        return (
          <Badge className={cn("capitalize", statusColors[value])}>
            {value}
          </Badge>
        );

      case 'image':
        if (!value) {
          return <div className="text-center text-gray-400">{"No image"}</div>;
        }
        return (
          <div className="flex justify-center">
            <img
              src={value.startsWith && value.startsWith('http')
                ? value
                : `/storage/${value}`}
              alt={row.name || 'Image'}
              className={col.className || "h-16 w-20 rounded-md object-cover shadow-sm"}
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/200x150?text=Image+Not+Found';
              }}
            />
          </div>
        );

      case 'date':
        return value ? <span className="text-sm">{new Date(value).toLocaleDateString()}</span> : <span>-</span>;

      case 'currency':
        return <span className="text-sm">{typeof value === 'number' ?
          value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) :
          value}</span>;

      case 'boolean':
        return <span className="text-sm">{value ? 'Yes' : 'No'}</span>;

      case 'link':
        if (!value) return <span>-</span>;

        const href = col.href
          ? (typeof col.href === 'function' ? col.href(row) : col.href.replace(':id', row.id))
          : '#';

        return (
          <Link
            href={href}
            className={col.linkClassName || "text-blue-600 hover:underline"}
            target={col.openInNewTab ? '_blank' : undefined}
          >
            {value}
          </Link>
        );

      default:
        return <span className="text-sm font-medium">{value || '-'}</span>;
    }
  };

  return (
    <div className="border-collapse dark:bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F0F0F1] dark:bg-gray-800 border-b hover:!bg-[#F0F0F1] dark:hover:!bg-gray-800">
            {selectable && (
              <TableHead className="w-12 py-2.5 text-center">
                <Checkbox
                  checked={allRowsSelected ? true : someRowsSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => toggleAllRows(checked === true)}
                  aria-label="Select all rows on this page"
                />
              </TableHead>
            )}
            {showRowNumber && <TableHead className="w-12 py-2.5 font-semibold">#</TableHead>}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "py-2.5 font-semibold text-left",
                  column.sortable && "cursor-pointer select-none",
                  column.className
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center">
                  {column.label}
                  {renderSortIcon(column)}
                </div>
              </TableHead>
            ))}
            {showActions && hasAnyActionPermission && <TableHead className="w-24 py-2.5 text-center font-semibold">{'Actions'}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <TableRow key={row.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 border-b">
                {selectable && (
                  <TableCell className="py-2.5 text-center">
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onCheckedChange={(checked) => toggleRow(row.id, checked === true)}
                      aria-label={`Select ${row.name || 'row'}`}
                    />
                  </TableCell>
                )}
                {showRowNumber && <TableCell className="font-medium py-2.5">{from + index}</TableCell>}
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      "py-2.5 text-left",
                      col.className
                    )}
                  >
                    {renderCellContent(row, col)}
                  </TableCell>
                ))}
                {showActions && hasAnyActionPermission && <TableCell className="py-2.5 text-right">{renderActionButtons(row)}</TableCell>}
              </TableRow>
            ))
          ) : (
            <TableRow>
              {/* <TableCell 
                colSpan={columns.length + 2} 
                className="h-24 text-center text-muted-foreground dark:text-gray-400"
              >
                {"No results found."}
              </TableCell> */}
              <TableCell
                colSpan={columns.length + (showActions && hasAnyActionPermission ? 1 : 0) + (showRowNumber ? 1 : 0) + (selectable ? 1 : 0)}
                className="text-muted-foreground h-24 text-center dark:text-gray-400 p-0"
              >
                {emptyState ? emptyState : 'No results found.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
