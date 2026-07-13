"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { LearningProgress, StudentStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLoadError } from "./dashboard-load-error";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Trophy } from "lucide-react";

const emptyStats: StudentStats = {
  startedCourses: 0,
  completedCourses: 0,
  certificates: 0,
  upcomingDeadlines: [],
  recentActivities: [],
};
export function StudentDashboard() {
  const t = useTranslations("studentOverview");
  const format = useFormatter();
  const [stats, setStats] = useState(emptyStats);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get<StudentStats>("/dashboard/student"),
      api.get<LearningProgress[]>("/learning/progress"),
    ])
      .then(([s, p]) => {
        setStats(s);
        setProgress(p);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t("loadError"));
      })
      .finally(() => setLoading(false));
  }, [t]);
  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error) return <DashboardLoadError message={error} />;

  const statItems = [
    {
      label: t("startedCourses"),
      value: stats.startedCourses,
      icon: BookOpen,
      color: "bg-[#e7edff] text-[#10233f]",
      mutedColor: "text-[#52627a]",
    },
    {
      label: t("completed"),
      value: stats.completedCourses,
      icon: CheckCircle2,
      color: "bg-[#e1f5e9] text-[#173f35]",
      mutedColor: "text-[#527067]",
    },
    {
      label: t("certificates"),
      value: stats.certificates,
      icon: Trophy,
      color: "bg-[#fff2b8] text-[#3e3510]",
      mutedColor: "text-[#776a31]",
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {statItems.map(({ label, value, icon: ItemIcon, color, mutedColor }) => {
          return (
            <Card key={label} className={`border-2 ${color}`}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${mutedColor}`}>{label}</p>
                  <p className="mt-1 text-3xl font-extrabold">{value}</p>
                </div>
                <ItemIcon className="size-8" />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold">{t("continueLearning")}</h2>
            <p className="text-sm text-muted-foreground">{t("recentProgress")}</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/student/courses">
              {t("viewAll")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
        {progress.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {progress.slice(0, 4).map((item) => (
              <Card key={item.id} className="border-2">
                <CardContent>
                  <div className="flex gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary">
                      <BookOpen />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{item.course?.title || t("course")}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("lastOpened", {
                          date: format.dateTime(new Date(item.lastAccessedAt), {
                            dateStyle: "medium",
                          }),
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-between text-xs">
                    <span>{t("progress")}</span>
                    <b>{item.progress}%</b>
                  </div>
                  <Progress value={item.progress} className="mt-2" />
                  <Button className="mt-4 w-full" asChild>
                    <Link href={`/dashboard/student/courses/${item.courseId}`}>
                      {t("continue")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="border-2">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock3 />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/student/browse">{t("findCourse")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </section>
    </div>
  );
}
