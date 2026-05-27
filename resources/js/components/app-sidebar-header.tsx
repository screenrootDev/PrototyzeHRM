import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ProfileMenu } from '@/components/profile-menu';
import { usePage, router } from '@inertiajs/react';
import { Search, Bell, Maximize, Moon, Sun, Languages, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { MoonIcon, SunIcon, BellIcon, SearchIcon, ScanIcon } from '@animateicons/react/lucide';
import { SearchConsole } from '@/components/search-console';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { position } = useLayout();
    const { props } = usePage() as any;
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { appearance, updateAppearance } = useAppearance();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if active element is an input or textarea to avoid overriding normal typing
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') {
                return;
            }

            if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || e.key === '/') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <header className="border-b  border-default-200 bg-white dark:bg-gray-950/80 backdrop-blur-md flex h-16 shrink-0 items-center transition-[width,height] ease-linear sticky top-0 z-50 px-4 md:px-6">
            <div className="flex w-full items-center justify-between gap-4">
                {/* Left Side: Sidebar Toggle & Breadcrumbs */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                        {position === 'left' && (
                            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-accent/50 transition-colors" />
                        )}
                        <div className="h-6 w-[1px] bg-border/40 mx-1 hidden md:block" />
                        <Breadcrumbs items={breadcrumbs.map(b => ({ label: b.title, href: b.href }))} />
                    </div>
                </div>

                {/* Right Side: Search, Utilities & Profile */}
                <div className="flex items-center gap-3">
                    {/* Global Search Button */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSearchOpen(true)}
                        className="h-10 w-10 rounded-full text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/10 transition-all border border-border/60 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hidden lg:flex items-center justify-center"
                    >
                        <SearchIcon size={20} isAnimated={true} />
                    </Button>

                    <SearchConsole isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />

                    {/* Impersonation Notice */}
                    {props.isImpersonating && (
                        <form method="POST" action={route('impersonate.leave')}>
                            <input type="hidden" name="_token" value={props.csrf_token} />
                            <Button variant="destructive" size="sm" className="h-8 px-3 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-red-500/20">
                                Return Back
                            </Button>
                        </form>
                    )}

                    {/* Utility Icons */}
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleFullScreen}
                            className="h-10 w-10 rounded-full text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/10 transition-all border border-border/60 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md"
                        >
                            <ScanIcon size={20} isAnimated={true} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
                            className="h-10 w-10 rounded-full text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/10 transition-all border border-border/60 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md"
                        >
                            {appearance === 'dark' ? (
                                <SunIcon size={20} isAnimated={true} color="#eab308" />
                            ) : (
                                <MoonIcon size={20} isAnimated={true} />
                            )}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="relative cursor-pointer">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-primary/10 transition-all border border-border/60 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md">
                                        <BellIcon size={20} isAnimated={true} />
                                    </Button>
                                    {(props.auth?.notifications?.length ?? 0) > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] font-black text-primary-foreground border-2 border-white dark:border-gray-950 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
                                            {props.auth.notifications.length}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    <span>Notifications</span>
                                    {(props.auth?.notifications?.length ?? 0) > 0 && (
                                        <button 
                                            onClick={() => router.post(route('notifications.markAllAsRead'))}
                                            className="text-xs text-primary font-normal hover:underline"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                                    {(!props.auth?.notifications || props.auth.notifications.length === 0) ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No new notifications
                                        </div>
                                    ) : (
                                        props.auth.notifications.map((notification: any) => (
                                            <div key={notification.id}>
                                                <DropdownMenuItem 
                                                    onClick={() => router.post(route('notifications.markAsRead', notification.id))}
                                                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                                        <span className="font-medium text-sm">{notification.data?.title || 'Notification'}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground pl-4 line-clamp-2">{notification.data?.message}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground pl-4 mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </div>
                                        ))
                                    )}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="h-8 w-[1px] bg-border/40 mx-1 hidden sm:block" />

                    <ProfileMenu />
                    {position === 'right' && <SidebarTrigger className="-mr-1" />}
                </div>
            </div>
        </header>
    );
}
