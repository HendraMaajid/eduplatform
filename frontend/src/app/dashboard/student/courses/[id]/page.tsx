"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/api";
import { durationAmount } from "@/lib/duration";
import { RichContent } from "@/lib/html-utils";
import { isImageResource, resourceUrl } from "@/lib/resource-url";
import type { Assignment, Certificate, Course, LearningProgress, Module, Quiz } from "@/lib/types";
import {
  CourseOutlineNavigation,
  type LearningOutlineItem,
} from "@/components/learning/course-outline-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const ATTACHMENTS_PER_PAGE = 5;

function formatBytes(size: number, unavailable: string) {
  if (!size) return unavailable;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function CoursePlayerPage() {
  const t = useTranslations("coursePlayer");
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [current, setCurrent] = useState<Module | null>(null);
  const [attachmentPage, setAttachmentPage] = useState(1);
  const [failedCoverUrls, setFailedCoverUrls] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    Promise.all([
      api.get<Course>(`/courses/${id}`),
      api.post<LearningProgress>(`/learning/courses/${id}/start`),
      api.get<Module[]>(`/learning/courses/${id}/modules`),
      api.get<Quiz[]>(`/learning/courses/${id}/quizzes`),
      api.get<Assignment[]>(`/learning/courses/${id}/assignments`),
    ])
      .then(([loadedCourse, loadedProgress, loadedModules, loadedQuizzes, loadedAssignments]) => {
        setCourse(loadedCourse);
        setProgress(loadedProgress);
        setModules(loadedModules);
        setQuizzes(loadedQuizzes);
        setAssignments(loadedAssignments);
        setCurrent(
          loadedModules.find((module) => module.id === loadedProgress.lastModuleId) ||
            loadedModules[0] ||
            null,
        );
      })
      .catch((cause) => toast.error(cause instanceof Error ? cause.message : t("loadError")));
  }, [id, t]);

  const outline = useMemo(() => {
    const items: LearningOutlineItem[] = [];
    const count = Math.max(modules.length, quizzes.length, assignments.length);
    for (let index = 0; index < count; index += 1) {
      const learningModule = modules[index];
      const quiz = quizzes[index];
      const assignment = assignments[index];
      if (learningModule) {
        items.push({
          type: "module",
          id: learningModule.id,
          title: learningModule.title,
          subtitle: t("moduleOutline", {
            order: learningModule.order,
            duration: durationAmount(learningModule.duration)
              ? t("hours", { count: Number(durationAmount(learningModule.duration)) })
              : t("selfPaced"),
          }),
          module: learningModule,
        });
      }
      if (quiz) {
        items.push({
          type: "quiz",
          id: quiz.id,
          title: quiz.title,
          subtitle: t("quizOutline", { minutes: quiz.timeLimit }),
          quiz,
        });
      }
      if (assignment) {
        items.push({
          type: "assignment",
          id: assignment.id,
          title: assignment.title,
          subtitle: t("assignmentOutline", { points: assignment.maxScore }),
          assignment,
        });
      }
    }
    return items;
  }, [assignments, modules, quizzes, t]);

  const currentIndex = outline.findIndex(
    (item) => item.type === "module" && item.id === current?.id,
  );
  const completedModuleIds = useMemo(
    () => new Set(progress?.completedModules || []),
    [progress?.completedModules],
  );
  const previousItem = currentIndex > 0 ? outline[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 ? outline[currentIndex + 1] || null : null;
  const imageAttachments = current?.attachments?.filter((item) =>
    isImageResource(item.name, item.type),
  );
  const coverImage = [...(imageAttachments?.map((item) => item.url) || []), course?.thumbnail || ""]
    .filter(Boolean)
    .find((url) => !failedCoverUrls.has(url));
  const attachments = current?.attachments || [];
  const attachmentPages = Math.ceil(attachments.length / ATTACHMENTS_PER_PAGE);
  const visibleAttachments = attachments.slice(
    (attachmentPage - 1) * ATTACHMENTS_PER_PAGE,
    attachmentPage * ATTACHMENTS_PER_PAGE,
  );

  async function complete(moduleId: string) {
    try {
      const updated = await api.post<LearningProgress>(
        `/learning/courses/${id}/modules/${moduleId}/complete`,
        {},
      );
      setProgress(updated);
      toast.success(t("moduleCompleted"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("progressSaveError"));
    }
  }

  async function certificate() {
    try {
      await api.post<Certificate>(`/learning/courses/${id}/certificates`, {});
      toast.success(t("certificateIssued"));
      setProgress((value) => (value ? { ...value, status: "certified" } : value));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("requirementsNotMet"));
    }
  }

  function selectModule(module: Module) {
    setCurrent(module);
    setAttachmentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderItemAction(item: LearningOutlineItem | null, direction: "previous" | "next") {
    if (!item) return null;
    const label =
      direction === "previous"
        ? t("previous")
        : item.type === "quiz"
          ? t("continueQuiz")
          : item.type === "assignment"
            ? t("continueAssignment")
            : t("nextMaterial");
    const icon =
      direction === "previous" ? (
        <ArrowLeft data-icon="inline-start" />
      ) : (
        <ArrowRight data-icon="inline-end" />
      );
    if (item.type === "module") {
      return (
        <Button
          variant={direction === "previous" ? "outline" : "default"}
          onClick={() => selectModule(item.module)}
        >
          {direction === "previous" ? icon : null}
          {label}
          {direction === "next" ? icon : null}
        </Button>
      );
    }
    const href =
      item.type === "quiz"
        ? `/dashboard/student/courses/${id}/quiz/${item.id}`
        : `/dashboard/student/courses/${id}/assignments/${item.id}`;
    return (
      <Button variant={direction === "previous" ? "outline" : "default"} asChild>
        <Link href={href}>
          {direction === "previous" ? icon : null}
          {label}
          {direction === "next" ? icon : null}
        </Link>
      </Button>
    );
  }

  if (!course || !progress) return <Skeleton className="h-[75vh]" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/student/courses">
            <ArrowLeft data-icon="inline-start" />
            {t("backToProgress")}
          </Link>
        </Button>
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
            <p className="mt-2 text-muted-foreground">{course.teacher?.name || t("teacherTeam")}</p>
          </div>
          <div className="w-full max-w-sm">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("courseProgress")}</span>
              <b>{progress.progress}%</b>
            </div>
            <Progress value={progress.progress} />
          </div>
        </div>
      </div>

      {progress.progress === 100 && progress.status !== "certified" ? (
        <Card className="bg-accent text-accent-foreground">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t("allRequirementsComplete")}</CardTitle>
              <CardDescription className="text-accent-foreground/70">
                {t("certificateReady")}
              </CardDescription>
            </div>
            <Button onClick={() => void certificate()}>
              <Trophy data-icon="inline-start" /> {t("issueCertificate")}
            </Button>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        {current ? (
          <CourseOutlineNavigation
            items={outline}
            courseId={id}
            currentModule={current}
            moduleCount={modules.length}
            quizCount={quizzes.length}
            assignmentCount={assignments.length}
            completedModuleIds={completedModuleIds}
            onSelectModule={selectModule}
          />
        ) : null}

        {current ? (
          <Card className="min-w-0 [--card-spacing:--spacing(6)]">
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardDescription>{t("moduleNumber", { number: current.order })}</CardDescription>
                  <CardTitle className="mt-1 text-2xl">{current.title}</CardTitle>
                  <p className="mt-2 text-muted-foreground">{current.description}</p>
                </div>
                <Badge variant="outline">
                  <Clock3 />
                  {durationAmount(current.duration)
                    ? t("hours", { count: Number(durationAmount(current.duration)) })
                    : t("selfPaced")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-8">
              {coverImage ? (
                <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border bg-muted/40">
                  {/* User uploads are served from the configurable API origin. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resourceUrl(coverImage)}
                    alt={t("materialImageAlt", { title: current.title })}
                    className="aspect-video max-h-[440px] w-full object-contain p-2 sm:p-4"
                    onError={() =>
                      setFailedCoverUrls((currentUrls) => new Set(currentUrls).add(coverImage))
                    }
                  />
                </div>
              ) : null}
              <article
                aria-label={t("materialContentAria", { title: current.title })}
                className="mx-auto w-full max-w-3xl"
              >
                <RichContent html={current.content} />
              </article>

              {attachments.length ? (
                <section
                  aria-labelledby="attachment-title"
                  className="mx-auto w-full max-w-3xl rounded-xl border bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                    <div>
                      <h3 id="attachment-title" className="font-bold">
                        {t("attachments")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("filesAvailable", { count: attachments.length })}
                      </p>
                    </div>
                    <Badge variant="secondary">{t("page", { page: attachmentPage })}</Badge>
                  </div>
                  <div className="divide-y">
                    {visibleAttachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={resourceUrl(attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted"
                      >
                        <span className="grid size-9 place-items-center rounded-lg bg-background text-primary">
                          {isImageResource(attachment.name, attachment.type) ? (
                            <FileText />
                          ) : (
                            <Download />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {attachment.type || t("file")} ·
                            {formatBytes(attachment.size, t("sizeUnavailable"))}
                          </span>
                        </span>
                        <Download />
                      </a>
                    ))}
                  </div>
                  {attachmentPages > 1 ? (
                    <div className="flex justify-end border-t p-3">
                      <PaginationControl
                        currentPage={attachmentPage}
                        totalPages={attachmentPages}
                        onPageChange={setAttachmentPage}
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className="mx-auto flex w-full max-w-3xl flex-col justify-between gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold">{t("finishedReading")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("markCompleteDescription")}
                  </p>
                </div>
                <Button
                  className="shrink-0"
                  variant="outline"
                  disabled={progress.completedModules.includes(current.id)}
                  onClick={() => void complete(current.id)}
                >
                  <CheckCircle2 data-icon="inline-start" />
                  {progress.completedModules.includes(current.id)
                    ? t("alreadyComplete")
                    : t("markComplete")}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="sticky bottom-0 flex-col justify-between gap-3 bg-card/95 backdrop-blur sm:flex-row">
              <div>{renderItemAction(previousItem, "previous")}</div>
              <div>{renderItemAction(nextItem, "next")}</div>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("emptyTitle")}</CardTitle>
              <CardDescription>{t("emptyDescription")}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
