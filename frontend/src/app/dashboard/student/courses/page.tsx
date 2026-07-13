"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { LearningProgress } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
import { ArrowRight, BookOpen } from "lucide-react";
export default function LearningProgressPage() {
  const t = useTranslations("studentLearning");
  const [items, setItems] = useState<LearningProgress[] | null>(null);
  useEffect(() => {
    api.get<LearningProgress[]>("/learning/progress").then(setItems);
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
      </div>
      {items === null ? (
        <Skeleton className="h-80" />
      ) : items.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="border-2">
              <CardContent className="space-y-4">
                <div className="flex justify-between gap-3">
                  <h2 className="font-extrabold">{item.course?.title || t("course")}</h2>
                  <Badge variant="outline">{t(`statuses.${item.status}`)}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("modulesCompleted", { count: item.completedModules.length })}
                  </span>
                  <b>{item.progress}%</b>
                </div>
                <Progress value={item.progress} />
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/student/courses/${item.courseId}`}>
                    {item.progress ? t("continue") : t("start")}
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
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/dashboard/student/browse">{t("viewCourses")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
