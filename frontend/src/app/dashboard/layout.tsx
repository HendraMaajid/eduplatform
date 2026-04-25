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
          "transition-all duration-300 min-h-screen flex flex-col",
          sidebarOpen ? "lg:ml-64" : "lg:ml-[70px]"
        )}
      >
        <DashboardNavbar />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
