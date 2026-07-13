"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EduPlatformLogo } from "@/components/brand/edu-platform-logo";
import { usePlatformBrand } from "@/components/brand/platform-brand-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  SlidersHorizontal,
  Search,
  Settings,
  Trophy,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";

const navByRole: Record<
  UserRole,
  Array<{ titleKey: string; href: string; icon: typeof BookOpen }>
> = {
  student: [
    { titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.allCourses", href: "/dashboard/student/browse", icon: Search },
    { titleKey: "nav.learningProgress", href: "/dashboard/student/courses", icon: BookOpen },
    { titleKey: "nav.certificates", href: "/dashboard/student/certificates", icon: Trophy },
    { titleKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
  ],
  teacher: [
    { titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.myCourses", href: "/dashboard/teacher/courses", icon: BookOpen },
    { titleKey: "nav.grading", href: "/dashboard/teacher/grading", icon: ClipboardCheck },
    { titleKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
  ],
  admin: [
    { titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.allCourses", href: "/dashboard/admin/courses", icon: LibraryBig },
    { titleKey: "nav.manageMaterials", href: "/dashboard/teacher/materials", icon: BookOpenCheck },
    { titleKey: "nav.users", href: "/dashboard/admin/users", icon: Users },
    { titleKey: "nav.teachers", href: "/dashboard/admin/teachers", icon: GraduationCap },
    { titleKey: "nav.studentProgress", href: "/dashboard/admin/progress", icon: TrendingUp },
    { titleKey: "nav.platform", href: "/dashboard/admin/settings", icon: SlidersHorizontal },
    { titleKey: "nav.account", href: "/dashboard/settings", icon: UserCog },
  ],
  super_admin: [
    { titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { titleKey: "nav.allCourses", href: "/dashboard/admin/courses", icon: LibraryBig },
    { titleKey: "nav.manageMaterials", href: "/dashboard/teacher/materials", icon: BookOpenCheck },
    { titleKey: "nav.grading", href: "/dashboard/teacher/grading", icon: ClipboardCheck },
    { titleKey: "nav.users", href: "/dashboard/admin/users", icon: Users },
    { titleKey: "nav.teachers", href: "/dashboard/admin/teachers", icon: GraduationCap },
    { titleKey: "nav.studentProgress", href: "/dashboard/admin/progress", icon: TrendingUp },
    { titleKey: "nav.platform", href: "/dashboard/admin/settings", icon: SlidersHorizontal },
    { titleKey: "nav.account", href: "/dashboard/settings", icon: UserCog },
  ],
};

export function DashboardSidebar() {
  const t = useTranslations();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { settings: platform } = usePlatformBrand();
  const role = session?.user.role || "student";
  const userName = session?.user.name || t("common.user");

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" className="border-r-2">
      <SidebarHeader className="h-18 justify-center border-b p-2">
        <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/"
            aria-label={t("nav.homeAria", { platform: platform.name })}
            onClick={closeMobileSidebar}
            className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
          >
            <EduPlatformLogo markClassName="size-8" wordmarkClassName="text-base" />
          </Link>
          <SidebarTrigger
            className="shrink-0 group-data-[collapsible=icon]:mx-auto"
            aria-label={t("nav.toggleSidebar")}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-3 group-data-[collapsible=icon]:p-2">
          <SidebarGroupLabel className="font-extrabold uppercase tracking-[.16em]">
            {t("nav.mainMenu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center">
              {navByRole[role].map(({ titleKey, href, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                const title = t(titleKey);
                return (
                  <SidebarMenuItem
                    key={`${href}-${titleKey}`}
                    className="group-data-[collapsible=icon]:w-fit"
                  >
                    <SidebarMenuButton
                      size="lg"
                      isActive={active}
                      tooltip={title}
                      render={<Link href={href} onClick={closeMobileSidebar} />}
                      className={cn(
                        "rounded-xl font-semibold group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full",
                        active &&
                          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                      )}
                    >
                      <Icon />
                      <span className="group-data-[collapsible=icon]:hidden">{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={`${userName} · ${t(`roles.${role}`)}`}
              render={<Link href="/dashboard/settings" onClick={closeMobileSidebar} />}
              className="h-14 rounded-xl group-data-[collapsible=icon]:justify-center"
            >
              <Avatar className="size-9 group-data-[collapsible=icon]:size-8">
                <AvatarImage src={session?.user.image || ""} />
                <AvatarFallback className="bg-secondary font-bold text-secondary-foreground">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-bold">{userName}</span>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {t(`roles.${role}`)}
                </Badge>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
