"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Trophy,
  Target,
  ArrowRight,
  Clock,
  Play,
  CheckCircle2,
  Loader2,
  FileText,
  FileQuestion,
} from "lucide-react";
import Link from "next/link";
import { stripHtml } from "@/lib/html-utils";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Baru saja";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Kemarin";
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  
  return date.toLocaleDateString("id-ID");
}

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  intermediate: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  advanced: "bg-red-500/10 text-red-600 border-red-500/20",
};

const levelLabels: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

export function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    enrolledCourses: 0,
    completedCourses: 0,
    certificates: 0,
    upcomingDeadlines: [],
    recentActivities: [],
  });
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, enrollmentsData] = await Promise.all([
          api.get("/dashboard/student"),
          api.get("/enrollments")
        ]);
        setStats(statsData || {
          enrolledCourses: 0,
          completedCourses: 0,
          certificates: 0,
          upcomingDeadlines: [],
          recentActivities: [],
        });
        setEnrollments(enrollmentsData || []);
      } catch (error) {
        console.error("Failed to fetch student dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Kursus Aktif", value: stats.enrolledCourses.toString(), icon: BookOpen, bgColor: "bg-indigo-500/10", iconColor: "text-indigo-500" },
    { title: "Kursus Selesai", value: stats.completedCourses.toString(), icon: CheckCircle2, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-500" },
    { title: "Sertifikat", value: stats.certificates.toString(), icon: Trophy, bgColor: "bg-amber-500/10", iconColor: "text-amber-500" },
    { title: "Skor Rata-rata", value: "82", icon: Target, bgColor: "bg-violet-500/10", iconColor: "text-violet-500" },
  ];

  const activeEnrollments = enrollments.filter((e) => e.status === "active").slice(0, 4);
  const upcomingDeadlines = stats.upcomingDeadlines || [];
  const recentActivities = stats.recentActivities || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Siswa</h1>
        <p className="text-muted-foreground">Lanjutkan perjalanan belajar Anda</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} rounded-xl p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Courses */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Kursus Aktif</CardTitle>
            <CardDescription>Lanjutkan belajar dari terakhir Anda berhenti</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/dashboard/student/courses">
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeEnrollments.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Belum ada kursus aktif. Mulai jelajahi kursus!
              </div>
            ) : (
              activeEnrollments.map((enrollment) => {
                const course = enrollment.course;
                if (!course) return null;
                return (
                  <div
                    key={enrollment.id}
                    className="group relative rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <BookOpen className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          oleh {course.teacher?.name || "Pengajar"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-[10px] ${levelColors[course.level]}`}>
                            {levelLabels[course.level]}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>

                    <Button size="sm" className="w-full mt-4 gap-2" asChild>
                      <Link href={`/dashboard/student/courses/${course.id}`}>
                        <Play className="h-4 w-4" /> Lanjutkan Belajar
                      </Link>
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Tenggat Waktu Mendatang</CardTitle>
            <CardDescription>Tugas yang harus segera dikumpulkan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                Tidak ada tenggat waktu dalam waktu dekat.
              </div>
            ) : upcomingDeadlines.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{stripHtml(assignment.description)}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {new Date(assignment.deadline).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
            <CardDescription>Aktivitas belajar terbaru Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                Belum ada aktivitas.
              </div>
            ) : recentActivities.map((activity: any) => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.type === 'assignment' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                  }`}>
                    {activity.type === 'assignment' ? (
                      <FileText className="h-4 w-4 text-blue-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
