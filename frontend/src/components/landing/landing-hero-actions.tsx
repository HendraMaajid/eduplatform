"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHeroActions() {
  const t = useTranslations("landing");
  const { data: session, status } = useSession();
  const isStaff = session && session.user.role !== "student";
  const primaryHref = isStaff ? "/dashboard" : session ? "/courses" : "/register";
  const primaryLabel = isStaff ? t("backToDashboard") : t("startLearning");

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        asChild={status !== "loading"}
        className="h-12 px-6 text-base playful-shadow"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          t("loadingSession")
        ) : (
          <Link href={primaryHref}>
            {primaryLabel}
            <ArrowRight data-icon="inline-end" />
          </Link>
        )}
      </Button>
      <Button size="lg" variant="outline" asChild className="h-12 border-2 px-6 text-base">
        <Link href="/courses">{t("viewAllCourses")}</Link>
      </Button>
    </div>
  );
}
