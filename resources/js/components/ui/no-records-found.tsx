import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface NoRecordsFoundProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    filteredDescription?: string;
    hasFilters?: boolean;
    onClearFilters?: () => void;
    createPermission?: string;
    onCreateClick?: () => void;
    createButtonText?: string;
    className?: string;
}

export function NoRecordsFound({
    icon: Icon,
    title,
    description,
    filteredDescription,
    hasFilters = false,
    onClearFilters,
    createPermission,
    onCreateClick,
    createButtonText,
    className = 'h-64'
}: NoRecordsFoundProps) {
    const { auth } = usePage().props as any;
    
    const hasCreatePermission = createPermission ? 
        auth.permissions?.includes(createPermission) : true;

    const displayDescription = hasFilters ? 
        (filteredDescription || 'No records match your current filters or search criteria.') :
        description;

    return (
        <div className={`flex flex-col items-center justify-center text-center py-10 ${className}`}>
            <Icon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-black">{title}</h3>
            {displayDescription && (
                <p className="text-muted-foreground mb-4">{displayDescription}</p>
            )}
            {hasFilters ? (
                onClearFilters && (
                    <Button variant="outline" onClick={onClearFilters}>
                        Clear filters
                    </Button>
                )
            ) : (
                hasCreatePermission && onCreateClick && (
                    <Button onClick={onCreateClick}>
                        <Plus className="h-4 w-4 mr-2" />
                        {createButtonText || 'Create'}
                    </Button>
                )
            )}
        </div>
    );
}
