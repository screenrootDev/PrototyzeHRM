import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { 
    Search, 
    LayoutDashboard, 
    Building2, 
    FolderClosed, 
    Globe, 
    Settings, 
    User, 
    Mail, 
    Webhook, 
    Sun, 
    Moon, 
    Maximize2, 
    Trash2, 
    Sparkles, 
    Eye, 
    ShieldCheck, 
    Database, 
    Cookie, 
    SearchCode,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

interface SearchItem {
    id: string;
    title: string;
    description: string;
    category: 'Navigation' | 'Actions' | 'Settings';
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    shortcut?: string;
}

export function SearchConsole({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const { appearance, updateAppearance } = useAppearance();
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const { props } = usePage() as any;

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle full screen toggle
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Define search items
    const items: SearchItem[] = [
        // Navigation Category
        {
            id: 'nav-dashboard',
            title: 'Dashboard',
            description: 'Go to system dashboard & stats',
            category: 'Navigation',
            icon: LayoutDashboard,
            action: () => router.visit(route('dashboard'))
        },
        {
            id: 'nav-companies',
            title: 'Companies',
            description: 'Manage companies and clients',
            category: 'Navigation',
            icon: Building2,
            action: () => router.visit(route('companies.index'))
        },
        {
            id: 'nav-media',
            title: 'Media Library',
            description: 'Access file manager & uploaded assets',
            category: 'Navigation',
            icon: FolderClosed,
            action: () => router.visit(route('media-library'))
        },
        {
            id: 'nav-landing',
            title: 'Landing Page',
            description: 'Manage landing page sections & contact inquiries',
            category: 'Navigation',
            icon: Globe,
            action: () => router.visit(route('landing-page'))
        },
        {
            id: 'nav-settings',
            title: 'Settings',
            description: 'System-wide configuration & system settings',
            category: 'Navigation',
            icon: Settings,
            action: () => router.visit(route('settings'))
        },
        {
            id: 'nav-profile',
            title: 'Profile Settings',
            description: 'Update profile info & account password',
            category: 'Navigation',
            icon: User,
            action: () => router.visit(route('profile'))
        },
        {
            id: 'nav-email-settings',
            title: 'Email Settings',
            description: 'Configure SMTP & Dynamic mail settings',
            category: 'Navigation',
            icon: Mail,
            action: () => router.visit(route('settings.email'))
        },
        {
            id: 'nav-webhooks',
            title: 'Webhook Settings',
            description: 'Configure system event webhooks',
            category: 'Navigation',
            icon: Webhook,
            action: () => router.visit(route('settings.webhooks.index'))
        },

        // Actions Category
        {
            id: 'action-theme',
            title: `Switch to ${appearance === 'dark' ? 'Light' : 'Dark'} Mode`,
            description: 'Toggle visual appearance theme',
            category: 'Actions',
            icon: appearance === 'dark' ? Sun : Moon,
            action: () => updateAppearance(appearance === 'dark' ? 'light' : 'dark')
        },
        {
            id: 'action-fullscreen',
            title: 'Toggle Fullscreen',
            description: 'Enter or exit browser fullscreen mode',
            category: 'Actions',
            icon: Maximize2,
            action: toggleFullScreen
        },
        {
            id: 'action-clear-cache',
            title: 'Clear System Cache',
            description: 'Flush Laravel routing, application & view caches',
            category: 'Actions',
            icon: Trash2,
            action: () => router.post(route('settings.cache.clear'), {}, {
                onSuccess: () => onOpenChange(false)
            })
        },

        // Settings Category (Direct anchors to Settings tabs)
        {
            id: 'settings-brand',
            title: 'Brand Settings',
            description: 'Change theme colors, system logo & favicon',
            category: 'Settings',
            icon: Sparkles,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('brand-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        },
        {
            id: 'settings-storage',
            title: 'Storage Settings',
            description: 'Configure Local, AWS S3 or Wasabi storage types',
            category: 'Settings',
            icon: Database,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('storage-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        },
        {
            id: 'settings-recaptcha',
            title: 'ReCaptcha Settings',
            description: 'Manage Google ReCaptcha credentials',
            category: 'Settings',
            icon: ShieldCheck,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('recaptcha-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        },
        {
            id: 'settings-chatgpt',
            title: 'ChatGPT AI Settings',
            description: 'Configure OpenAI API key & model settings',
            category: 'Settings',
            icon: SearchCode,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('chatgpt-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        },
        {
            id: 'settings-cookie',
            title: 'Cookie Consent Settings',
            description: 'Configure cookie banners & privacy texts',
            category: 'Settings',
            icon: Cookie,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('cookie-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        },
        {
            id: 'settings-seo',
            title: 'SEO Settings',
            description: 'Set default meta keywords, description & preview image',
            category: 'Settings',
            icon: Globe,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('seo-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        },
        {
            id: 'settings-calendar',
            title: 'Google Calendar Settings',
            description: 'Sync and configure Google Calendar integration',
            category: 'Settings',
            icon: Calendar,
            action: () => {
                router.visit(route('settings'));
                setTimeout(() => {
                    document.getElementById('google-calendar-settings-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        }
    ];

    // Filter items based on search input
    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    // Group filtered items by category
    const categories: Record<string, SearchItem[]> = {};
    filteredItems.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });

    // Flatten items for key navigation
    const flatFilteredItems = Object.values(categories).flat();

    // Reset index if flat items change
    useEffect(() => {
        setActiveIndex(0);
    }, [search]);

    // Handle keydown navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % Math.max(1, flatFilteredItems.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + flatFilteredItems.length) % Math.max(1, flatFilteredItems.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatFilteredItems[activeIndex]) {
                    flatFilteredItems[activeIndex].action();
                    onOpenChange(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatFilteredItems, activeIndex, onOpenChange]);

    // Scroll active item into view
    useEffect(() => {
        if (resultsContainerRef.current) {
            const activeEl = resultsContainerRef.current.querySelector('[data-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-border bg-white dark:bg-gray-950 rounded-2xl shadow-2xl">
                <DialogTitle className="sr-only">Search Console</DialogTitle>
                <DialogDescription className="sr-only">Search and navigate through pages, actions, and system settings.</DialogDescription>
                {/* Search Header */}
                <div className="flex items-center gap-3 px-4 border-b border-border/60 h-14">
                    <Search className="h-5 w-5 text-muted-foreground/60" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search page, settings, action..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-full bg-transparent border-0 outline-none text-sm placeholder-muted-foreground/60 focus:ring-0 text-foreground"
                    />
                </div>

                {/* Results Container */}
                <div 
                    ref={resultsContainerRef} 
                    className="max-h-[380px] overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
                >
                    {flatFilteredItems.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            No settings or actions found for "{search}"
                        </div>
                    ) : (
                        Object.entries(categories).map(([categoryName, catItems]) => (
                            <div key={categoryName} className="space-y-1">
                                <div className="px-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.15em] py-1.5">
                                    {categoryName}
                                </div>
                                <div className="space-y-0.5">
                                    {catItems.map(item => {
                                        const globalIndex = flatFilteredItems.findIndex(i => i.id === item.id);
                                        const isActive = globalIndex === activeIndex;
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={item.id}
                                                data-active={isActive}
                                                onClick={() => {
                                                    item.action();
                                                    onOpenChange(false);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group",
                                                    isActive 
                                                        ? "bg-primary/10 border border-primary/30 text-primary font-bold shadow-[0_4px_12px_rgba(var(--primary-rgb),0.05)]" 
                                                        : "hover:bg-accent/40 border border-transparent text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                                                        isActive 
                                                            ? "bg-primary/20 border-primary/40 text-primary" 
                                                            : "bg-gray-100 dark:bg-white/5 border-border/40 text-muted-foreground/80 group-hover:bg-white dark:group-hover:bg-gray-900 group-hover:text-primary group-hover:border-primary/20"
                                                    )}>
                                                        <Icon className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-sm font-semibold tracking-tight">{item.title}</span>
                                                        <span className={cn(
                                                            "text-[11px] font-medium tracking-tight mt-0.5",
                                                            isActive ? "text-primary/70" : "text-muted-foreground"
                                                        )}>{item.description}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isActive && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 animate-pulse">
                                                            Select <ArrowRight className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

       
            </DialogContent>
        </Dialog>
    );
}
