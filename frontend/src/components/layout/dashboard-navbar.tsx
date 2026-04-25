"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useAppStore } from "@/lib/store";

import { setLocale as setLocaleCookie } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Shield,
  GraduationCap,
  UserCog,
  BookOpen,
  Menu,
  Globe,
  CheckCheck,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Pengajar",
  student: "Siswa",
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  super_admin: Shield,
  admin: UserCog,
  teacher: GraduationCap,
  student: BookOpen,
};



export function DashboardNavbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const intlLocale = useLocale();
  const { currentRole, sidebarOpen, toggleSidebar, locale, setLocale } = useAppStore();
  
  const userName = session?.user?.name || "Pengguna";
  
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const fetchNotifications = async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Optional: Polling every 1 minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif.id}/read`, {});
        setNotifications((prev) => 
          prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
    
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      {/* Left: Mobile menu + Breadcrumb area */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-muted-foreground">
            Selamat datang kembali,
          </h2>
          <p className="text-base font-semibold">{userName} 👋</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Role Badge */}
        <Badge variant="outline" className="gap-1.5 text-xs px-2.5 py-1 hidden sm:flex">
          {(() => {
            const Icon = roleIcons[currentRole] || BookOpen;
            return <Icon className="h-3.5 w-3.5" />;
          })()}
          {roleLabels[currentRole] || currentRole}
        </Badge>

        {/* Language */}
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            const newLocale = intlLocale === "id" ? "en" : "id";
            setLocale(newLocale);
            await setLocaleCookie(newLocale);
            router.refresh();
          }}
          className="h-9 w-9"
          title={intlLocale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
        >
          <Globe className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Notifikasi</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} baru
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-muted-foreground hover:text-primary gap-1" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Tandai semua</span>
                </Button>
              )}
            </div>
            <Separator />
            <ScrollArea className="h-[300px]">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors ${
                      !notif.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          !notif.isRead ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada notifikasi</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={session?.user?.image || ""} alt={userName} />
                <AvatarFallback className="gradient-primary text-white text-xs">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email || "Tidak ada email"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <User className="h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => router.push("/login")}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
