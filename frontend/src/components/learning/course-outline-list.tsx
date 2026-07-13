"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ClipboardList, FileQuestion, FileText, ListTree } from "lucide-react";
import type { Assignment, Module, Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type LearningOutlineItem =
  | { type: "module"; id: string; title: string; subtitle: string; module: Module }
  | { type: "quiz"; id: string; title: string; subtitle: string; quiz: Quiz }
  | { type: "assignment"; id: string; title: string; subtitle: string; assignment: Assignment };

type CourseOutlineListProps = {
  items: LearningOutlineItem[];
  courseId: string;
  currentModuleId?: string;
  completedModuleIds: Set<string>;
  onSelectModule: (module: Module) => void;
  onNavigate?: () => void;
};

export function CourseOutlineList({
  items,
  courseId,
  currentModuleId,
  completedModuleIds,
  onSelectModule,
  onNavigate,
}: CourseOutlineListProps) {
  function itemIcon(item: LearningOutlineItem) {
    if (item.type === "quiz") return <FileQuestion />;
    if (item.type === "assignment") return <ClipboardList />;
    if (completedModuleIds.has(item.id)) return <CheckCircle2 />;
    return <FileText />;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        const selected = item.type === "module" && item.id === currentModuleId;
        const row = (
          <>
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg border [&_svg]:size-4",
                selected ? "border-primary-foreground/30" : "bg-background",
              )}
            >
              {itemIcon(item)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs opacity-70">{item.subtitle}</span>
              <span className="mt-0.5 block truncate font-semibold">{item.title}</span>
            </span>
            <span className="text-xs tabular-nums opacity-60">{index + 1}</span>
          </>
        );

        if (item.type === "module") {
          return (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              aria-current={selected ? "step" : undefined}
              onClick={() => {
                onSelectModule(item.module);
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {row}
            </button>
          );
        }

        const href =
          item.type === "quiz"
            ? `/dashboard/student/courses/${courseId}/quiz/${item.id}`
            : `/dashboard/student/courses/${courseId}/assignments/${item.id}`;
        return (
          <Link
            key={`${item.type}-${item.id}`}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors hover:bg-muted"
          >
            {row}
          </Link>
        );
      })}
    </div>
  );
}

type CourseOutlineNavigationProps = {
  items: LearningOutlineItem[];
  courseId: string;
  currentModule: Module;
  moduleCount: number;
  quizCount: number;
  assignmentCount: number;
  completedModuleIds: Set<string>;
  onSelectModule: (module: Module) => void;
};

export function CourseOutlineNavigation({
  items,
  courseId,
  currentModule,
  moduleCount,
  quizCount,
  assignmentCount,
  completedModuleIds,
  onSelectModule,
}: CourseOutlineNavigationProps) {
  const t = useTranslations("coursePlayer");
  const [outlineOpen, setOutlineOpen] = useState(false);
  const summary = t("outlineSummary", {
    modules: moduleCount,
    quizzes: quizCount,
    assignments: assignmentCount,
  });

  return (
    <>
      <div className="sticky top-20 z-20 xl:hidden">
        <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
          <Card size="sm" className="bg-background/95 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>
                {t("modulePosition", { current: currentModule.order, total: moduleCount })}
              </CardDescription>
              <CardTitle className="max-w-[65vw] truncate">{currentModule.title}</CardTitle>
              <CardAction>
                <SheetTrigger
                  render={<Button variant="outline" size="sm" aria-label={t("openOutline")} />}
                >
                  <ListTree data-icon="inline-start" /> {t("outline")}
                </SheetTrigger>
              </CardAction>
            </CardHeader>
          </Card>

          <SheetContent side="left" className="w-[92vw]! max-w-sm p-0">
            <SheetHeader className="border-b">
              <SheetTitle>{t("outlineTitle")}</SheetTitle>
              <SheetDescription>{summary}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 p-4">
              <ScrollArea className="h-full pr-3">
                <CourseOutlineList
                  items={items}
                  courseId={courseId}
                  currentModuleId={currentModule.id}
                  completedModuleIds={completedModuleIds}
                  onSelectModule={onSelectModule}
                  onNavigate={() => setOutlineOpen(false)}
                />
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="hidden h-[calc(100svh-7rem)] xl:sticky xl:top-[5.5rem] xl:flex">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{t("outlineTitle")}</CardTitle>
              <CardDescription>{summary}</CardDescription>
            </div>
            <Badge variant="outline">{t("activities", { count: items.length })}</Badge>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 pb-1">
          <ScrollArea className="h-full pr-3">
            <CourseOutlineList
              items={items}
              courseId={courseId}
              currentModuleId={currentModule.id}
              completedModuleIds={completedModuleIds}
              onSelectModule={onSelectModule}
            />
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
