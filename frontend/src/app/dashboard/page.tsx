"use client";

import { useSession } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = session?.user?.role;

  if (role === "teacher") return <TeacherDashboard />;
  if (role === "student") return <StudentDashboard />;
  return <AdminDashboard />;
}
