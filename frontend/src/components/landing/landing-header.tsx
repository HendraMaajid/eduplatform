"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EduPlatformLogo } from "@/components/brand/edu-platform-logo";

const navigation = [
  { href: "/#courses", labelKey: "courses" },
  { href: "/#how", labelKey: "howToLearn" },
  { href: "/#about", labelKey: "about" },
];

export function LandingHeader({ platformName }: { platformName: string }) {
  const t = useTranslations("landing");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const name = session?.user.name || common("user");
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="relative z-40 border-b bg-background/95">
      <div className="page-shell flex h-18 items-center justify-between gap-4">
        <Link href="/" aria-label={t("homeAria", { platform: platformName })}>
          <EduPlatformLogo platformName={platformName} wordmarkClassName="text-lg" />
        </Link>
        <nav
          className="hidden items-center gap-7 text-sm font-semibold md:flex"
          aria-label={t("mainNavigation")}
        >
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-primary">
              {t(`header.${item.labelKey}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("toggleTheme")}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden dark:block" />
            <Moon className="block dark:hidden" />
          </Button>
          {status === "loading" ? (
            <Skeleton className="h-10 w-28 rounded-xl" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-xl">
                <div className="flex h-10 items-center gap-2 rounded-xl border bg-card px-2.5 transition-colors hover:bg-muted">
                  <Avatar size="sm">
                    <AvatarImage src={session.user.image || ""} alt={name} />
                    <AvatarFallback className="bg-primary font-bold text-primary-foreground">
                      {initials || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm font-bold sm:block">
                    {name.split(" ")[0]}
                  </span>
                  <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <span className="block truncate font-semibold text-foreground">{name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {session.user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/dashboard" />}>
                    <LayoutDashboard />
                    {t("backToDashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                    <Settings />
                    {t("settings")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void signOut({ callbackUrl: "/" })}
                  >
                    <LogOut />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild className="h-10 px-4 playful-shadow">
                <Link href="/register">
                  {t("startLearning")}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b-2 bg-background p-4 shadow-lg md:hidden"
          aria-label={t("mobileNavigation")}
        >
          <div className="page-shell flex flex-col gap-1 px-0">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-muted"
              >
                {t(`header.${item.labelKey}`)}
              </Link>
            ))}
            {!session && status !== "loading" ? (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-muted sm:hidden"
              >
                {t("login")}
              </Link>
            ) : null}
          </div>
        </nav>
      )}
    </header>
  );
}
