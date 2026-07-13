"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({
  fallbackHref,
  label,
}: {
  fallbackHref: string;
  label?: string;
}) {
  const t = useTranslations("common");
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button type="button" variant="outline" onClick={goBack}>
      <ArrowLeft data-icon="inline-start" />
      {label || t("back")}
    </Button>
  );
}
