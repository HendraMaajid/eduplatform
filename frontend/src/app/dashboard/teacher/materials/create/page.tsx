"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, FileImage, ImageUp, Loader2, Save, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { resourceUrl } from "@/lib/resource-url";
import type { Assignment, Course, Module, PaginatedResponse, Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { UnitNumberInput } from "@/components/ui/unit-number-input";
import { formatModuleDuration } from "@/lib/duration";
import { stripHtml } from "@/lib/html-utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type MaterialType = "module" | "quiz" | "assignment";
type UploadedImage = { name: string; url: string; size: number; type: string };

export default function CreateMaterialPage() {
  const t = useTranslations("materialForm");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [courseId, setCourseId] = useState(searchParams.get("courseId") || "");
  const initialType = searchParams.get("type");
  const [type, setType] = useState<MaterialType>(
    initialType === "quiz" || initialType === "assignment" ? initialType : "module",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("");
  const [order, setOrder] = useState(1);
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(15);
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<PaginatedResponse<Course>>("/manage/courses?limit=100")
      .then((response) => setCourses(response.data))
      .catch((cause) =>
        toast.error(cause instanceof Error ? cause.message : t("coursesLoadError")),
      );
  }, [t]);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.upload<{ url: string }>("/manage/upload", formData);
      setImage({ name: file.name, url: result.url, size: file.size, type: file.type });
      toast.success(t("imageUploaded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("imageUploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId || !title.trim()) {
      toast.error(t("courseAndTitleRequired"));
      return;
    }
    if (
      type === "module" &&
      (!description.trim() || !stripHtml(content).trim() || !formatModuleDuration(duration))
    ) {
      toast.error(t("moduleFieldsRequired"));
      return;
    }
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const isPublished = submitter?.value === "publish";
    setSaving(true);
    try {
      if (type === "module") {
        const createdModule = await api.post<Module>(`/manage/courses/${courseId}/modules`, {
          title,
          description,
          content,
          duration: formatModuleDuration(duration),
          order,
          isPublished,
        });
        if (image) {
          await api.post(`/manage/modules/${createdModule.id}/attachments`, {
            name: image.name,
            url: image.url,
            size: image.size,
            type: image.type,
          });
        }
      } else if (type === "quiz") {
        await api.post<Quiz>(`/manage/courses/${courseId}/quizzes`, {
          title,
          description: content,
          passingScore,
          timeLimit,
          isPublished,
        });
      } else {
        await api.post<Assignment>(`/manage/courses/${courseId}/assignments`, {
          title,
          description,
          instructions: content,
          deadline: deadline ? new Date(deadline).toISOString() : "",
          maxScore,
          isPublished,
        });
      }
      toast.success(isPublished ? t("publishedSuccess") : t("draftSaved"));
      router.push("/dashboard/teacher/materials");
      router.refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (courses === null) return <Skeleton className="h-[70vh]" />;

  return (
    <form onSubmit={save} className="mx-auto flex max-w-5xl flex-col gap-6 pb-24">
      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teacher/materials">
            <ArrowLeft data-icon="inline-start" /> {t("manageMaterials")}
          </Link>
        </Button>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{t("createTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("createDescription")}</p>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("course")}</FieldLabel>
              <Select value={courseId} onValueChange={(value) => setCourseId(value || "")}>
                <SelectTrigger aria-label={t("selectCourse")}>
                  <SelectValue>
                    {courses.find((course) => course.id === courseId)?.title || t("selectCourse")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t("courseDescription")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>{t("materialType")}</FieldLabel>
              <Select
                value={type}
                onValueChange={(value) => setType((value || "module") as MaterialType)}
              >
                <SelectTrigger aria-label={t("selectMaterialType")}>
                  <SelectValue>{t(`types.${type}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="module">{t("types.module")}</SelectItem>
                    <SelectItem value="quiz">{t("types.quiz")}</SelectItem>
                    <SelectItem value="assignment">{t("types.assignment")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t("typeDescription")}</FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="material-title">{t("title")}</FieldLabel>
            <Input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              placeholder={t("titlePlaceholder")}
              required
            />
          </Field>

          {type !== "quiz" ? (
            <Field>
              <FieldLabel htmlFor="material-description">{t("shortDescription")}</FieldLabel>
              <Input
                id="material-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                placeholder={t("shortDescriptionPlaceholder")}
                required={type === "module"}
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel>
              {type === "module"
                ? t("contentLabels.module")
                : type === "quiz"
                  ? t("contentLabels.quiz")
                  : t("contentLabels.assignment")}
            </FieldLabel>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={t("contentPlaceholder")}
              required
            />
            <FieldDescription>{t("editorDescription")}</FieldDescription>
          </Field>

          {type === "module" ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="material-duration">{t("learningDuration")}</FieldLabel>
                  <UnitNumberInput
                    id="material-duration"
                    unit={t("hours")}
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    placeholder="2"
                    required
                  />
                  <FieldDescription>{t("durationDescription")}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="material-order">{t("order")}</FieldLabel>
                  <Input
                    id="material-order"
                    type="number"
                    min={1}
                    value={order}
                    onChange={(event) => setOrder(Number(event.target.value))}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>{t("coverImage")}</FieldLabel>
                {image ? (
                  <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                    {/* Backend upload host is configurable. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resourceUrl(image.url)}
                      alt={t("imagePreviewAlt")}
                      className="aspect-video w-full rounded-lg object-cover sm:w-48"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{image.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("imageReadyWithSize", {
                          size: (image.size / 1024 / 1024).toFixed(2),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setImage(null)}
                      aria-label={t("removeImage")}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : (
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-6 text-center hover:bg-muted/50">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileImage />
                    </span>
                    <span>
                      <span className="block font-semibold">{t("selectImage")}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t("imageRequirements")}
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file);
                      }}
                    />
                    {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />}
                  </label>
                )}
              </Field>
            </>
          ) : null}

          {type === "quiz" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("passingScore")}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(event) => setPassingScore(Number(event.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel>{t("timeMinutes")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(Number(event.target.value))}
                />
              </Field>
            </div>
          ) : null}

          {type === "assignment" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("deadline")}</FieldLabel>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>{t("maxScore")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(event) => setMaxScore(Number(event.target.value))}
                />
              </Field>
            </div>
          ) : null}
        </FieldGroup>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="outline" value="draft" disabled={saving || uploading}>
            {saving ? <Loader2 className="animate-spin" /> : <Save data-icon="inline-start" />}{" "}
            {t("saveDraft")}
          </Button>
          <Button type="submit" value="publish" disabled={saving || uploading}>
            {saving ? <Loader2 className="animate-spin" /> : <Send data-icon="inline-start" />}{" "}
            {t("publishMaterial")}
          </Button>
        </div>
      </div>
    </form>
  );
}
