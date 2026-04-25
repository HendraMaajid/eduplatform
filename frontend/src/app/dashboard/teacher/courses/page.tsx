"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Users, FileText, Plus, ArrowRight, Star, Loader2 } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  published: { label: "Aktif", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  draft: { label: "Draft", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const user = await api.get("/users/me");
        const data = await api.get(`/courses?teacherId=${user.id}`);
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch teacher courses", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kursus Saya</h1>
          <p className="text-muted-foreground">Kelola kursus yang Anda ajar</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-semibold">Belum Ada Kursus</h3>
          <p className="text-muted-foreground mb-4">Anda belum ditugaskan ke kursus manapun.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const status = statusConfig[course.status] || statusConfig.draft;
            return (
              <Card key={course.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className={`relative h-36 overflow-hidden ${!course.thumbnail ? 'gradient-primary' : 'bg-muted'}`}>
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${course.thumbnail}` : course.thumbnail} 
                      alt={course.title} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-14 w-14 text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className={`${status.className} border`}>{status.label}</Badge>
                  </div>
                  {course.rating > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 gap-1">
                        <Star className="h-3 w-3 fill-current" /> {course.rating}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <Badge variant="outline" className="text-xs mb-2">{course.category || "Umum"}</Badge>
                    <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-accent/50 p-2">
                      <p className="text-lg font-bold text-primary">{course.totalModules || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Modul</p>
                    </div>
                    <div className="rounded-lg bg-accent/50 p-2">
                      <p className="text-lg font-bold text-primary">{course.totalQuizzes || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Kuis</p>
                    </div>
                    <div className="rounded-lg bg-accent/50 p-2">
                      <p className="text-lg font-bold text-primary">{course.enrolledStudents || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Siswa</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1" asChild>
                      <Link href={`/dashboard/teacher/courses/${course.id}`}>
                        Kelola <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
