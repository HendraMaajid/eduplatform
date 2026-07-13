"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { BookOpen, Search } from "lucide-react";
import { DashboardLoadError } from "@/components/dashboard/dashboard-load-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/lib/api";
import type { LearningProgress, LearningStatus, PaginatedResponse } from "@/lib/types";

type StatusFilter = "all" | LearningStatus;

const PAGE_SIZE = 10;

export default function AdminLearningProgressPage() {
  const t = useTranslations("studentProgress");
  const format = useFormatter();
  const [data, setData] = useState<PaginatedResponse<LearningProgress> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      search: debouncedSearch,
      status,
    });
    api
      .get<PaginatedResponse<LearningProgress>>(`/admin/learning-progress?${query.toString()}`)
      .then((response) => {
        setData(response);
        setError("");
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t("loadError"));
      });
  }, [debouncedSearch, page, status, t]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus((value || "all") as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("filterStatus")}>
            <SelectValue>{t(`statuses.${status}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("statuses.all")}</SelectItem>
              <SelectItem value="in_progress">{t("statuses.in_progress")}</SelectItem>
              <SelectItem value="completed">{t("statuses.completed")}</SelectItem>
              <SelectItem value="certified">{t("statuses.certified")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <DashboardLoadError message={error} />
      ) : data === null ? (
        <Skeleton className="h-80" />
      ) : (
        <Card className="overflow-hidden border-2">
          <CardContent className="p-0">
            <Table className="min-w-[920px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-5">{t("student")}</TableHead>
                  <TableHead>{t("course")}</TableHead>
                  <TableHead>{t("lastAccess")}</TableHead>
                  <TableHead>{t("progress")}</TableHead>
                  <TableHead className="pr-5">{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.length ? (
                  data.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-5">
                        <p className="max-w-56 truncate font-semibold">
                          {item.student?.name || t("studentFallback")}
                        </p>
                        <p className="max-w-56 truncate text-xs text-muted-foreground">
                          {item.student?.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-64 truncate font-medium">
                          {item.course?.title || t("courseFallback")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("modulesCompleted", { count: item.completedModules?.length ?? 0 })}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format.dateTime(new Date(item.lastAccessedAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="w-48">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{t("progress")}</span>
                            <b className="tabular-nums">{item.progress}%</b>
                          </div>
                          <Progress value={item.progress} />
                        </div>
                      </TableCell>
                      <TableCell className="pr-5">
                        <Badge variant="outline">{t(`statuses.${item.status}`)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-52 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                        <BookOpen className="size-9" />
                        <p className="font-semibold text-foreground">{t("emptyTitle")}</p>
                        <p className="text-xs">{t("emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("resultCount", { count: data.meta.total })}
          </p>
          {data.meta.totalPages > 1 ? (
            <PaginationControl
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
