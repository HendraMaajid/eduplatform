"use client";

import { useAppStore } from "@/lib/store";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-[70px]"
        )}
      >
        <DashboardNavbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
