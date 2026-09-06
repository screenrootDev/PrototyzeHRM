/**
 * Pagination component with dark mode support
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';


interface PaginationProps {
  from?: number;
  to?: number;
  total?: number;
  links?: any[];
  currentPage?: number;
  lastPage?: number;
  entityName?: string;
  onPageChange?: (url: string) => void;
  className?: string;
  perPage?: string | number;
  perPageOptions?: Array<string | number>;
  onPerPageChange?: (value: string) => void;
}

export function Pagination({
  from = 0,
  to = 0,
  total = 0,
  links = [],
  currentPage,
  lastPage,
  entityName = 'items',
  onPageChange,
  className = '',
  perPage,
  perPageOptions = [10, 25, 50, 100],
  onPerPageChange,
}: PaginationProps) {
  const queryPerPage = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('per_page')
    : null;
  const resolvedPerPage = String(perPage ?? queryPerPage ?? 10);

  const handlePerPageChange = (value: string) => {
    if (onPerPageChange) {
      onPerPageChange(value);
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('per_page', value);
    url.searchParams.set('page', '1');
    router.get(`${url.pathname}?${url.searchParams.toString()}`, {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (url: string) => {
    if (onPageChange) {
      onPageChange(url);
    } else if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className={cn(
      "p-4  dark:border-gray-700 flex items-center justify-between dark:bg-gray-900",
      className
    )}>
      <div className="text-sm text-muted-foreground dark:text-gray-300">
        {"Showing"} <span className="font-medium dark:text-white">{from}</span> {"to"}{" "}
        <span className="font-medium dark:text-white">{to}</span> {"of"}{" "}
        <span className="font-medium dark:text-white">{total}</span> {entityName}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground dark:text-gray-300">Rows per page:</span>
          <Select value={resolvedPerPage} onValueChange={handlePerPageChange}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {perPageOptions.map((option) => (
                <SelectItem key={String(option)} value={String(option)}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1">
        {links && links.length > 0 ? (
          links.map((link: any, i: number) => {
            // Check if the link is "Next" or "Previous" to use text instead of icon
            const isTextLink = link.label === "&laquo; Previous" || link.label === "Next &raquo;";
            const label = link.label.replace("&laquo; ", "").replace(" &raquo;", "");

            return (
              <Button
                key={`pagination-${i}-${link.label}`}
                variant={link.active ? 'default' : 'outline'}
                size={isTextLink ? "sm" : "icon"}
                className={isTextLink ? "px-3" : "h-8 w-8"}
                disabled={!link.url}
                onClick={() => link.url && handlePageChange(link.url)}
              >
                {isTextLink ? label : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
              </Button>
            );
          })
        ) : (
          // Simple pagination if links are not available
          currentPage && lastPage && lastPage > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(`?page=${currentPage - 1}`)}
              >
                {"Previous"}
              </Button>
              <span className="px-3 py-1 dark:text-white">
                {currentPage} of {lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage}
                onClick={() => handlePageChange(`?page=${currentPage + 1}`)}
              >
                {"Next"}
              </Button>
            </>
          )
        )}
        </div>
      </div>
    </div>
  );
}
