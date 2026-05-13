import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ProfileMenu } from '@/components/profile-menu';

import { usePage } from '@inertiajs/react';


export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    
    const { position } = useLayout();

    return (
        <>
            <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-3">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    {position === 'left' && <SidebarTrigger className="-ml-1" />}
                    <Breadcrumbs items={breadcrumbs.map(b => ({ label: b.title, href: b.href }))} />
                </div>
                <div className="flex items-center gap-2">
                    {(usePage().props as any).isImpersonating && (
                        <form
                            method="POST"
                            action={route('impersonate.leave')}
                            style={{ display: 'inline' }}
                        >
                            <input type="hidden" name="_token" value={(usePage().props as any).csrf_token} />
                            <button 
                                type="submit"
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 cursor-pointer"
                            >
                                {"Return Back"}
                            </button>
                        </form>
                    )}

                    <ProfileMenu />
                    {position === 'right' && <SidebarTrigger className="-mr-1" />}
                </div>
            </div>
        </header>
        </>
    );
}
