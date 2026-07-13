"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookOpen, FileText, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Course, Module, PaginatedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MaterialRow = { module: Module; course: Course };
const PAGE_SIZE = 10;

export default function MaterialsPage() {
  const t = useTranslations("materials");
  const [rows, setRows] = useState<MaterialRow[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void api
      .get<PaginatedResponse<Course>>("/manage/courses?limit=100")
      .then(async (courseResponse) => {
        const loadedCourses = courseResponse.data;
        const moduleGroups = await Promise.all(
          loadedCourses.map((course) =>
            api
              .get<Module[]>(`/manage/courses/${course.id}/modules`)
              .then((modules) => modules.map((module) => ({ module, course }))),
          ),
        );
        return { loadedCourses, rows: moduleGroups.flat() };
      })
      .then(({ loadedCourses, rows: loadedRows }) => {
        setCourses(loadedCourses);
        setRows(loadedRows);
      })
      .catch((cause) => toast.error(cause instanceof Error ? cause.message : t("loadError")));
  }, [t]);

  const filteredRows = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return (rows || []).filter(({ module, course }) => {
      const matchesSearch =
        !query ||
        module.title.toLowerCase().includes(query) ||
        course.title.toLowerCase().includes(query);
      const matchesCourse = courseFilter === "all" || course.id === courseFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? module.isPublished : !module.isPublished);
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [courseFilter, deferredSearch, rows, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch("");
    setCourseFilter("all");
    setStatusFilter("all");
    setPage(1);
  }

  async function togglePublished(moduleId: string, isPublished: boolean) {
    try {
      await api.put(`/manage/modules/${moduleId}`, { isPublished });
      setRows(
        (current) =>
          current?.map((row) =>
            row.module.id === moduleId ? { ...row, module: { ...row.module, isPublished } } : row,
          ) || null,
      );
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("statusUpdateError"));
    }
  }

  async function remove(moduleId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      await api.delete(`/manage/modules/${moduleId}`);
      setRows((current) => current?.filter((row) => row.module.id !== moduleId) || null);
      toast.success(t("deleted"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("deleteError"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/materials/create">
            <Plus data-icon="inline-start" /> {t("addMaterial")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_240px_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select
          value={courseFilter}
          onValueChange={(value) => {
            setCourseFilter(value || "all");
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("filterCourse")}>
            <SelectValue>
              {courseFilter === "all"
                ? t("allCourses")
                : courses.find((course) => course.id === courseFilter)?.title || t("allCourses")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("allCourses")}</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value || "all");
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("filterStatus")}>
            <SelectValue>
              {statusFilter === "published"
                ? t("statuses.published")
                : statusFilter === "draft"
                  ? t("statuses.draft")
                  : t("statuses.all")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("statuses.all")}</SelectItem>
              <SelectItem value="published">{t("statuses.published")}</SelectItem>
              <SelectItem value="draft">{t("statuses.draft")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={resetFilters}>
          {t("resetFilters")}
        </Button>
      </div>

      {rows === null ? (
        <Skeleton className="h-[520px]" />
      ) : visibleRows.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("material")}</TableHead>
                <TableHead>{t("course")}</TableHead>
                <TableHead>{t("duration")}</TableHead>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map(({ module, course }) => (
                <TableRow key={module.id}>
                  <TableCell>
                    <div className="flex min-w-56 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileText />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{module.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("attachments", { count: module.attachments?.length || 0 })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-60 truncate">{course.title}</TableCell>
                  <TableCell>{module.duration || "—"}</TableCell>
                  <TableCell className="tabular-nums">{module.order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={module.isPublished}
                        onCheckedChange={(checked) => void togglePublished(module.id, checked)}
                        aria-label={t("changeStatusAria", { title: module.title })}
                      />
                      <Badge variant={module.isPublished ? "secondary" : "outline"}>
                        {module.isPublished ? t("statuses.published") : t("statuses.draft")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        nativeButton
                        render={<Button size="icon-sm" variant="ghost" />}
                      >
                        <MoreHorizontal />
                        <span className="sr-only">{t("materialActions")}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            render={
                              <Link
                                href={`/dashboard/teacher/materials/${module.id}/edit?courseId=${course.id}`}
                              />
                            }
                          >
                            <Pencil /> {t("editMaterial")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.location.assign(`/dashboard/teacher/courses/${course.id}`)
                            }
                          >
                            <BookOpen /> {t("openCourse")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => void remove(module.id)}
                          >
                            <Trash2 /> {t("deleteMaterial")}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              {t("range", {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, filteredRows.length),
                total: filteredRows.length,
              })}
            </p>
            <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      ) : (
        <Empty className="border">
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
