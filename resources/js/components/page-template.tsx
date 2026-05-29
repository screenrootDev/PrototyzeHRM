import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { FloatingChatGpt } from '@/components/FloatingChatGpt';

export interface PageAction {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
}

export interface PageTemplateProps {
  title: string;
  description?: string;
  url: string;
  actions?: PageAction[];
  children: ReactNode;
  noPadding?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  hideTitle?: boolean;
}

export function PageTemplate({ 
  title,
  description, 
  url, 
  actions, 
  children, 
  noPadding = false,
  breadcrumbs,
  hideTitle = false
}: PageTemplateProps) {
  // Default breadcrumbs if none provided
  const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    {
      title,
      href: url,
    },
  ];

  return (
    <AppLayout breadcrumbs={pageBreadcrumbs}>
      <Head title={`${title} - ${(usePage().props as any).globalSettings?.titleText || 'HRM'}`} />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-6 bg-zinc-50 dark:bg-zinc-950">
        {/* Header with action buttons */}
        {(!hideTitle || (actions && actions.length > 0)) && (
          <div className="flex items-center justify-between">
            {hideTitle ? <div></div> : <h1 className="text-xl font-semibold">{title}</h1>}
            {actions && actions.length > 0 && (
              <div className="flex items-center gap-2">
                {actions.map((action, index) => (
                  <Button 
                    key={index}
                    variant={action.variant || 'outline'} 
                    size="sm"
                    onClick={action.onClick}
                    className="cursor-pointer"
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={noPadding ? "" : ""}>
          {children}
        </div>
      </div>
      <FloatingChatGpt />
    </AppLayout>
  );
}