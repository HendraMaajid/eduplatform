"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mockCourses, mockSubmissions } from "@/lib/mock-data";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Star,
  ArrowRight,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, coursesData, submissionsData] = await Promise.all([
          api.get("/dashboard/teacher"),
          // User must get their own profile to get their ID to filter courses.
          // Wait, the backend GetCourses(teacherId) takes a teacherId.
          // We can just get /dashboard/teacher and the backend GetTeacherSubmissions gets everything.
          // For now, let's just use empty string to let the backend figure out? No, GetCourses takes query param.
          // Wait, we need the teacher ID! Or we can just use the courses from /dashboard/teacher if it provided them.
          // Actually, let's just use api.get('/users/me') to get the user ID, then fetch courses.
          api.get("/users/me").then(user => api.get(`/courses?teacherId=${user.id}`)),
          api.get("/submissions/teacher")
        ]);
        setStats(statsData);
        setCourses(coursesData.slice(0, 3)); // Only show top 3
        setPendingSubmissions(submissionsData.filter((s: any) => s.status === "submitted").slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch teacher dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Kursus Saya", value: stats.totalCourses?.toString() || "0", icon: BookOpen, bgColor: "bg-indigo-500/10", iconColor: "text-indigo-500" },
    { title: "Total Siswa", value: stats.totalStudents?.toString() || "0", icon: Users, bgColor: "bg-violet-500/10", iconColor: "text-violet-500" },
    { title: "Menunggu Penilaian", value: stats.pendingSubmissions?.toString() || "0", icon: ClipboardCheck, bgColor: "bg-amber-500/10", iconColor: "text-amber-500" },
    { title: "Rating Rata-rata", value: "4.8", icon: Star, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-500" },
  ];

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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Pengajar</h1>
        <p className="text-muted-foreground">Kelola kursus dan pantau progress siswa Anda</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Courses */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Kursus Saya</CardTitle>
              <CardDescription>Kursus yang Anda ajar</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link href="/dashboard/teacher/courses">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length > 0 ? courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${course.thumbnail}` : course.thumbnail} 
                      alt={course.title} 
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.enrolledStudents || 0} siswa
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {course.totalModules || 0} modul
                      </span>
                    </div>
                  </div>
                  <Badge variant={course.status === "published" ? "default" : "secondary"}>
                    {course.status === "published" ? "Aktif" : "Draft"}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Belum ada kursus</p>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Menunggu Penilaian</CardTitle>
              <CardDescription>Tugas yang perlu Anda nilai</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link href="/dashboard/teacher/grading">
                Nilai Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSubmissions.length > 0 ? (
              pendingSubmissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={sub.student?.avatar} />
                    <AvatarFallback>{sub.student?.name?.slice(0, 2).toUpperCase() || "S"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sub.student?.name || "Siswa"}</p>
                    <p className="text-xs text-muted-foreground">{sub.fileName || "File Tugas"}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Menunggu
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Semua tugas sudah dinilai!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
