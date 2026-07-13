"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course, PaginatedResponse } from "@/lib/types";
import { CourseThumbnail } from "@/components/course/course-thumbnail";
import { CourseEditor } from "@/components/manage/course-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

const PAGE_SIZE = 8;

export default function TeacherCoursesPage() {
  const t = useTranslations("teacherCourses");
  const [items, setItems] = useState<Course[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadCourses = useCallback(
    async (targetPage: number) => {
      try {
        const response = await api.get<PaginatedResponse<Course>>(
          `/manage/courses?page=${targetPage}&limit=${PAGE_SIZE}`,
        );
        setItems(response.data);
        setTotal(response.meta.total);
        setTotalPages(Math.max(1, response.meta.totalPages));
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : t("loadError"));
      }
    },
    [t],
  );

  useEffect(() => {
    let active = true;
    void api
      .get<PaginatedResponse<Course>>(`/manage/courses?page=${page}&limit=${PAGE_SIZE}`)
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setTotal(response.meta.total);
        setTotalPages(Math.max(1, response.meta.totalPages));
      })
      .catch((cause) => {
        if (active) {
          toast.error(cause instanceof Error ? cause.message : t("loadError"));
        }
      });
    return () => {
      active = false;
    };
  }, [page, t]);

  async function handleCourseCreated() {
    setCreating(false);
    if (page === 1) {
      await loadCourses(1);
    } else {
      setPage(1);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
        </div>
        <Button onClick={() => setCreating(!creating)}>
          <Plus />
          {creating ? t("close") : t("newCourse")}
        </Button>
      </div>
      {creating ? <CourseEditor onSaved={handleCourseCreated} /> : null}
      {items === null ? (
        <Skeleton className="h-72" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((c) => (
              <Card key={c.id} className="border-2 py-0">
                <div className="grid sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <CourseThumbnail
                    thumbnail={c.thumbnail}
                    title={c.title}
                    className="min-h-40 rounded-none border-x-0 border-t-0 sm:aspect-auto sm:h-full sm:border-r sm:border-b-0"
                  />
                  <div className="flex min-w-0 flex-col py-4">
                    <CardHeader className="grid-cols-[1fr_auto]">
                      <Badge variant="outline" className="w-fit">
                        {t(`statuses.${c.status}`)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {t("students", { count: c.enrolledStudents || 0 })}
                      </span>
                      <CardTitle className="col-span-2 line-clamp-2 text-xl font-extrabold">
                        {c.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="mt-2 flex-1">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {c.shortDescription || t("noSummary")}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-4 border-0 bg-transparent py-0">
                      <Button asChild>
                        <Link href={`/dashboard/teacher/courses/${c.id}`}>
                          {t("manageMaterials")}
                        </Link>
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {total > 0 ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                {t("range", {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, total),
                  total,
                })}
              </p>
              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
