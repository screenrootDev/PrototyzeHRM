// pages/companies/index.tsx
import { useState } from "react";
import { PageTemplate } from "@/components/page-template";
import { usePage, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { SearchAndFilterBar } from "@/components/ui/search-and-filter-bar";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  LayoutGrid,
  List,
  Info,
  ArrowUpRight,
  CreditCard,
  Wand2,
  Camera,
  Upload,
  Image as ImageIcon,
  Mail,
} from "lucide-react";
import { getImagePath, getInitials } from "@/utils/helpers";
import { toast } from "sonner";
import PasswordField from "@/components/PasswordField";
import MediaLibraryModal from "@/components/MediaLibraryModal";

const CompanyLogoField = ({
  value,
  onChange,
}: {
  value: any;
  onChange: (val: any) => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div className="col-span-full flex flex-col items-center justify-center space-y-4 mb-6">
        <div
          className="relative group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="h-32 w-32 rounded-3xl overflow-hidden border-2 border-primary/10 shadow-2xl transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/20 group-hover:-translate-y-1">
            {value ? (
              <img
                src={getImagePath(value)}
                className="h-full w-full object-cover"
                alt="Logo"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-primary/30">
                <ImageIcon size={48} strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-xl shadow-xl border-2 border-white dark:border-gray-950 transform transition-transform group-hover:scale-110">
            <Upload size={14} strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h4 className="text-sm font-bold tracking-tight">Brand Identity</h4>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Recommended: Square SVG or PNG
          </p>
        </div>
      </div>
      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(url) => {
          const filename = url.split("/").pop() || url;
          onChange(filename);
        }}
      />
    </>
  );
};
import { cn } from "@/lib/utils";
import {
  generateStrongPassword,
  calculatePasswordStrength,
  getStrengthLabel,
} from "@/utils/password";

import { DatePicker } from "@/components/ui/date-picker";
import { CrudFormModal } from "@/components/CrudFormModal";
import { CrudDeleteModal } from "@/components/CrudDeleteModal";

export default function Companies() {
  const {
    auth,
    companies,
    plans,
    filters: pageFilters = {},
    globalSettings,
    errors,
  } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // Reusable Password Field Component
  const PasswordField = ({
    field,
    formData,
    onChange,
  }: {
    field: any;
    formData: any;
    onChange: any;
  }) => {
    const strength = calculatePasswordStrength(formData[field.name] || "");
    const strengthInfo = getStrengthLabel(strength);

    return (
      <div className="space-y-2">
        <div className="relative group">
          <Input
            id={field.name}
            name={field.name}
            type="text"
            placeholder="Enter or generate password"
            value={formData[field.name] || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            required
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => {
              const pass = generateStrongPassword(12);
              onChange(field.name, pass);
              toast.success("Strong password generated!");
            }}
            title="Generate Strong Password"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        </div>
        {formData[field.name] && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
              <span className="text-muted-foreground">Strength:</span>
              <span className={strengthInfo.color.split(" ")[0]}>
                {strengthInfo.label}
              </span>
            </div>
            <div className="flex gap-1 h-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-500",
                    i <= strength
                      ? strengthInfo.color.split(" ")[1]
                      : "bg-gray-200 dark:bg-gray-800",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  // State
  const [activeView, setActiveView] = useState("list");
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    pageFilters.start_date ? new Date(pageFilters.start_date) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    pageFilters.end_date ? new Date(pageFilters.end_date) : undefined,
  );
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status || "all",
  );
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);

  const [currentCompany, setCurrentCompany] = useState<any>(null);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedStatus !== "all" ||
      searchTerm !== "" ||
      startDate !== undefined ||
      endDate !== undefined
    );
  };

  // Count active filters
  const activeFilterCount = () => {
    return (
      (selectedStatus !== "all" ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (startDate ? 1 : 0) +
      (endDate ? 1 : 0)
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }

    if (startDate) {
      params.start_date = startDate.toISOString().split("T")[0];
    }

    if (endDate) {
      params.end_date = endDate.toISOString().split("T")[0];
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    router.get(route("companies.index"), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);

    const params: any = { page: 1 };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (value !== "all") {
      params.status = value;
    }

    if (startDate) {
      params.start_date = startDate.toISOString().split("T")[0];
    }

    if (endDate) {
      params.end_date = endDate.toISOString().split("T")[0];
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    router.get(route("companies.index"), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSort = (field: string) => {
    const direction =
      pageFilters.sort_field === field && pageFilters.sort_direction === "asc"
        ? "desc"
        : "asc";

    const params: any = {
      sort_field: field,
      sort_direction: direction,
      page: 1,
    };

    // Add search and filters
    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }

    if (startDate) {
      params.start_date = startDate.toISOString().split("T")[0];
    }

    if (endDate) {
      params.end_date = endDate.toISOString().split("T")[0];
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    router.get(route("companies.index"), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleAction = (action: string, company: any) => {
    setCurrentCompany(company);

    switch (action) {
      case "login-as":
        window.location.href = route("impersonate.start", company.id);
        break;
      case "company-info":
        setFormMode("view");
        setIsFormModalOpen(true);
        break;
      case "reset-password":
        setIsResetPasswordModalOpen(true);
        break;
      case "toggle-status":
        handleToggleStatus(company);
        break;
      case "edit":
        setFormMode("edit");
        setIsFormModalOpen(true);
        break;
      case "delete":
        setIsDeleteModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentCompany(null);
    setFormMode("create");
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === "create") {
      if (!globalSettings?.is_demo) {
        toast.loading("Creating company...");
      }

      router.post(route("companies.store"), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);
          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);
          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === "string") {
            toast.error(errors);
          } else {
            toast.error(
              `Failed to create company: ${Object.values(errors).join(", ")}`,
            );
          }
        },
      });
    } else if (formMode === "edit") {
      if (!globalSettings?.is_demo) {
        toast.loading("Updating company...");
      }

      router.put(route("companies.update", currentCompany.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);
          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);
          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === "string") {
            toast.error(errors);
          } else {
            toast.error(
              `Failed to update company: ${Object.values(errors).join(", ")}`,
            );
          }
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) {
      toast.loading("Deleting company...");
    }

    router.delete(route("companies.destroy", currentCompany.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);
        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error(
            `Failed to delete company: ${Object.values(errors).join(", ")}`,
          );
        }
      },
    });
  };

  const handleResetPasswordConfirm = (data: { password: string }) => {
    if (!globalSettings?.is_demo) {
      toast.loading("Resetting password...");
    }

    router.put(route("companies.reset-password", currentCompany.id), data, {
      onSuccess: (page) => {
        setIsResetPasswordModalOpen(false);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);
        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error(
            `Failed to reset password: ${Object.values(errors).join(", ")}`,
          );
        }
      },
    });
  };

  const handleToggleStatus = (company: any) => {
    const newStatus = company.status === "active" ? "inactive" : "active";
    if (!globalSettings?.is_demo) {
      toast.loading(
        `${newStatus === "active" ? "Activating" : "Deactivating"} company...`,
      );
    }

    router.put(
      route("companies.toggle-status", company.id),
      {},
      {
        onSuccess: (page) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);
          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);
          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === "string") {
            toast.error(errors);
          } else {
            toast.error(
              `Failed to update company status: ${Object.values(errors).join(", ")}`,
            );
          }
        },
      },
    );
  };

  const handleResetFilters = () => {
    setSelectedStatus("all");
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
    setShowFilters(false);

    router.get(
      route("companies.index"),
      {
        page: 1,
        per_page: pageFilters.per_page,
      },
      { preserveState: true, preserveScroll: true },
    );
  };

  // Define page actions
  const pageActions = [
    {
      label: "Add Company",
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: "default",
      onClick: () => handleAddNew(),
    },
  ];

  const breadcrumbs = [
    { title: "Dashboard", href: route("dashboard") },
    { title: "Companies" },
  ];

  // Define table columns for list view
  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value: any, row: any) => {
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 overflow-hidden shadow-sm">
                {row.avatar ? (
                  <img
                    src={getImagePath(row.avatar)}
                    alt={row.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                  />
                ) : (
                  <div className="font-black text-primary text-sm tracking-tighter">
                    {getInitials(row.name)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{row.name}</div>
              <div className="text-xs text-muted-foreground/70 font-medium flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 opacity-50" />
                {row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <Badge 
            variant="outline" 
            className={cn(
              "pl-1.5 pr-2.5 py-0.5 rounded-full border shadow-sm font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5",
              value === "active" 
                ? "bg-emerald-50/50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                : "bg-gray-50/50 text-gray-500 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20"
            )}
          >
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              value === "active" ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-400"
            )} />
            {value === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      render: (value: string) =>
        window.appSettings?.formatDateTime(value, false) ||
        new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <PageTemplate
      title={"Companies"}
      url="/companies"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: "status",
              label: "Status",
              type: "select",
              value: selectedStatus,
              onChange: handleStatusFilter,
              options: [
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
            {
              name: "start_date",
              label: "Start Date",
              type: "date",
              value: startDate,
              onChange: (date) => setStartDate(date),
            },
            {
              name: "end_date",
              label: "End Date",
              type: "date",
              value: endDate,
              onChange: (date) => setEndDate(date),
            },
          ]}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };

            if (searchTerm) {
              params.search = searchTerm;
            }

            if (selectedStatus !== "all") {
              params.status = selectedStatus;
            }

            if (startDate) {
              params.start_date = startDate.toISOString().split("T")[0];
            }

            if (endDate) {
              params.end_date = endDate.toISOString().split("T")[0];
            }

            router.get(route("companies.index"), params, {
              preserveState: true,
              preserveScroll: true,
            });
          }}
          showViewToggle={true}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>

      {/* Content section */}
      {activeView === "list" ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left font-medium text-gray-500"
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {column.sortable && (
                          <span className="ml-1">
                            {pageFilters.sort_field === column.key
                              ? pageFilters.sort_direction === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    {"Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies?.data?.map((company: any) => (
                  <tr
                    key={company.id}
                    className="border-b hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    {columns.map((column) => (
                      <td
                        key={`${company.id}-${column.key}`}
                        className="px-4 py-3"
                      >
                        {column.render
                          ? column.render(company[column.key], company)
                          : company[column.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center bg-gray-50/50 dark:bg-white/5 rounded-xl p-1 w-fit ml-auto border border-gray-100 dark:border-white/5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAction("login-as", company)}
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-blue-600 text-white border-blue-600 font-bold text-xs">{"Login as Company"}</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleAction("company-info", company)
                              }
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-primary text-primary-foreground font-bold text-xs">{"Company Info"}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleAction("reset-password", company)
                              }
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-primary text-primary-foreground font-bold text-xs">{"Reset Password"}</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleAction("toggle-status", company)
                              }
                              className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                company.status === "active" 
                                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10" 
                                  : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              )}
                            >
                              {company.status === "active" ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className={cn(
                            "font-bold text-xs border-none",
                            company.status === "active" ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
                          )}>
                            {company.status === "active"
                              ? "Disable Login"
                              : "Enable Login"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAction("edit", company)}
                              className="text-amber-500 hover:text-amber-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{"Edit"}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleAction("delete", company)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{"Delete"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}

                {(!companies?.data || companies.data.length === 0) && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {"No companies found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination section */}
          <Pagination
            from={companies?.from || 0}
            to={companies?.to || 0}
            total={companies?.total || 0}
            links={companies?.links}
            entityName={"companies"}
            onPageChange={(url) => router.get(url)}
          />
        </div>
      ) : (
        <div>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {companies?.data?.map((company: any) => (
              <Card
                key={company.id}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 min-w-0">
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 overflow-hidden flex-shrink-0">
                        {company.avatar ? (
                          <img
                            src={getImagePath(company.avatar)}
                            alt={company.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(company.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-bold text-gray-900 mb-1 truncate"
                          title={company.name}
                        >
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 break-all">
                          {company.email}
                        </p>
                        <div className="flex items-center">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full mr-2",
                              company.status === "active"
                                ? "bg-green-500"
                                : "bg-gray-400",
                            )}
                          ></div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              company.status === "active"
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-700 dark:text-gray-400",
                            )}
                          >
                            {company.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 z-50"
                        sideOffset={5}
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            (window.location.href = route(
                              "impersonate.start",
                              company.id,
                            ))
                          }
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          <span>{"Login as Company"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("company-info", company)}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          <span>{"Company Info"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            handleAction("reset-password", company)
                          }
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          <span>{"Reset Password"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("toggle-status", company)}
                        >
                          {company.status === "active" ? (
                            <Lock className="h-4 w-4 mr-2" />
                          ) : (
                            <Unlock className="h-4 w-4 mr-2" />
                          )}
                          <span>
                            {company.status === "active"
                              ? "Disable Login"
                              : "Enable Login"}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAction("edit", company)}
                          className="text-amber-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          <span>{"Edit"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("delete", company)}
                          className="text-rose-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>{"Delete"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}

            {(!companies?.data || companies.data.length === 0) && (
              <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">
                {"No companies found"}
              </div>
            )}
          </div>

          {/* Pagination for grid view */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={companies?.from || 0}
              to={companies?.to || 0}
              total={companies?.total || 0}
              links={companies?.links}
              entityName={"companies"}
              onPageChange={(url) => router.get(url)}
            />
          </div>
        </div>
      )}

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={(data) => {
          // If login_enabled is false, remove password field
          if (data.login_enabled === false) {
            delete data.password;
          }
          // Set status based on login_enabled
          data.status = data.login_enabled ? "active" : "inactive";

          // Remove login_enabled field as it's not needed in the backend
          delete data.login_enabled;
          handleFormSubmit(data);
        }}
        formConfig={{
          layout: "grid",
          columns: 2,
          fields: [
            {
              name: "avatar",
              label: "Company Logo",
              type: "media-picker",
              required: false,
              colSpan: 2,
              render: (field, formData, onChange) => (
                <CompanyLogoField
                  value={formData.avatar}
                  onChange={(val) => onChange("avatar", val)}
                />
              ),
            },
            {
              name: "name",
              label: "Company Name",
              type: "text",
              required: true,
              placeholder: "Enter company name",
            },
            {
              name: "email",
              label: "Email Address",
              type: "email",
              required: true,
              placeholder: "contact@company.com",
            },
            {
              name: "total_storage_limit",
              label: "Storage Limit (GB)",
              type: "number",
              required: true,
              defaultValue: 5.0,
            },
            {
              name: "login_enabled",
              label: "Account Status",
              placeholder: "Enable login for this company",
              type: "switch",
              defaultValue: true,
              conditional: (mode) => mode === "create",
            },
            {
              name: "password",
              label: "Access Password",
              type: "password",
              colSpan: 2,
              required: (mode) => mode === "create",
              conditional: (mode, data) => {
                return mode === "create" && data?.login_enabled === true;
              },
              render: (field, formData, onChange) => (
                <PasswordField
                  field={field}
                  formData={formData}
                  onChange={onChange}
                />
              ),
            },
            {
              name: "security_section",
              label: "Security & Access",
              type: "text",
              colSpan: 2,
              conditional: (mode) => mode === "edit",
              render: () => (
                <div className="col-span-full mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200/50 dark:border-amber-900/20 group">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 transition-transform group-hover:rotate-12">
                        <KeyRound size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          Account Security
                        </p>
                        <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70 leading-relaxed max-w-[200px]">
                          Need to update access? You can safely reset the
                          company password here.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white dark:bg-gray-900 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 font-bold shadow-sm h-9 px-4 transition-all hover:scale-105 active:scale-95"
                      onClick={() => {
                        setIsFormModalOpen(false);
                        setIsResetPasswordModalOpen(true);
                      }}
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              ),
            },
          ],
          modalSize: "lg",
        }}
        initialData={{
          ...currentCompany,
          login_enabled: currentCompany?.status === "active",
        }}
        title={
          formMode === "create"
            ? "Add New Company"
            : formMode === "edit"
              ? "Edit Company"
              : "View Company"
        }
        mode={formMode}
        errors={errors}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentCompany?.name || ""}
        entityName="company"
      />

      {/* Reset Password Modal */}
      <CrudFormModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onSubmit={handleResetPasswordConfirm}
        formConfig={{
          fields: [
            {
              name: "security_info",
              label: "",
              type: "text",
              render: () => (
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-4 group transition-all hover:bg-primary/10">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                      <Lock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Security Notice</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Resetting the password will revoke all current active sessions for <b>{currentCompany?.name}</b>.
                      </p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              name: "password",
              label: "New Access Password",
              type: "password",
              required: true,
              render: (field, formData, onChange) => (
                <PasswordField
                  field={field}
                  formData={formData}
                  onChange={onChange}
                />
              ),
            },
          ],
          modalSize: "md",
        }}
        initialData={{}}
        title={`Reset Password`}
        description={`Securely update the login credentials for ${currentCompany?.name || "this company"}.`}
        mode="edit"
        errors={errors}
      />
    </PageTemplate>
  );
}
