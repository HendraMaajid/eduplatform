"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, FileImage, FileText, ImageUp, Loader2, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { resourceUrl } from "@/lib/resource-url";
import type { Attachment, Course, Module, PaginatedResponse } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { UnitNumberInput } from "@/components/ui/unit-number-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { durationAmount, formatModuleDuration } from "@/lib/duration";
import { stripHtml } from "@/lib/html-utils";

type UploadedImage = { name: string; url: string; size: number; type: string };
const ATTACHMENTS_PAGE_SIZE = 6;

async function findModule(moduleId: string, requestedCourseId: string) {
  if (requestedCourseId) {
    const modules = await api.get<Module[]>(`/manage/courses/${requestedCourseId}/modules`);
    return {
      module: modules.find((item) => item.id === moduleId) || null,
      courseTitle: "",
    };
  }

  const response = await api.get<PaginatedResponse<Course>>("/manage/courses?limit=100");
  const moduleGroups = await Promise.all(
    response.data.map(async (course) => ({
      course,
      modules: await api.get<Module[]>(`/manage/courses/${course.id}/modules`),
    })),
  );
  const match = moduleGroups.find(({ modules }) => modules.some((item) => item.id === moduleId));
  return {
    module: match?.modules.find((item) => item.id === moduleId) || null,
    courseTitle: match?.course.title || "",
  };
}

export default function EditMaterialPage() {
  const t = useTranslations("materialForm");
  const { id: moduleId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedCourseId = searchParams.get("courseId") || "";
  const [module, setModule] = useState<Module | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("");
  const [order, setOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [attachmentPage, setAttachmentPage] = useState(1);
  const [failedAttachmentImages, setFailedAttachmentImages] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void findModule(moduleId, requestedCourseId)
      .then((result) => {
        if (!active) return;
        if (!result.module) throw new Error(t("notFoundAccessible"));
        setModule(result.module);
        setCourseTitle(result.courseTitle);
        setTitle(result.module.title);
        setDescription(result.module.description || "");
        setContent(result.module.content || "");
        setDuration(durationAmount(result.module.duration));
        setOrder(result.module.order || 1);
        setIsPublished(result.module.isPublished);
      })
      .catch((cause: unknown) =>
        active ? setError(cause instanceof Error ? cause.message : t("loadError")) : undefined,
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [moduleId, requestedCourseId, t]);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.upload<{ url: string }>("/manage/upload", formData);
      setImage({ name: file.name, url: result.url, size: file.size, type: file.type });
      toast.success(t("imageUploadedForSave"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("imageUploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!window.confirm(t("deleteAttachmentConfirm"))) return;
    const remainingAttachmentCount = Math.max(0, (module?.attachments.length || 0) - 1);
    try {
      await api.delete(`/manage/attachments/${attachmentId}`);
      setModule((current) =>
        current
          ? {
              ...current,
              attachments: current.attachments.filter((item) => item.id !== attachmentId),
            }
          : current,
      );
      setAttachmentPage((current) =>
        Math.min(current, Math.max(1, Math.ceil(remainingAttachmentCount / ATTACHMENTS_PAGE_SIZE))),
      );
      toast.success(t("attachmentDeleted"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("attachmentDeleteError"));
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }
    if (!description.trim() || !stripHtml(content).trim() || !formatModuleDuration(duration)) {
      toast.error(t("moduleFieldsRequired"));
      return;
    }
    setSaving(true);
    try {
      await api.put<Module>(`/manage/modules/${moduleId}`, {
        title: title.trim(),
        description,
        content,
        duration: formatModuleDuration(duration),
        order,
        isPublished,
      });
      if (image) {
        await api.post<Attachment>(`/manage/modules/${moduleId}/attachments`, image);
      }
      toast.success(t("changesSaved"));
      router.push("/dashboard/teacher/materials");
      router.refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("changesSaveError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="mx-auto h-[70vh] max-w-5xl" />;

  if (error || !module) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teacher/materials">
            <ArrowLeft data-icon="inline-start" /> {t("manageMaterials")}
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || t("notFound")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const attachmentPages = Math.max(1, Math.ceil(module.attachments.length / ATTACHMENTS_PAGE_SIZE));
  const visibleAttachments = module.attachments.slice(
    (attachmentPage - 1) * ATTACHMENTS_PAGE_SIZE,
    attachmentPage * ATTACHMENTS_PAGE_SIZE,
  );

  return (
    <form onSubmit={save} className="mx-auto flex max-w-5xl flex-col gap-6 pb-24">
      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teacher/materials">
            <ArrowLeft data-icon="inline-start" /> {t("manageMaterials")}
          </Link>
        </Button>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{t("editTitle")}</h1>
        <p className="mt-2 text-muted-foreground">
          {courseTitle
            ? t("editDescriptionWithCourse", { course: courseTitle })
            : t("editDescription")}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="material-title">{t("title")}</FieldLabel>
            <Input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="material-description">{t("shortDescription")}</FieldLabel>
            <Input
              id="material-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              placeholder={t("studentSummaryPlaceholder")}
              required
            />
          </Field>

          <Field>
            <FieldLabel>{t("contentLabels.module")}</FieldLabel>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={t("editContentPlaceholder")}
              required
            />
            <FieldDescription>{t("editorDescription")}</FieldDescription>
          </Field>

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
                max={10000}
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
              />
            </Field>
          </div>

          <Field orientation="horizontal" className="justify-between rounded-xl border p-4">
            <div>
              <FieldLabel htmlFor="material-published">{t("showToStudents")}</FieldLabel>
              <FieldDescription>{t("draftVisibility")}</FieldDescription>
            </div>
            <Switch
              id="material-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </Field>

          <Field>
            <FieldLabel>{t("currentAttachments")}</FieldLabel>
            {module.attachments.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleAttachments.map((attachment) => {
                  const isImage =
                    attachment.type.startsWith("image/") &&
                    !failedAttachmentImages.has(attachment.id);
                  return (
                    <div
                      key={attachment.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border p-3"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resourceUrl(attachment.url)}
                          alt={attachment.name}
                          className="size-16 shrink-0 rounded-lg object-cover"
                          onError={() =>
                            setFailedAttachmentImages((current) =>
                              new Set(current).add(attachment.id),
                            )
                          }
                        />
                      ) : (
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FileText />
                        </span>
                      )}
                      <a
                        href={resourceUrl(attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                      >
                        {attachment.name}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void deleteAttachment(attachment.id)}
                        aria-label={t("deleteAttachmentAria", { name: attachment.name })}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <FieldDescription>{t("noAttachments")}</FieldDescription>
            )}
            {module.attachments.length > ATTACHMENTS_PAGE_SIZE ? (
              <div className="mt-3 flex flex-col justify-between gap-3 rounded-xl bg-muted/30 p-3 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  {t("attachmentRange", {
                    from: (attachmentPage - 1) * ATTACHMENTS_PAGE_SIZE + 1,
                    to: Math.min(attachmentPage * ATTACHMENTS_PAGE_SIZE, module.attachments.length),
                    total: module.attachments.length,
                  })}
                </p>
                <PaginationControl
                  currentPage={attachmentPage}
                  totalPages={attachmentPages}
                  onPageChange={setAttachmentPage}
                />
              </div>
            ) : null}
          </Field>

          <Field>
            <FieldLabel>{t("addNewImage")}</FieldLabel>
            {image ? (
              <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resourceUrl(image.url)}
                  alt={t("newImagePreviewAlt")}
                  className="aspect-video w-full rounded-lg object-cover sm:w-48"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{image.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("readyToAdd")}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setImage(null)}
                  aria-label={t("cancelNewImage")}
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
        </FieldGroup>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving ? <Loader2 className="animate-spin" /> : <Save data-icon="inline-start" />}
            {t("saveChanges")}
          </Button>
        </div>
      </div>
    </form>
  );
}
