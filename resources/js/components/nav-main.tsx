import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { cn } from "@/lib/utils";
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Store expanded menu state in localStorage
const STORAGE_KEY = 'nav_expanded_items';

export function NavMain({ items = [], position }: { items: NavItem[]; position: 'left' | 'right' }) {
    const page = usePage();
    const { state } = useSidebar();
    
    // Check if the document is in RTL mode
    const isRtl = document.documentElement.dir === 'rtl';
    
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    
    // Determine the actual position considering RTL mode
    const effectivePosition = isRtl ? (position === 'left' ? 'right' : 'left') : position;
    
    // Initialize expanded state
    useEffect(() => {
        // Start with a clean slate - close all menus
        const newExpandedItems: Record<string, boolean> = {};
        
        // Process menus that should be expanded
        const processMenuItems = (menuItems: NavItem[], parentKey?: string) => {
            menuItems.forEach(item => {
                // If this is the active item or contains the active item
                const isItemActive = isActive(item.href);
                const hasActiveChild = item.children && isChildActive(item.children);
                
                // If this item or its children are active, expand it
                if (parentKey && (isItemActive || hasActiveChild)) {
                    newExpandedItems[parentKey] = true;
                }
                
                // If this item has children and is active, has active children, or defaultOpen is true, expand it
                if (item.children && (isItemActive || hasActiveChild || item.defaultOpen === true)) {
                    newExpandedItems[item.title] = true;
                    
                    // Recursively check children
                    processMenuItems(item.children, item.title);
                }
                
                // Check nested children with their own keys
                if (item.children) {
                    checkNestedChildren(item.children, 1, newExpandedItems);
                }
            });
        };
        
        processMenuItems(items);
        
        // Update state and save to localStorage
        setExpandedItems(newExpandedItems);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpandedItems));
        } catch (e) {
            console.error('Error saving navigation state:', e);
        }
    }, [page.url, items]); // Re-run when URL changes or items change
    
    // Helper function to check nested children for active items
    const checkNestedChildren = (
        children: NavItem[], 
        level: number, 
        newExpandedItems: Record<string, boolean>
    ) => {
        children.forEach(child => {
            const childKey = `${level}-${child.title}`;
            const isChildItemActive = isActive(child.href);
            const hasActiveChild = child.children && isChildActive(child.children);
            
            if (child.children && (isChildItemActive || hasActiveChild)) {
                newExpandedItems[childKey] = true;
                checkNestedChildren(child.children, level + 1, newExpandedItems);
            }
        });
    };
    
    const toggleExpand = (title: string) => {
        const newExpandedItems = {
            ...expandedItems,
            [title]: !expandedItems[title]
        };
        
        setExpandedItems(newExpandedItems);
        
        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpandedItems));
        } catch (e) {
            console.error('Error saving navigation state:', e);
        }
    };
    
    const isActive = (href?: string) => {
        if (!href) return false;
        
        // Extract pathname from href if it's a full URL
        const hrefPath = href.startsWith('http') ? new URL(href).pathname : href;
        const currentPath = page.url;
        
        const active = currentPath === hrefPath || currentPath.startsWith(hrefPath + '/');
        return active;
    };
    
    const isChildActive = (children?: NavItem[]) => {
        if (!children) return false;
        return children.some(child => isActive(child.href) || isChildActive(child.children));
    };
    
    const renderSubMenu = (children: NavItem[], level: number = 1) => {
        return (
            <SidebarMenuSub>
                {children.map(child => (
                    <div key={child.title}>
                        {child.children ? (
                            // Nested submenu item with children
                            <>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton 
                                        isActive={isChildActive(child.children)}
                                        onClick={() => toggleExpand(`${level}-${child.title}`)}
                                    >
                                        <div className={`flex items-center gap-2 ${effectivePosition === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}>
                                            <span>{child.title}</span>
                                            {state !== "collapsed" && (
                                                expandedItems[`${level}-${child.title}`] ? 
                                                    <ChevronDown className="h-3 w-3 ml-auto" /> : 
                                                    <ChevronRight className="h-3 w-3 ml-auto" />
                                            )}
                                        </div>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                
                                {/* Render nested children */}
                                {expandedItems[`${level}-${child.title}`] && renderSubMenu(child.children, level + 1)}
                            </>
                        ) : (
                            // Regular submenu item
                            <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                                    {child.target === '_blank' ? (
                                        <a
                                            href={child.href || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "flex items-center gap-2 group/sub transition-all duration-300",
                                                effectivePosition === 'right' ? 'justify-end text-right' : 'justify-start text-left',
                                                isActive(child.href) ? "text-primary font-bold" : "text-muted-foreground/70 hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                isActive(child.href) ? "bg-primary scale-110 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "bg-muted-foreground/20 group-hover/sub:bg-muted-foreground/40"
                                            )} />
                                            <span>{child.title}</span>
                                        </a>
                                    ) : (
                                        <Link
                                            href={child.href || '#'}
                                            prefetch
                                            className={cn(
                                                "flex items-center gap-2 group/sub transition-all duration-300",
                                                effectivePosition === 'right' ? 'justify-end text-right' : 'justify-start text-left',
                                                isActive(child.href) ? "text-primary font-bold" : "text-muted-foreground/70 hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                isActive(child.href) ? "bg-primary scale-110 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "bg-muted-foreground/20 group-hover/sub:bg-muted-foreground/40"
                                            )} />
                                            <span>{child.title}</span>
                                        </Link>
                                    )}
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        )}
                    </div>
                ))}
            </SidebarMenuSub>
        );
    };
    
    return (
        <SidebarGroup className="px-1.5 py-0">
            <SidebarGroupLabel className={`flex w-full text-xs ${effectivePosition === 'right' ? 'justify-end' : 'justify-start'}`}>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <div key={item.title}>
                        {item.children ? (
                            // Parent item with children
                            <>
                                <SidebarMenuItem>
                                    <SidebarMenuButton 
                                        isActive={isChildActive(item.children)} 
                                        tooltip={{ children: item.title }}
                                        onClick={() => toggleExpand(item.title)}
                                        className={cn(
                                            "transition-all duration-300 h-10 group/item relative overflow-hidden",
                                            isChildActive(item.children) 
                                                ? "bg-primary/5 text-primary font-bold" 
                                                : "hover:bg-accent/50"
                                        )}
                                    >
                                        <div className={`flex items-center gap-2 w-full ${effectivePosition === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}>
                                            {effectivePosition === 'right' ? (
                                                <>
                                                    <span>{state !== "collapsed" ? item.title : ""}</span>
                                                    {item.icon && <item.icon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", isChildActive(item.children) && "text-primary")} />}
                                                    {state !== "collapsed" && (
                                                        expandedItems[item.title] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {item.icon && <item.icon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", isChildActive(item.children) && "text-primary")} />}
                                                    <div className="flex items-center gap-1">
                                                        {state !== "collapsed" && <span>{item.title}</span>}
                                                        {state !== "collapsed" && item.badge && (
                                                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-md bg-primary text-primary-foreground shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]">
                                                                {item.badge.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {state !== "collapsed" && (
                                                        <div className={cn("ml-auto transition-transform duration-300", expandedItems[item.title] && "rotate-90")}>
                                                            <ChevronRight className="h-3 w-3 opacity-40 group-hover/item:opacity-100" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                
                                {/* Child items */}
                                {state !== "collapsed" && expandedItems[item.title] && renderSubMenu(item.children)}
                            </>
                        ) : (
                            // Regular item without children
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    asChild 
                                    isActive={isActive(item.href)} 
                                    tooltip={{ children: item.title }}
                                    className={cn(
                                        "transition-all duration-300 h-10 group/item relative overflow-hidden",
                                        isActive(item.href) 
                                            ? "bg-primary/10 text-primary font-bold shadow-[inset_4px_0_12px_rgba(var(--primary-rgb),0.05)]" 
                                            : "hover:bg-accent/50"
                                    )}
                                >
                                    {item.target === '_blank' ? (
                                        <a
                                            href={item.href || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2 w-full ${effectivePosition === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}
                                        >
                                            {effectivePosition === 'right' ? (
                                                <>
                                                    {state !== "collapsed" && <span>{item.title}</span>}
                                                    {item.icon && <item.icon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", isActive(item.href) && "text-primary")} />}
                                                </>
                                            ) : (
                                                <>
                                                    {item.icon && <item.icon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", isActive(item.href) && "text-primary shadow-primary/20")} />}
                                                    {state !== "collapsed" && <span>{item.title}</span>}
                                                </>
                                            )}
                                        </a>
                                    ) : (
                                        <Link
                                            href={item.href || '#'}
                                            prefetch
                                            className={`flex items-center gap-2 w-full ${effectivePosition === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}
                                        >
                                            {effectivePosition === 'right' ? (
                                                <>
                                                    {state !== "collapsed" && <span>{item.title}</span>}
                                                    {item.icon && <item.icon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", isActive(item.href) && "text-primary")} />}
                                                </>
                                            ) : (
                                                <>
                                                    {item.icon && <item.icon className={cn("h-4 w-4 transition-transform group-hover/item:scale-110", isActive(item.href) && "text-primary")} />}
                                                    {state !== "collapsed" && <span>{item.title}</span>}
                                                </>
                                            )}
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </div>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}