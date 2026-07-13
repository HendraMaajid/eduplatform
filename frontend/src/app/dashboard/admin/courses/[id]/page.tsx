"use client";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CourseEditor } from "@/components/manage/course-editor";
import { BackButton } from "@/components/navigation/back-button";
export default function EditAdminCoursePage() {
  const t = useTranslations("adminCourseFormPage");
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton fallbackHref="/dashboard/admin/courses" />
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">
          {t("editEyebrow")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("editTitle")}</h1>
      </div>
      <CourseEditor courseId={id} admin />
    </div>
  );
}
