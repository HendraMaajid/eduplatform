"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Course, PaginatedResponse, Submission, TeacherStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLoadError } from "./dashboard-load-error";
import { ArrowRight, BookOpen, ClipboardCheck, Star, Users } from "lucide-react";
export function TeacherDashboard() {
  const t = useTranslations("teacherOverview");
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get<TeacherStats>("/dashboard/teacher"),
      api.get<PaginatedResponse<Course>>("/manage/courses?limit=4"),
      api.get<Submission[]>("/manage/submissions"),
    ])
      .then(([s, c, sub]) => {
        setStats(s);
        setCourses(c.data);
        setSubmissions(sub.filter((x) => x.status === "submitted"));
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t("loadError"));
      });
  }, [t]);
  if (error) return <DashboardLoadError message={error} />;
  if (!stats) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t("courses"), stats.totalCourses, BookOpen],
          [t("learningStudents"), stats.totalStudents, Users],
          [t("pendingGrading"), stats.pendingSubmissions, ClipboardCheck],
          [t("rating"), stats.averageRating || 0, Star],
        ].map(([l, v, I]) => {
          const Icon = I as typeof BookOpen;
          return (
            <Card key={l as string} className="border-2">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{l as string}</p>
                  <p className="text-3xl font-extrabold">{v as number}</p>
                </div>
                <Icon className="size-7 text-primary" />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardContent>
            <div className="mb-4 flex justify-between">
              <h2 className="font-extrabold">{t("recentCourses")}</h2>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/teacher/courses">
                  {t("manage")}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/teacher/courses/${c.id}`}
                className="flex items-center justify-between border-t py-3"
              >
                <span className="font-semibold">{c.title}</span>
                <span className="text-xs text-muted-foreground">{c.status}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent>
            <div className="mb-4 flex justify-between">
              <h2 className="font-extrabold">{t("gradingQueue")}</h2>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/teacher/grading">
                  {t("open")}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            {submissions.length ? (
              submissions.slice(0, 5).map((s) => (
                <div key={s.id} className="border-t py-3">
                  <p className="font-semibold">{s.student?.name || t("student")}</p>
                  <p className="text-xs text-muted-foreground">{s.assignment?.title}</p>
                </div>
              ))
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClipboardCheck />
                  </EmptyMedia>
                  <EmptyTitle>{t("allGraded")}</EmptyTitle>
                  <EmptyDescription>{t("noPendingSubmissions")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
