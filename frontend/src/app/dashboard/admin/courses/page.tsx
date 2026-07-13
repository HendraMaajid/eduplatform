"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course, PaginatedResponse } from "@/lib/types";
import { CourseThumbnail } from "@/components/course/course-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Trash2 } from "lucide-react";

const PAGE_SIZE = 8;

export default function AdminCoursesPage() {
  const t = useTranslations("adminCourses");
  const [items, setItems] = useState<Course[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        api
          .get<PaginatedResponse<Course>>(
            `/manage/courses?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
          )
          .then((response) => {
            setItems(response.data);
            setTotal(response.meta.total);
            setTotalPages(Math.max(1, response.meta.totalPages));
            if (response.meta.totalPages > 0 && page > response.meta.totalPages) {
              setPage(response.meta.totalPages);
            }
          })
          .catch((cause) => toast.error(cause instanceof Error ? cause.message : t("loadError"))),
      200,
    );
    return () => clearTimeout(timer);
  }, [page, search, t]);
  async function remove(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await api.delete(`/manage/courses/${id}`);
      setItems((x) => x?.filter((c) => c.id !== id) || []);
      setTotal((current) => Math.max(0, current - 1));
      if (items?.length === 1 && page > 1) setPage(page - 1);
      toast.success(t("deleted"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("deleteError"));
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/courses/create">
            <Plus />
            {t("newCourse")}
          </Link>
        </Button>
      </div>
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-md"
      />
      {items === null ? (
        <Skeleton className="h-80" />
      ) : items.length ? (
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
                    <CardHeader>
                      <Badge variant="outline" className="w-fit">
                        {t(`statuses.${c.status}`)}
                      </Badge>
                      <CardTitle className="line-clamp-2 text-lg font-bold">{c.title}</CardTitle>
                      <CardAction>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => void remove(c.id)}
                          aria-label={t("deleteAria", { title: c.title })}
                        >
                          <Trash2 />
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="mt-2 flex-1">
                      <p className="text-sm text-muted-foreground">
                        {c.teacher?.name || t("noTeacher")} · {t("free")}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-4 border-0 bg-transparent py-0">
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/admin/courses/${c.id}`}>{t("editPublish")}</Link>
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              {t("range", {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, total),
                total,
              })}
            </p>
            <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
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
        </Empty>
      )}
    </div>
  );
}
