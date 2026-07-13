"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Course, CourseCategory, PaginatedResponse } from "@/lib/types";
import { CourseCard } from "@/components/course/course-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search } from "lucide-react";
export default function BrowseCoursesPage() {
  const t = useTranslations("studentBrowse");
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ limit: "24", search });
      if (category !== "all") params.set("category", category);
      Promise.all([
        api.get<PaginatedResponse<Course>>(`/courses?${params}`),
        api.get<CourseCategory[]>("/course-categories"),
      ])
        .then(([r, c]) => {
          setCourses(r.data);
          setCategories(c);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category]);
  async function start(id: string) {
    await api.post(`/learning/courses/${id}/start`);
    router.push(`/dashboard/student/courses/${id}`);
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-lg border bg-background px-3"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : courses.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <div
              key={c.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("a")) {
                  e.preventDefault();
                  void start(c.id);
                }
              }}
            >
              <CourseCard course={c} href={`/dashboard/student/courses/${c.id}`} />
            </div>
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
        </Empty>
      )}
    </div>
  );
}
