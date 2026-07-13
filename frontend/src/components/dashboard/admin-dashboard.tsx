"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowRight, BookOpen, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { AdminStats, LearningProgress } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLoadError } from "./dashboard-load-error";

export function AdminDashboard() {
  const t = useTranslations("adminOverview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<LearningProgress[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<AdminStats>("/dashboard/admin"),
      api.get<LearningProgress[]>("/learning/recent"),
    ])
      .then(([dashboardStats, recentProgress]) => {
        setStats(dashboardStats);
        setRecent(recentProgress);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t("loadError"));
      });
  }, [t]);

  if (error) return <DashboardLoadError message={error} />;
  if (!stats) return <Skeleton className="h-[70vh]" />;

  const completionRate = stats.activeLearners
    ? Math.min(100, Math.round((stats.completedLearnings / stats.activeLearners) * 100))
    : 0;
  const items = [
    {
      label: t("totalStudents"),
      value: stats.totalStudents,
      icon: Users,
      detail: t("registeredStudents"),
    },
    {
      label: t("activeCourses"),
      value: stats.totalCourses,
      icon: BookOpen,
      detail: t("allPlatformCourses"),
    },
    {
      label: t("activeThirtyDays"),
      value: stats.activeLearners,
      icon: TrendingUp,
      detail: t("returningStudents"),
    },
    {
      label: t("completedCourses"),
      value: stats.completedLearnings,
      icon: CheckCircle2,
      detail: t("certificatesIssued", { count: stats.certificatesIssued }),
    },
  ];
  const breakdown = (stats.progressBreakdown ?? []).map((item) => ({
    ...item,
    label: t(`statuses.${item.status}`),
  }));
  const activityConfig = {
    activeLearners: { label: t("activeStudents"), color: "var(--chart-1)" },
    completedModules: { label: t("completedModules"), color: "var(--chart-2)" },
  } satisfies ChartConfig;
  const breakdownConfig = {
    total: { label: t("totalProgress"), color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {t("lastTwelveWeeks")}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, icon: Icon, detail }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="mt-1 text-3xl tabular-nums">{value}</CardTitle>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{t("learningActivity")}</CardTitle>
                <CardDescription>{t("learningActivityDescription")}</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-chart-1" /> {t("activeStudents")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-chart-2" /> {t("completedModules")}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="h-80 min-h-80">
              <AreaChart accessibilityLayer data={stats.weeklyActivity ?? []}>
                <defs>
                  <linearGradient id="active-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-activeLearners)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-activeLearners)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completed-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-completedModules)"
                      stopOpacity={0.24}
                    />
                    <stop offset="95%" stopColor="var(--color-completedModules)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="activeLearners"
                  stroke="var(--color-activeLearners)"
                  fill="url(#active-fill)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="completedModules"
                  stroke="var(--color-completedModules)"
                  fill="url(#completed-fill)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("learningStatus")}</CardTitle>
            <CardDescription>{t("learningStatusDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ChartContainer config={breakdownConfig} className="h-56 min-h-56">
              <BarChart accessibilityLayer data={breakdown} layout="vertical" margin={{ left: 4 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={104}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={5}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("completionRatio")}</span>
                <b>{completionRate}%</b>
              </div>
              <Progress value={completionRate} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t("needsAttention")}</CardTitle>
            <CardDescription>{t("needsAttentionDescription")}</CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/admin/progress">
              {t("viewAll")}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {recent
              .filter((item) => item.progress < 50)
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_1fr_160px] sm:items-center"
                >
                  <span className="font-semibold">{item.student?.name || t("student")}</span>
                  <span className="truncate text-muted-foreground">
                    {item.course?.title || t("course")}
                  </span>
                  <span className="flex items-center gap-3">
                    <Progress value={item.progress} className="flex-1" />
                    <b className="w-10 text-right tabular-nums">{item.progress}%</b>
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
