"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicCourseAction({ courseId }: { courseId: string }) {
  const t = useTranslations("publicCatalog");
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button className="w-full" disabled>
        {t("loadingSession")}
      </Button>
    );
  }

  const isStudent = session?.user.role === "student";
  const isStaff = session && !isStudent;
  const coursePath = `/dashboard/student/courses/${courseId}`;
  const href = isStaff
    ? "/dashboard"
    : isStudent
      ? coursePath
      : `/login?callbackUrl=${encodeURIComponent(coursePath)}`;
  const label = isStaff ? t("backToDashboard") : t("startLearning");

  return (
    <Button className="w-full" asChild>
      <Link href={href}>
        {label}
        <ArrowRight data-icon="inline-end" />
      </Link>
    </Button>
  );
}
