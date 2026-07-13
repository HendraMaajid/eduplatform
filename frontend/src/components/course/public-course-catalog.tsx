"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AlertCircle, BookOpen, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Course, CourseCategory, PaginatedResponse, UserRole } from "@/lib/types";
import { CourseCard } from "@/components/course/course-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 9;

function actionForCourse(
  role: UserRole | undefined,
  courseId: string,
  labels: { dashboard: string; start: string },
) {
  if (role && role !== "student") {
    return { href: "/dashboard", label: labels.dashboard };
  }
  const coursePath = `/dashboard/student/courses/${courseId}`;
  if (role === "student") return { href: coursePath, label: labels.start };
  return {
    href: `/login?callbackUrl=${encodeURIComponent(coursePath)}`,
    label: labels.start,
  };
}

export function PublicCourseCatalog() {
  const t = useTranslations("publicCatalog");
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    void api
      .get<CourseCategory[]>("/course-categories")
      .then((response) => {
        if (active) setCategories(response);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    const normalizedSearch = deferredSearch.trim();
    if (normalizedSearch) params.set("search", normalizedSearch);
    if (category !== "all") params.set("category", category);

    void api
      .get<PaginatedResponse<Course>>(`/courses?${params.toString()}`)
      .then((response) => {
        if (!active) return;
        setCourses(response.data);
        setTotal(response.meta.total);
        setTotalPages(Math.max(1, response.meta.totalPages));
        if (response.meta.totalPages > 0 && page > response.meta.totalPages) {
          setPage(response.meta.totalPages);
        }
      })
      .catch((cause) => {
        if (!active) return;
        setCourses([]);
        setTotal(0);
        setTotalPages(1);
        setError(cause instanceof Error ? cause.message : t("loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, deferredSearch, page, retryKey, t]);

  const waitingForSession = status === "loading";
  const firstItem = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-11 pl-9"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setLoading(true);
              setError("");
            }}
            aria-label={t("searchAria")}
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value || "all");
            setPage(1);
            setLoading(true);
            setError("");
          }}
        >
          <SelectTrigger className="h-11 sm:w-64" aria-label={t("filterCategory")}>
            <SelectValue>{category === "all" ? t("allCategories") : category}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.name} value={item.name}>
                  {item.name} ({item.count})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError("");
                setRetryKey((value) => value + 1);
              }}
            >
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading || waitingForSession ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label={t("loading")}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[26rem]" />
          ))}
        </div>
      ) : courses.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const action = actionForCourse(session?.user.role, course.id, {
                dashboard: t("backToDashboard"),
                start: t("startLearning"),
              });
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  href={action.href}
                  action={action.label}
                />
              );
            })}
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              {t("range", { from: firstItem, to: lastItem, total })}
            </p>
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                if (nextPage === page) return;
                setLoading(true);
                setError("");
                setPage(nextPage);
              }}
            />
          </div>
        </>
      ) : (
        <Empty className="border-2 py-14">
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
