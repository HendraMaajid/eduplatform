"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { resourceUrl } from "@/lib/resource-url";
import { cn } from "@/lib/utils";

type CourseThumbnailProps = {
  thumbnail?: string | null;
  title: string;
  className?: string;
};

export function CourseThumbnail({ thumbnail, title, className }: CourseThumbnailProps) {
  const t = useTranslations("courseThumbnail");
  return (
    <div
      className={cn(
        "relative grid aspect-video min-h-32 overflow-hidden rounded-xl border bg-muted",
        className,
      )}
    >
      {thumbnail ? (
        // Backend-hosted user uploads can use a configurable origin.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resourceUrl(thumbnail)}
          alt={t("alt", { title })}
          className="size-full object-contain"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 px-3 text-center text-muted-foreground">
          <BookOpen className="size-8" aria-hidden="true" />
          <span className="text-xs font-semibold">{t("missing")}</span>
        </div>
      )}
    </div>
  );
}
