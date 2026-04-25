"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, CheckCircle2, Trophy, Loader2 } from "lucide-react";

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: "Selesai", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  certified: { label: "Bersertifikat", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const data = await api.get("/enrollments");
        setEnrollments(data || []);
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kursus Saya</h1>
        <p className="text-muted-foreground">Kelola dan lanjutkan kursus Anda</p>
      </div>
      
      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-accent/30 rounded-xl border border-dashed border-border">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Anda belum mendaftar kursus apapun</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/student/browse">Cari Kursus</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;
            const status = statusLabels[enrollment.status] || statusLabels.active;
            return (
              <Card key={enrollment.id} className="group border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                <div className={`relative h-32 overflow-hidden ${!course.thumbnail ? 'gradient-primary' : 'bg-muted'}`}>
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${course.thumbnail}` : course.thumbnail} 
                      alt={course.title} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className={`${status.className} border`}>{status.label}</Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">oleh Pengajar</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{enrollment.progress || 0}%</span>
                    </div>
                    <Progress value={enrollment.progress || 0} className="h-2" />
                  </div>
                  <Button size="sm" className="w-full gap-2" asChild>
                    <Link href={`/dashboard/student/courses/${course.id}`}>
                      {enrollment.status === "certified" ? (
                        <><Trophy className="h-3 w-3" /> Lihat Sertifikat</>
                      ) : enrollment.progress > 0 ? (
                        <><Play className="h-3 w-3" /> Lanjutkan Belajar</>
                      ) : (
                        <><Play className="h-3 w-3" /> Mulai Belajar</>
                      )}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
