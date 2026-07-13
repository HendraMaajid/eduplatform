"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Settings, Sun } from "lucide-react";

export function DashboardNavbar() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const name = session?.user.name || "Pengguna";
  const room = session?.user.role === "student" ? t("learningRoom") : t("adminRoom");

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b-2 bg-background/95 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" aria-label="Buka navigasi" />
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{room}</p>
          <p className="font-extrabold">{t("hello", { name: name.split(" ")[0] })}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Ganti tema"
        >
          <Sun className="hidden dark:block" />
          <Moon className="block dark:hidden" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="size-9 cursor-pointer">
              <AvatarImage src={session?.user.image || ""} />
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate">{name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {session?.user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings />
              Profil & Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
