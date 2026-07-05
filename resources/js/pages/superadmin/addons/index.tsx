import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { BreadcrumbItem } from "@/components/nav-main";
import { PageTemplate } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchInput } from "@/components/ui/search-input";
import NoRecordsFound from "@/components/no-records-found";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageCircle,
  UsersRound,
  Package,
  GraduationCap,
  Clipboard,
  FolderOpen,
  CalendarRange,
  UserCheck,
  Target,
  Fingerprint,
  Timer,
  IndianRupee,
  LucideIcon,
  PowerOff,
  Power,
  Eye,
  Plus
} from "lucide-react";

interface AddOn {
  id: number;
  module: string;
  name: string;
  label: string;
  icon: string;
  color: string | null;
  is_enable: boolean;
  monthly_price: string;
  yearly_price: string;
  created_at: string;
  updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "System", href: "#" },
  { title: "Add-on Manager", href: "/add-ons" },
];

const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  UsersRound,
  Package,
  GraduationCap,
  Clipboard,
  FolderOpen,
  CalendarRange,
  UserCheck,
  Target,
  Fingerprint,
  Timer,
  IndianRupee,
};

export default function AddonManager({ addOns }: { addOns: AddOn[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<AddOn | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredAddOns = addOns.filter(addon =>
    addon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addon.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (id: number, checked: boolean) => {
    router.put(
      route("addons.toggle", id),
      { is_enable: checked },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Add-on status updated successfully.");
        },
        onError: () => {
          toast.error("Failed to update add-on status.");
        },
      }
    );
  };

  const handleViewDetails = (addon: AddOn) => {
    setSelectedModule(addon);
    setIsDetailsOpen(true);
  };

  return (
    <PageTemplate
      title="Add-on Manager"
      description="Manage system modules and add-ons."
      url="/add-ons"
      breadcrumbs={breadcrumbs}
      actions={[
        { label: "Upload Add-on", variant: "outline", onClick: () => router.visit(route("addons.upload")) }
      ]}
    >
      <Card>
        <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Installed Add-ons</h3>
            </div>
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={() => {}}
                placeholder="Search installed add-ons..."
                className="w-full"
            />
        </CardHeader>

        <CardContent>
            {filteredAddOns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                    {filteredAddOns.map((module) => {
                        const Icon = iconMap[module.icon] || Package;
                        return (
                        <Card key={module.id} className="relative hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-800 flex flex-col">
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`relative p-2 rounded-lg ${module.is_enable ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            <Icon className={`h-6 w-6 ${module.color || (module.is_enable ? 'text-primary' : 'text-gray-500')}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">v1.0</span>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                                            module.is_enable
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                        }`}>
                                            {module.is_enable ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{module.label}</h3>
                                </div>

                                <div className="mt-auto flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewDetails(module)}
                                        className="flex-1 h-8 text-xs"
                                    >
                                        <Eye className="mr-1 h-3 w-3" />
                                        Details
                                    </Button>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggle(module.id, !module.is_enable)}
                                                    className={`h-8 px-2 ${module.is_enable ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900 dark:hover:bg-red-900/40' : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-900 dark:hover:bg-green-900/40'}`}
                                                >
                                                    {module.is_enable ? (
                                                        <PowerOff className="h-4 w-4" />
                                                    ) : (
                                                        <Power className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{module.is_enable ? 'Disable Module' : 'Enable Module'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </Card>
                    )})}
                </div>
            ) : (
                <NoRecordsFound
                    icon={Package}
                    title="No add-ons found"
                    description={searchTerm ? "No add-ons match your search criteria." : "No add-ons are available."}
                    hasFilters={!!searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                />
            )}
        </CardContent>
      </Card>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedModule?.is_enable ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {selectedModule && React.createElement(iconMap[selectedModule.icon] || Package, {
                            className: `h-6 w-6 ${selectedModule.color || (selectedModule.is_enable ? 'text-primary' : 'text-gray-500')}`
                        })}
                    </div>
                    {selectedModule?.label}
                </DialogTitle>
                <DialogDescription>
                    Add-on details for {selectedModule?.label}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-600">Version:</span>
                        <p className="text-green-600 font-medium">v1.0</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <p className={`font-medium ${
                            selectedModule?.is_enable ? 'text-green-600' : 'text-gray-500'
                        }`}>
                            {selectedModule?.is_enable ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                </div>
                {selectedModule?.module && (
                    <div>
                        <span className="font-medium text-gray-600">Package:</span>
                        <p className="text-sm text-gray-800">{selectedModule.module}</p>
                    </div>
                )}
                <div className="flex gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (selectedModule) {
                                handleToggle(selectedModule.id, !selectedModule.is_enable);
                                setIsDetailsOpen(false);
                            }
                        }}
                        className={`flex-1 ${selectedModule?.is_enable ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900' : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-900'}`}
                    >
                        {selectedModule?.is_enable ? (
                            <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Disable
                            </>
                        ) : (
                            <>
                                <Power className="mr-2 h-4 w-4" />
                                Enable
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
