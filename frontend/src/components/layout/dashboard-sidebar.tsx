"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  FileText,
  ClipboardCheck,
  Trophy,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  FileText,
  ClipboardCheck,
  Trophy,
  CreditCard,
  Search,
  Shield,
  UserCog,
};

interface NavItemConfig {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

const navConfig: Record<string, NavItemConfig[]> = {
  super_admin: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Kelola Kursus", href: "/dashboard/admin/courses", icon: "BookOpen" },
    { title: "Kelola Pengguna", href: "/dashboard/admin/users", icon: "Users" },
    { title: "Kelola Pengajar", href: "/dashboard/admin/teachers", icon: "GraduationCap" },
    { title: "Pengaturan", href: "/dashboard/admin/settings", icon: "Settings" },
  ],
  admin: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Kelola Kursus", href: "/dashboard/admin/courses", icon: "BookOpen" },
    { title: "Kelola Pengguna", href: "/dashboard/admin/users", icon: "Users" },
    { title: "Kelola Pengajar", href: "/dashboard/admin/teachers", icon: "GraduationCap" },
  ],
  teacher: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Kursus Saya", href: "/dashboard/teacher/courses", icon: "BookOpen" },
    { title: "Penilaian", href: "/dashboard/teacher/grading", icon: "ClipboardCheck" },
  ],
  student: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Kursus Saya", href: "/dashboard/student/courses", icon: "BookOpen" },
    { title: "Jelajahi Kursus", href: "/dashboard/student/browse", icon: "Search" },
    { title: "Pembayaran", href: "/dashboard/student/payments", icon: "CreditCard" },
    { title: "Sertifikat", href: "/dashboard/student/certificates", icon: "Trophy" },
  ],
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Pengajar",
  student: "Siswa",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
  admin: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  teacher: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  student: "bg-green-500/10 text-green-500 border-green-500/20",
};

export function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { currentRole, sidebarOpen, toggleSidebar, setCurrentRole } = useAppStore();
  const userName = session?.user?.name || "Pengguna";
  const items = navConfig[currentRole] || [];

  const [pendingGrading, setPendingGrading] = useState(0);

  // Sync current role from session (only on login/session change, not on manual switch)
  useEffect(() => {
    const sessionRole = (session?.user as any)?.role;
    if (sessionRole) {
      setCurrentRole(sessionRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (currentRole === "teacher") {
      api.get("/submissions/teacher")
        .then(data => {
          if (Array.isArray(data)) {
            setPendingGrading(data.filter(s => s.status === "submitted").length);
          }
        })
        .catch(err => console.error("Failed to fetch pending submissions for sidebar", err));
    }
  }, [currentRole, pathname]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-[70px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">EduPlatform</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8 shrink-0", !sidebarOpen && "mx-auto")}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {items.map((baseItem) => {
            const item = { ...baseItem };
            if (item.href === "/dashboard/teacher/grading" && pendingGrading > 0) {
              item.badge = pendingGrading;
            }
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            const navLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !sidebarOpen && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 min-w-5 flex items-center justify-center text-xs",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.title}
                    {item.badge && (
                      <Badge variant="secondary" className="h-5 min-w-5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navLink;
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2",
            !sidebarOpen && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={session?.user?.image || ""} alt={userName} />
            <AvatarFallback className="gradient-primary text-white text-xs">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{userName}</p>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", roleColors[currentRole])}
              >
                {roleLabels[currentRole]}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
