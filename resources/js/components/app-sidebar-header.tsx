import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ProfileMenu } from '@/components/profile-menu';
import { usePage } from '@inertiajs/react';
import { Search, Bell, Maximize, Moon, Sun, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { MoonIcon, SunIcon, BellIcon, SearchIcon, ScanIcon } from '@animateicons/react/lucide';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { position } = useLayout();
    const { props } = usePage() as any;
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { appearance, updateAppearance } = useAppearance();

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
        <header className="border-b border-border/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex h-16 shrink-0 items-center transition-[width,height] ease-linear sticky top-0 z-50 px-4 md:px-6">
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
                    {/* Global Search Bar */}
                    <div className={cn(
                        "relative hidden lg:flex items-center transition-all duration-300",
                        isSearchFocused ? "w-80" : "w-64"
                    )}>
                        <div className="absolute left-3 h-4 w-4 flex items-center justify-center">
                            <SearchIcon size={16} isAnimated={true} color={isSearchFocused ? "var(--primary)" : "currentColor"} />
                        </div>
                        <Input
                            placeholder="Search console..."
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="h-10 pl-10 pr-4 bg-gray-100/50 dark:bg-white/5 border-transparent focus-visible:ring-primary/20 focus-visible:border-primary/40 rounded-xl transition-all"
                        />
                    </div>

                    {/* Impersonation Notice */}
                    {props.isImpersonating && (
                        <form method="POST" action={route('impersonate.leave')}>
                            <input type="hidden" name="_token" value={props.csrf_token} />
                            <Button variant="destructive" size="sm" className="h-8 px-3 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-red-500/20">
                                Leave Impersonation
                            </Button>
                        </form>
                    )}

                    {/* Utility Icons */}
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleFullScreen}
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-border/40 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm"
                        >
                            <ScanIcon size={18} isAnimated={true} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-border/40 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm"
                        >
                            {appearance === 'dark' ? (
                                <SunIcon size={18} isAnimated={true} color="#eab308" />
                            ) : (
                                <MoonIcon size={18} isAnimated={true} />
                            )}
                        </Button>
                        <div className="relative">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-border/40 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
                                <BellIcon size={18} isAnimated={true} />
                            </Button>
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] font-black text-primary-foreground border-2 border-white dark:border-gray-950 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
                                2
                            </span>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-border/40 mx-1 hidden sm:block" />

                    <ProfileMenu />
                    {position === 'right' && <SidebarTrigger className="-mr-1" />}
                </div>
            </div>
        </header>
    );
}
