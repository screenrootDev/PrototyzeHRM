import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useSidebarSettings } from "@/contexts/SidebarContext";
import { useBrand } from "@/contexts/BrandContext";
import { type NavItem } from "@/types";
import { Link, usePage, router } from "@inertiajs/react";
import {
  BookOpen,
  Folder,
  LayoutGrid,
  ShoppingBag,
  Users,
  Tag,
  FileIcon,
  Settings,
  BarChart,
  Barcode,
  FileText,
  Briefcase,
  CheckSquare,
  Calendar,
  CreditCard,
  Ticket,
  Gift,
  DollarSign,
  MessageSquare,
  CalendarDays,
  Palette,
  Image,
  Mail,
  Mail as VCard,
  ChevronDown,
  Building2,
  Globe,
  Clock,
  Timer,
  Coins,
  Fingerprint,
  IndianRupee,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import AppLogo from "./app-logo";
import { useEffect, useState, useRef } from "react";

import { hasPermission } from "@/utils/authorization";
import { toast } from "@/components/custom-toast";
import { getImagePath } from "@/utils/helpers";
import { getCompanyId } from "@/utils/helpers";

import {
  LayoutGridIcon,
  HouseIcon,
  LayersIcon,
  SparklesIcon,
  SettingsIcon,
  UsersIcon,
  ClipboardIcon,
  FolderIcon,
  FolderOpenIcon,
  DashboardIcon,
  UsersRoundIcon,
  UserCheckIcon,
  UserPlusIcon,
  MessageCircleIcon,
  LayoutListIcon,
} from "@animateicons/react/lucide";

export function AppSidebar() {
  const { auth, globalSettings, companySlug, active_modules = [] } = usePage().props as any;
  const userRole = auth.user?.type || auth.user?.role;
  const permissions = auth?.permissions || [];
  const isSaas = globalSettings?.is_saas;

  const isModuleEnabled = (module: string) => active_modules.includes(module);

  // Get current direction
  const isRtl = document.documentElement.dir === "rtl";

  // Business switch handler removed

  const getSuperAdminNavItems = (): NavItem[] => [
    {
      title: "Dashboard",
      href: route("dashboard"),
      icon: () => <LayoutGridIcon size={16} isAnimated={true} />,
    },

    {
      title: "Companies",
      href: route("companies.index"),
      icon: () => <HouseIcon size={16} isAnimated={true} />,
    },
    {
      title: "Media Library",
      href: route("media-library"),
      icon: () => <LayersIcon size={16} isAnimated={true} />,
    },

    {
      title: "Landing Page",
      icon: () => <SparklesIcon size={16} isAnimated={true} />,
      children: [
        {
          title: "Landing Page",
          href: route("landing-page"),
        },
        {
          title: "Custom Pages",
          href: route("landing-page.custom-pages.index"),
        },
      ],
    },
    // {
    //     title: 'Email Templates',
    //     href: route('email-templates.index'),
    //     icon: Mail,
    // },
    {
      title: "Settings",
      href: route("settings"),
      icon: () => <SettingsIcon size={16} isAnimated={true} />,
    },
  ];

  const getCompanyNavItems = (): NavItem[] => {
    const items: NavItem[] = [];
    // Dashboard - only show if user has dashboard permission
    if (hasPermission(permissions, "manage-dashboard")) {
      items.push({
        title: "Dashboard",
        href: route("dashboard"),
        icon: () => <LayoutGridIcon size={16} isAnimated={true} />,
      });
    }

    // Staff section - only show if user has any staff-related permissions
    const staffChildren = [];
    if (hasPermission(permissions, "manage-users")) {
      staffChildren.push({
        title: "Users",
        href: route("users.index"),
      });
    }
    if (hasPermission(permissions, "manage-roles")) {
      staffChildren.push({
        title: "Roles",
        href: route("roles.index"),
      });
    }
    if (staffChildren.length > 0) {
      items.push({
        title: "Staff",
        icon: () => <UsersIcon size={16} isAnimated={true} />,
        children: staffChildren,
      });
    }

    // Other menu items with permission checks

    // HR Module
    const hrChildren = [];
    if (hasPermission(permissions, "manage-branches")) {
      hrChildren.push({
        title: "Branches",
        href: route("hr.branches.index"),
      });
    }

    if (hasPermission(permissions, "manage-departments")) {
      hrChildren.push({
        title: "Departments",
        href: route("hr.departments.index"),
      });
    }

    if (hasPermission(permissions, "manage-designations")) {
      hrChildren.push({
        title: "Designations",
        href: route("hr.designations.index"),
      });
    }

    if (hasPermission(permissions, "manage-document-types")) {
      hrChildren.push({
        title: "Document Types",
        href: route("hr.document-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-employees")) {
      hrChildren.push({
        title: "Employees",
        href: route("hr.employees.index"),
      });
    }

    if (hasPermission(permissions, "manage-award-types")) {
      hrChildren.push({
        title: "Award Types",
        href: route("hr.award-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-awards")) {
      hrChildren.push({
        title: "Awards",
        href: route("hr.awards.index"),
      });
    }

    if (hasPermission(permissions, "manage-promotions")) {
      hrChildren.push({
        title: "Promotions",
        href: route("hr.promotions.index"),
      });
    }

    // Performance Module
    const performanceChildren = [];

    if (hasPermission(permissions, "manage-performance-indicator-categories")) {
      performanceChildren.push({
        title: "Indicator Categories",
        href: route("hr.performance.indicator-categories.index"),
      });
    }

    if (hasPermission(permissions, "manage-performance-indicators")) {
      performanceChildren.push({
        title: "Indicators",
        href: route("hr.performance.indicators.index"),
      });
    }

    if (hasPermission(permissions, "manage-goal-types")) {
      performanceChildren.push({
        title: "Goal Types",
        href: route("hr.performance.goal-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-employee-goals")) {
      performanceChildren.push({
        title: "Employee Goals",
        href: route("hr.performance.employee-goals.index"),
      });
    }

    if (hasPermission(permissions, "manage-review-cycles")) {
      performanceChildren.push({
        title: "Review Cycles",
        href: route("hr.performance.review-cycles.index"),
      });
    }

    if (hasPermission(permissions, "manage-employee-reviews")) {
      performanceChildren.push({
        title: "Employee Reviews",
        href: route("hr.performance.employee-reviews.index"),
      });
    }

    if (isModuleEnabled("performance") && performanceChildren.length > 0) {
      hrChildren.push({
        title: "Performance",
        children: performanceChildren,
      });
    }

    if (hasPermission(permissions, "manage-resignations")) {
      hrChildren.push({
        title: "Resignations",
        href: route("hr.resignations.index"),
      });
    }

    if (hasPermission(permissions, "manage-terminations")) {
      hrChildren.push({
        title: "Terminations",
        href: route("hr.terminations.index"),
      });
    }

    if (hasPermission(permissions, "manage-warnings")) {
      hrChildren.push({
        title: "Warnings",
        href: route("hr.warnings.index"),
      });
    }

    if (hasPermission(permissions, "manage-trips")) {
      hrChildren.push({
        title: "Trips",
        href: route("hr.trips.index"),
      });
    }

    if (hasPermission(permissions, "manage-complaints")) {
      hrChildren.push({
        title: "Complaints",
        href: route("hr.complaints.index"),
      });
    }

    if (hasPermission(permissions, "manage-employee-transfers")) {
      hrChildren.push({
        title: "Transfers",
        href: route("hr.transfers.index"),
      });
    }

    if (hasPermission(permissions, "manage-holidays")) {
      hrChildren.push({
        title: "Holidays",
        href: route("hr.holidays.index"),
      });
    }

    if (hasPermission(permissions, "manage-announcements")) {
      hrChildren.push({
        title: "Announcements",
        href: route("hr.announcements.index"),
      });
    }

    // Asset Management submenu
    const assetChildren = [];

    if (hasPermission(permissions, "manage-asset-types")) {
      assetChildren.push({
        title: "Asset Types",
        href: route("hr.asset-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-assets")) {
      assetChildren.push({
        title: "Assets",
        href: route("hr.assets.index"),
      });
    }

    if (hasPermission(permissions, "manage-assets")) {
      assetChildren.push({
        title: "Dashboard",
        href: route("hr.assets.dashboard"),
      });
    }

    if (hasPermission(permissions, "manage-assets")) {
      assetChildren.push({
        title: "Depreciation",
        href: route("hr.assets.depreciation-report"),
      });
    }

    if (isModuleEnabled("assets") && assetChildren.length > 0) {
      hrChildren.push({
        title: "Asset Management",
        children: assetChildren,
      });
    }

    // Training Management submenu
    const trainingChildren = [];

    if (hasPermission(permissions, "manage-training-types")) {
      trainingChildren.push({
        title: "Training Types",
        href: route("hr.training-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-training-programs")) {
      trainingChildren.push({
        title: "Training Programs",
        href: route("hr.training-programs.index"),
      });
    }

    if (hasPermission(permissions, "manage-training-sessions")) {
      trainingChildren.push({
        title: "Training Sessions",
        href: route("hr.training-sessions.index"),
      });
    }

    if (hasPermission(permissions, "manage-employee-trainings")) {
      trainingChildren.push({
        title: "Employee Trainings",
        href: route("hr.employee-trainings.index"),
      });
    }

    // end

    if (isModuleEnabled("training") && trainingChildren.length > 0) {
      hrChildren.push({
        title: "Training",
        children: trainingChildren,
      });
    }

    if (hrChildren.length > 0) {
      items.push({
        title: "HR Management",
        icon: () => <HouseIcon size={16} isAnimated={true} />,
        children: hrChildren,
      });
    }

    // Recruitment Management as separate menu
    const recruitmentChildren = [];

    if (hasPermission(permissions, "manage-job-categories")) {
      recruitmentChildren.push({
        title: "Job Categories",
        href: route("hr.recruitment.job-categories.index"),
      });
    }

    // if (hasPermission(permissions, 'manage-job-requisitions')) {
    //     recruitmentChildren.push({
    //         title: 'Job Requisitions',
    //         href: route('hr.recruitment.job-requisitions.index')
    //     });
    // }

    if (hasPermission(permissions, "manage-job-types")) {
      recruitmentChildren.push({
        title: "Job Types",
        href: route("hr.recruitment.job-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-job-locations")) {
      recruitmentChildren.push({
        title: "Job Locations",
        href: route("hr.recruitment.job-locations.index"),
      });
    }

    if (hasPermission(permissions, "manage-custom-questions")) {
      recruitmentChildren.push({
        title: "Custom Questions",
        href: route("hr.recruitment.custom-questions.index"),
      });
    }

    if (hasPermission(permissions, "manage-job-postings")) {
      recruitmentChildren.push({
        title: "Job Postings",
        href: route("hr.recruitment.job-postings.index"),
      });
    }

    if (hasPermission(permissions, "manage-candidate-sources")) {
      recruitmentChildren.push({
        title: "Candidate Sources",
        href: route("hr.recruitment.candidate-sources.index"),
      });
    }

    if (hasPermission(permissions, "manage-candidates")) {
      recruitmentChildren.push({
        title: "Candidates",
        href: route("hr.recruitment.candidates.index"),
      });
    }

    if (hasPermission(permissions, "manage-interview-types")) {
      recruitmentChildren.push({
        title: "Interview Types",
        href: route("hr.recruitment.interview-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-interview-rounds")) {
      recruitmentChildren.push({
        title: "Interview Rounds",
        href: route("hr.recruitment.interview-rounds.index"),
      });
    }

    if (hasPermission(permissions, "manage-interviews")) {
      recruitmentChildren.push({
        title: "Interviews",
        href: route("hr.recruitment.interviews.index"),
      });
    }

    if (hasPermission(permissions, "manage-interview-feedback")) {
      recruitmentChildren.push({
        title: "Interview Feedback",
        href: route("hr.recruitment.interview-feedback.index"),
      });
    }

    if (hasPermission(permissions, "manage-candidate-assessments")) {
      recruitmentChildren.push({
        title: "Candidate Assessments",
        href: route("hr.recruitment.candidate-assessments.index"),
      });
    }

    if (hasPermission(permissions, "manage-offer-templates")) {
      recruitmentChildren.push({
        title: "Offer Templates",
        href: route("hr.recruitment.offer-templates.index"),
      });
    }

    if (hasPermission(permissions, "manage-offers")) {
      recruitmentChildren.push({
        title: "Offers",
        href: route("hr.recruitment.offers.index"),
      });
    }

    if (hasPermission(permissions, "manage-onboarding-checklists")) {
      recruitmentChildren.push({
        title: "Onboarding Checklists",
        href: route("hr.recruitment.onboarding-checklists.index"),
      });
    }

    if (hasPermission(permissions, "manage-checklist-items")) {
      recruitmentChildren.push({
        title: "Checklist Items",
        href: route("hr.recruitment.checklist-items.index"),
      });
    }

    if (hasPermission(permissions, "manage-candidate-onboarding")) {
      recruitmentChildren.push({
        title: "Candidate Onboarding",
        href: route("hr.recruitment.candidate-onboarding.index"),
      });
    }

    // Add Career menu item
    if (hasPermission(permissions, "manage-career-page")) {
      if (companySlug) {
        recruitmentChildren.push({
          title: "Career",
          href: route("career.index", companySlug),
          target: "_blank",
        });
      }
    }

    if (isModuleEnabled("recruitment") && recruitmentChildren.length > 0) {
      items.push({
        title: "Recruitment",
        icon: () => <UsersRoundIcon size={16} isAnimated={true} />,
        children: recruitmentChildren,
      });
    }

    // Contract Management as separate menu
    const contractChildren = [];

    if (hasPermission(permissions, "manage-contract-types")) {
      contractChildren.push({
        title: "Contract Types",
        href: route("hr.contracts.contract-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-employee-contracts")) {
      contractChildren.push({
        title: "Employee Contracts",
        href: route("hr.contracts.employee-contracts.index"),
      });
    }

    // if (hasPermission(permissions, 'manage-contract-renewals')) {
    //     contractChildren.push({
    //         title: 'Contract Renewals',
    //         href: route('hr.contracts.contract-renewals.index')
    //     });
    // }

    if (hasPermission(permissions, "manage-contract-templates")) {
      contractChildren.push({
        title: "Contract Templates",
        href: route("hr.contracts.contract-templates.index"),
      });
    }

    if (isModuleEnabled("contracts") && contractChildren.length > 0) {
      items.push({
        title: "Contract Management",
        icon: () => <ClipboardIcon size={16} isAnimated={true} />,
        children: contractChildren,
      });
    }

    // Document Management as separate menu
    const documentChildren = [];

    if (hasPermission(permissions, "manage-document-categories")) {
      documentChildren.push({
        title: "Document Categories",
        href: route("hr.documents.document-categories.index"),
      });
    }

    if (hasPermission(permissions, "manage-hr-documents")) {
      documentChildren.push({
        title: "HR Documents",
        href: route("hr.documents.hr-documents.index"),
      });
    }

    if (hasPermission(permissions, "manage-document-acknowledgments")) {
      documentChildren.push({
        title: "Acknowledgments",
        href: route("hr.documents.document-acknowledgments.index"),
      });
    }

    if (hasPermission(permissions, "manage-document-templates")) {
      documentChildren.push({
        title: "Document Templates",
        href: route("hr.documents.document-templates.index"),
      });
    }

    if (isModuleEnabled("documents") && documentChildren.length > 0) {
      items.push({
        title: "Document Management",
        icon: () => <FolderOpenIcon size={16} isAnimated={true} />,
        children: documentChildren,
      });
    }

    // Meeting Management submenu
    const meetingChildren = [];

    if (hasPermission(permissions, "manage-meeting-types")) {
      meetingChildren.push({
        title: "Meeting Types",
        href: route("meetings.meeting-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-meeting-rooms")) {
      meetingChildren.push({
        title: "Meeting Rooms",
        href: route("meetings.meeting-rooms.index"),
      });
    }

    if (hasPermission(permissions, "manage-meetings")) {
      meetingChildren.push({
        title: "Meetings",
        href: route("meetings.meetings.index"),
      });
    }

    if (hasPermission(permissions, "manage-meeting-attendees")) {
      meetingChildren.push({
        title: "Meeting Attendees",
        href: route("meetings.meeting-attendees.index"),
      });
    }

    if (hasPermission(permissions, "manage-meeting-minutes")) {
      meetingChildren.push({
        title: "Meeting Minutes",
        href: route("meetings.meeting-minutes.index"),
      });
    }

    if (hasPermission(permissions, "manage-action-items")) {
      meetingChildren.push({
        title: "Action Items",
        href: route("meetings.action-items.index"),
      });
    }

    if (isModuleEnabled("meetings") && meetingChildren.length > 0) {
      items.push({
        title: "Meetings",
        icon: () => <MessageCircleIcon size={16} isAnimated={true} />,
        children: meetingChildren,
      });
    }

    if (
      hasPermission(permissions, "view-calendar") ||
      hasPermission(permissions, "manage-calendar")
    ) {
      items.push({
        title: "Calendar",
        href: route("calendar.index"),
        icon: () => <LayoutListIcon size={16} isAnimated={true} />,
      });
    }

    if (hasPermission(permissions, "manage-media")) {
      items.push({
        title: "Media Library",
        href: route("media-library"),
        icon: () => <LayersIcon size={16} isAnimated={true} />,
      });
    }

    // Leave Management as separate menu
    const leaveChildren = [];

    if (hasPermission(permissions, "manage-leave-types")) {
      leaveChildren.push({
        title: "Leave Types",
        href: route("hr.leave-types.index"),
      });
    }

    if (hasPermission(permissions, "manage-leave-policies")) {
      leaveChildren.push({
        title: "Leave Policies",
        href: route("hr.leave-policies.index"),
      });
    }

    if (hasPermission(permissions, "manage-leave-applications")) {
      leaveChildren.push({
        title: "Leave Applications",
        href: route("hr.leave-applications.index"),
      });
    }

    if (hasPermission(permissions, "manage-leave-balances")) {
      leaveChildren.push({
        title: "Leave Balances",
        href: route("hr.leave-balances.index"),
      });
    }

    if (isModuleEnabled("leave") && leaveChildren.length > 0) {
      items.push({
        title: "Leave Management",
        icon: () => <LayoutListIcon size={16} isAnimated={true} />,
        children: leaveChildren,
      });
    }

    // Attendance Management as separate menu
    const attendanceChildren = [];

    if (hasPermission(permissions, "manage-shifts")) {
      attendanceChildren.push({
        title: "Shifts",
        href: route("hr.shifts.index"),
      });
    }

    if (hasPermission(permissions, "manage-attendance-policies")) {
      attendanceChildren.push({
        title: "Attendance Policies",
        href: route("hr.attendance-policies.index"),
      });
    }

    if (hasPermission(permissions, "manage-attendance-records")) {
      attendanceChildren.push({
        title: "Attendance Records",
        href: route("hr.attendance-records.index"),
      });
    }

    if (hasPermission(permissions, "manage-attendance-regularizations")) {
      attendanceChildren.push({
        title: "Attendance Regularizations",
        href: route("hr.attendance-regularizations.index"),
      });
    }

    if (isModuleEnabled("attendance") && attendanceChildren.length > 0) {
      items.push({
        title: "Attendance",
        icon: () => <UserCheckIcon size={16} isAnimated={true} />,
        children: attendanceChildren,
      });
    }

    // Biometric Attendance
    if (isModuleEnabled("biometric") && hasPermission(permissions, "manage-biometric-attendance")) {
      items.push({
        title: "Biometric Attendance",
        href: route("hr.biometric-attendance.index"),
        icon: () => <UserCheckIcon size={16} isAnimated={true} />,
      });
    }

    // Time Tracking as separate menu
    const timeTrackingChildren = [];

    if (hasPermission(permissions, "manage-time-entries")) {
      timeTrackingChildren.push({
        title: "Time Entries",
        href: route("hr.time-entries.index"),
      });
    }

    if (isModuleEnabled("time_tracking") && timeTrackingChildren.length > 0) {
      items.push({
        title: "Time Tracking",
        icon: () => <LayoutListIcon size={16} isAnimated={true} />,
        children: timeTrackingChildren,
      });
    }

    // Payroll Management as separate menu
    const payrollChildren = [];

    if (hasPermission(permissions, "manage-salary-components")) {
      payrollChildren.push({
        title: "Salary Components",
        href: route("hr.salary-components.index"),
      });
    }

    if (hasPermission(permissions, "manage-employee-salaries")) {
      payrollChildren.push({
        title: "Employee Salaries",
        href: route("hr.employee-salaries.index"),
      });
    }

    if (hasPermission(permissions, "manage-payroll-runs")) {
      payrollChildren.push({
        title: "Payroll Runs",
        href: route("hr.payroll-runs.index"),
      });
    }

    if (hasPermission(permissions, "manage-payslips")) {
      payrollChildren.push({
        title: "Payslips",
        href: route("hr.payslips.index"),
      });
    }

    if (isModuleEnabled("payroll") && payrollChildren.length > 0) {
      items.push({
        title: "Payroll Management",
        icon: () => <IndianRupee size={16} />,
        children: payrollChildren,
      });
    }

    // Landing Page - only show in non-SaaS mode for company users
    if (!isSaas && hasPermission(permissions, "manage-landing-page")) {
      items.push({
        title: "Landing Page",
        icon: () => <SparklesIcon size={16} isAnimated={true} />,
        children: [
          {
            title: "Landing Page",
            href: route("landing-page"),
          },
          {
            title: "Custom Pages",
            href: route("landing-page.custom-pages.index"),
          },
        ],
      });
    }

    if (hasPermission(permissions, "manage-settings")) {
      items.push({
        title: "Settings",
        href: route("settings"),
        icon: () => <SettingsIcon size={16} isAnimated={true} />,
      });
    }

    return items;
  };

  const mainNavItems =
    userRole === "superadmin" ? getSuperAdminNavItems() : getCompanyNavItems();

  const { position, effectivePosition } = useLayout();
  const { variant, collapsible, style } = useSidebarSettings();
  const { logoLight, logoDark, favicon, updateBrandSettings } = useBrand();
  const [sidebarStyle, setSidebarStyle] = useState({});

  useEffect(() => {
    // Apply styles based on sidebar style
    if (style === "colored") {
      setSidebarStyle({ backgroundColor: "var(--primary)", color: "white" });
    } else if (style === "gradient") {
      setSidebarStyle({
        background:
          "linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary), transparent 20%))",
        color: "white",
      });
    } else {
      setSidebarStyle({});
    }
  }, [style]);

  const filteredNavItems = mainNavItems;

  // Get the first available menu item's href for logo link
  const getFirstAvailableHref = () => {
    if (filteredNavItems.length === 0) return route("dashboard");

    const firstItem = filteredNavItems[0];
    if (firstItem.href) {
      return firstItem.href;
    } else if (firstItem.children && firstItem.children.length > 0) {
      return firstItem.children[0].href || route("dashboard");
    }
    return route("dashboard");
  };

  return (
    <Sidebar
      side={effectivePosition}
      collapsible={collapsible}
      variant={variant}
      className={style !== "plain" ? "sidebar-custom-style" : ""}
    >
      <SidebarHeader
        className={style !== "plain" ? "sidebar-styled" : ""}
        style={sidebarStyle}
      >
        <div className="flex justify-center items-center p-2">
          <Link
            href={getFirstAvailableHref()}
            prefetch
            className="flex items-center justify-center"
          >
            {/* Logo for expanded sidebar */}
            <div className="group-data-[collapsible=icon]:hidden flex items-center">
              {(() => {
                const isDark =
                  document.documentElement.classList.contains("dark");
                const currentLogo = isDark ? logoLight : logoDark;
                const displayUrl = getImagePath(currentLogo) ?? currentLogo;

                return displayUrl ? (
                  <img
                    key={`${currentLogo}-${Date.now()}`}
                    src={displayUrl}
                    alt="Logo"
                    className="w-auto transition-all duration-200"
                    onError={() =>
                      updateBrandSettings({
                        [isDark ? "logoLight" : "logoDark"]: "",
                      })
                    }
                  />
                ) : (
                  <div className="h-12 text-inherit font-semibold flex items-center text-lg tracking-tight">
                    PrototyzeHRM
                  </div>
                );
              })()}
            </div>

            {/* Icon for collapsed sidebar */}
            <div className="h-8 w-8 hidden group-data-[collapsible=icon]:block">
              {(() => {
                const displayCollapsibleLogo = getImagePath(
                  "logo/collapsible-logo.svg",
                );

                return (
                  <img
                    src={displayCollapsibleLogo}
                    alt="Icon"
                    className="h-8 w-8 transition-all duration-200"
                    onError={(e) => {
                      // Fallback to favicon if collapsible logo fails
                      if (favicon) {
                        (e.target as HTMLImageElement).src =
                          getImagePath(favicon);
                      }
                    }}
                  />
                );
              })()}
            </div>
          </Link>
        </div>

        {/* Business Switcher removed */}
      </SidebarHeader>

      <SidebarContent>
        <div
          style={sidebarStyle}
          className={`h-full ${style !== "plain" ? "sidebar-styled" : ""}`}
        >
          <NavMain items={filteredNavItems} position={effectivePosition} />
        </div>
      </SidebarContent>

      <SidebarFooter>
        {/* <NavFooter items={footerNavItems} className="mt-auto" position={position} /> */}
        {/* Profile menu moved to header */}
      </SidebarFooter>
    </Sidebar>
  );
}
