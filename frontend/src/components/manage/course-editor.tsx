"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course, CourseLevel, CourseStatus, PaginatedResponse, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { UnitNumberInput } from "@/components/ui/unit-number-input";
import { resourceUrl } from "@/lib/resource-url";
import { durationAmount, formatCourseDuration } from "@/lib/duration";
import { stripHtml } from "@/lib/html-utils";
import { ImageUp, Loader2 } from "lucide-react";

type CourseDraft = {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: CourseLevel;
  duration: string;
  thumbnail: string;
  status: CourseStatus;
  teacherId: string;
};

const empty: CourseDraft = {
  title: "",
  shortDescription: "",
  description: "",
  category: "",
  level: "beginner",
  duration: "",
  thumbnail: "",
  status: "draft",
  teacherId: "",
};

type CourseEditorProps = {
  courseId?: string;
  admin?: boolean;
  returnTo?: string;
  onSaved?: (course: Course) => void | Promise<void>;
};

export function CourseEditor({ courseId, admin = false, returnTo, onSaved }: CourseEditorProps) {
  const t = useTranslations("courseEditor");
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<CourseDraft>(empty);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const jobs: Promise<void>[] = [];
    if (courseId) {
      jobs.push(
        api.get<Course>(`/manage/courses/${courseId}`).then((course) =>
          setForm({
            title: course.title,
            shortDescription: course.shortDescription,
            description: course.description,
            category: course.category,
            level: course.level,
            duration: durationAmount(course.duration),
            thumbnail: course.thumbnail,
            status: course.status,
            teacherId: course.teacherId,
          }),
        ),
      );
    }
    if (admin)
      jobs.push(
        api
          .get<PaginatedResponse<User>>("/users?role=teacher&limit=100")
          .then((response) => setTeachers(response.data)),
      );
    Promise.all(jobs).finally(() => setLoading(false));
  }, [courseId, admin]);

  async function uploadThumbnail(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api.upload<{ url: string }>("/manage/upload", body);
      setForm((current) => ({ ...current, thumbnail: result.url }));
      toast.success(t("thumbnailUploaded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.shortDescription.trim() ||
      !stripHtml(form.description).trim() ||
      !form.category.trim() ||
      !formatCourseDuration(form.duration) ||
      !form.thumbnail.trim()
    ) {
      toast.error(t("requiredError"));
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      category: form.category.trim(),
      duration: formatCourseDuration(form.duration),
      thumbnail: form.thumbnail.trim(),
    };
    setSaving(true);
    try {
      const saved = courseId
        ? await api.put<Course>(`/manage/courses/${courseId}`, payload)
        : await api.post<Course>("/manage/courses", payload);
      toast.success(t("saved"));
      if (onSaved) {
        await onSaved(saved);
      } else if (!courseId) {
        router.replace(
          returnTo || (admin ? "/dashboard/admin/courses" : "/dashboard/teacher/courses"),
        );
      }
      router.refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-96" />;

  const currentSuperAdmin =
    session?.user.role === "super_admin"
      ? {
          id: session.user.id,
          name: `${session.user.name || "Super Admin"} ${t("meSuffix")}`,
        }
      : null;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>{courseId ? t("editTitle") : t("createTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">{t("title")}</FieldLabel>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="short">{t("summary")}</FieldLabel>
              <Input
                id="short"
                maxLength={500}
                value={form.shortDescription}
                onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">{t("description")}</FieldLabel>
              <RichTextEditor
                id="description"
                value={form.description}
                onChange={(description) => setForm({ ...form, description })}
                placeholder={t("descriptionPlaceholder")}
                required
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="category">{t("category")}</FieldLabel>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="duration">{t("duration")}</FieldLabel>
                <UnitNumberInput
                  id="duration"
                  unit={t("weeks")}
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={form.duration}
                  onChange={(event) => setForm({ ...form, duration: event.target.value })}
                  placeholder="8"
                  required
                />
                <FieldDescription>{t("durationDescription")}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="level">{t("level")}</FieldLabel>
                <select
                  id="level"
                  className="h-10 rounded-lg border bg-background px-3"
                  value={form.level}
                  required
                  onChange={(event) =>
                    setForm({ ...form, level: event.target.value as CourseLevel })
                  }
                >
                  <option value="beginner">{t("levels.beginner")}</option>
                  <option value="intermediate">{t("levels.intermediate")}</option>
                  <option value="advanced">{t("levels.advanced")}</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="status">{t("status")}</FieldLabel>
                <select
                  id="status"
                  className="h-10 rounded-lg border bg-background px-3"
                  value={form.status}
                  required
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as CourseStatus })
                  }
                >
                  <option value="draft">{t("statuses.draft")}</option>
                  <option value="published">{t("statuses.published")}</option>
                  <option value="archived">{t("statuses.archived")}</option>
                </select>
              </Field>
            </div>
            {admin && (
              <Field>
                <FieldLabel htmlFor="teacher">{t("teacher")}</FieldLabel>
                <select
                  id="teacher"
                  className="h-10 rounded-lg border bg-background px-3"
                  value={form.teacherId}
                  onChange={(event) => setForm({ ...form, teacherId: event.target.value })}
                  required
                >
                  <option value="">{t("selectTeacher")}</option>
                  {currentSuperAdmin ? (
                    <option value={currentSuperAdmin.id}>{currentSuperAdmin.name}</option>
                  ) : null}
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="thumbnail">{t("thumbnail")}</FieldLabel>
              {form.thumbnail ? (
                <div className="w-fit max-w-full overflow-hidden rounded-xl border bg-muted p-2">
                  {/* Backend uploads can use a configurable host, so a native image is intentional. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resourceUrl(form.thumbnail)}
                    alt={t("thumbnailPreviewAlt")}
                    className="block h-auto max-h-80 w-auto max-w-full object-contain"
                  />
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  id="thumbnail"
                  value={form.thumbnail}
                  onChange={(event) => setForm({ ...form, thumbnail: event.target.value })}
                  placeholder={t("thumbnailPlaceholder")}
                  required
                />
                <Button type="button" variant="outline" className="relative" disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />}
                  {t("uploadImage")}
                  <input
                    className="absolute inset-0 cursor-pointer opacity-0"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    aria-label={t("uploadThumbnailAria")}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadThumbnail(file);
                    }}
                  />
                </Button>
              </div>
              <FieldDescription>{t("thumbnailDescription")}</FieldDescription>
            </Field>
            <Button type="submit" className="w-fit" disabled={saving || uploading}>
              {saving && <Loader2 className="animate-spin" />}
              {t("saveCourse")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
