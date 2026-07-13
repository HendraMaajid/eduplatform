"use client";

import { useTranslations } from "next-intl";
import { CourseEditor } from "@/components/manage/course-editor";
export default function CreateAdminCoursePage() {
  const t = useTranslations("adminCourseFormPage");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">
          {t("createEyebrow")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("createTitle")}</h1>
      </div>
      <CourseEditor admin />
    </div>
  );
}
