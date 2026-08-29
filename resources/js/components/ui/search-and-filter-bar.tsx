import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Filter, Search, List, LayoutGrid, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';


interface FilterOption {
  name: string;
  label: string;
  type: 'select' | 'date';
  options?: { value: string; label: string; disabled?: boolean }[];
  value: string | Date | undefined;
  onChange: (value: any) => void;
  searchable?: boolean;
  inline?: boolean;
}

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  filters?: FilterOption[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: () => boolean;
  activeFilterCount: () => number;
  onResetFilters: () => void;
  onApplyFilters?: () => void;
  perPageOptions?: number[];
  currentPerPage: string;
  onPerPageChange: (value: string) => void;
  // View toggle props
  showViewToggle?: boolean;
  activeView?: 'list' | 'grid';
  onViewChange?: (view: 'list' | 'grid') => void;
  placeholder?: string;
}

export function SearchAndFilterBar({
  searchTerm,
  onSearchChange,
  onSearch,
  filters = [],
  showFilters,
  setShowFilters,
  hasActiveFilters,
  activeFilterCount,
  onResetFilters,
  onApplyFilters,
  perPageOptions = [10, 25, 50, 100],
  currentPerPage,
  onPerPageChange,
  // View toggle props
  showViewToggle = false,
  activeView = 'list',
  onViewChange,
  placeholder = "Search Employees...",
}: SearchAndFilterBarProps) {
  

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn("w-full pl-10", searchTerm ? "pr-10" : "")}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setTimeout(() => {
                      if (onSearch) {
                        const form = document.createElement('form');
                        onSearch({ preventDefault: () => {}, target: form } as unknown as React.FormEvent);
                      }
                    }, 0);
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {filters.filter((filter) => filter.inline).map((filter) => (
          <div key={filter.name} className="w-[180px] shrink-0">
            {filter.type === 'select' && filter.options && (
              <Select value={filter.value as string} onValueChange={filter.onChange}>
                <SelectTrigger className="h-10 w-full bg-white" aria-label={filter.label}>
                  <SelectValue placeholder={`All ${filter.label}s`} />
                </SelectTrigger>
                <SelectContent searchable={filter.searchable}>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value || 'empty'} value={option.value || '_empty_'} disabled={option.disabled}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        <div className="flex items-center gap-3">
          {showViewToggle && onViewChange && (
            <div className="flex items-center bg-gray-100 p-1 rounded-md">
              <Button 
                size="icon" 
                variant="ghost"
                type="button"
                className={cn(
                  "h-8 w-8 rounded-sm transition-all",
                  activeView === 'list' 
                    ? "bg-white shadow-sm text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onViewChange('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                type="button"
                className={cn(
                  "h-8 w-8 rounded-sm transition-all",
                  activeView === 'grid' 
                    ? "bg-white shadow-sm text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onViewChange('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Select
              value={currentPerPage}
              onValueChange={onPerPageChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.length > 0 && (
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
              </Button>
              {hasActiveFilters() && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {activeFilterCount()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {showFilters && filters.length > 0 && (
        <div className="p-6 bg-blue-50/30 border-t mt-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filters.filter((filter) => !filter.inline).map((filter) => (
              <div key={filter.name}>
                <Label className="block text-sm font-medium text-gray-700 mb-2">{filter.label}</Label>
                {filter.type === 'select' && filter.options && (
                  <Select
                    value={filter.value as string}
                    onValueChange={filter.onChange}
                  >
                    <SelectTrigger className="w-full h-10 bg-white">
                      <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent searchable={filter.searchable}>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value || 'empty'} value={option.value || '_empty_'} disabled={option.disabled}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === 'date' && (
                  <div className="w-full">
                    <DatePicker
                      selected={filter.value as Date | undefined}
                      onSelect={filter.onChange}
                      onChange={filter.onChange}
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-end gap-2">
              {onApplyFilters && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                  onClick={onApplyFilters}
                >
                  Apply
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={onResetFilters}
                disabled={!hasActiveFilters()}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
