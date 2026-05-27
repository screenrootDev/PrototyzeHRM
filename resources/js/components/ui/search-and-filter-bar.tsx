import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Filter, Search, List, LayoutGrid } from 'lucide-react';
import { useState } from 'react';


interface FilterOption {
  name: string;
  label: string;
  type: 'select' | 'date';
  options?: { value: string; label: string; disabled?: boolean }[];
  value: string | Date | undefined;
  onChange: (value: any) => void;
  searchable?: boolean;
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
}: SearchAndFilterBarProps) {
  

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <form onSubmit={onSearch} className="flex gap-2.5 group/search-form">
            <div className="relative w-72">
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md opacity-0 group-focus-within/search-form:opacity-100 transition-opacity" />
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none transition-colors duration-300",
                searchTerm ? "text-primary" : "text-muted-foreground/60"
              )} />
              <Input
                placeholder={"Search intelligence..."}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 h-10 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary/50 rounded-xl shadow-sm transition-all"
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="h-10 px-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold tracking-tight"
            >
              {"Search"}
            </Button>
          </form>
          
          {filters.length > 0 && (
            <div className="ml-1">
              <Button
                variant={hasActiveFilters() ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-10 px-4 rounded-xl font-bold transition-all border-border/50",
                  hasActiveFilters() 
                    ? "shadow-lg shadow-primary/20" 
                    : "bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm hover:bg-white dark:hover:bg-white/10"
                )}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className={cn("h-4 w-4 mr-2 transition-transform", showFilters && "rotate-180")} />
                {showFilters ? 'Hide Filters' : 'Filters'}
                {hasActiveFilters() && (
                  <div className="ml-2 relative flex items-center justify-center h-5 w-5">
                    <div className="absolute inset-0 bg-primary-foreground/40 rounded-full animate-ping" />
                    <span className="relative bg-primary-foreground text-primary rounded-full w-full h-full flex items-center justify-center text-[10px] font-black">
                      {activeFilterCount()}
                    </span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showViewToggle && onViewChange && (
            <div className="flex items-center bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
              <Button 
                size="icon" 
                variant="ghost"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  activeView === 'list' 
                    ? "bg-white dark:bg-gray-800 shadow-sm text-primary" 
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
                onClick={() => onViewChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  activeView === 'grid' 
                    ? "bg-white dark:bg-gray-800 shadow-sm text-primary" 
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
                onClick={() => onViewChange('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest whitespace-nowrap">{"Items Per Page"}</Label>
            <Select
              value={currentPerPage}
              onValueChange={onPerPageChange}
            >
              <SelectTrigger className="w-20 h-10 rounded-xl bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm border-border/50 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                {perPageOptions.map(option => (
                  <SelectItem key={option} value={option.toString()} className="text-xs font-medium focus:bg-primary/5 focus:text-primary rounded-lg mx-1 my-0.5">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {showFilters && filters.length > 0 && (
        <div className="w-full mt-4 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="flex flex-wrap gap-6 items-end relative z-10">
            {filters.map((filter) => (
              <div key={filter.name} className="space-y-2.5">
                <Label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.15em] ml-1">{filter.label}</Label>
                {filter.type === 'select' && filter.options && (
                  <Select
                    value={filter.value as string}
                    onValueChange={filter.onChange}
                  >
                    <SelectTrigger className="w-48 h-10 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 font-semibold text-sm">
                      <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent searchable={filter.searchable} className="rounded-xl border-border/50 max-h-[300px]">
                      {filter.options.map((option) => (
                        <SelectItem key={option.value || 'empty'} value={option.value || '_empty_'} disabled={option.disabled} className="text-sm font-medium focus:bg-primary/5 focus:text-primary rounded-lg mx-1 my-0.5">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === 'date' && (
                  <div className="w-48">
                    <DatePicker
                      selected={filter.value as Date | undefined}
                      onSelect={filter.onChange}
                      onChange={filter.onChange}
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-2.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-5 rounded-xl font-bold border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all"
                onClick={onResetFilters}
                disabled={!hasActiveFilters()}
              >
                {"Clear All"}
              </Button>
              
              {onApplyFilters && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                  onClick={onApplyFilters}
                >
                  {"Apply Intelligence"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}