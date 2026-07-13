"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Course } from "@/lib/types";
import { resourceUrl } from "@/lib/resource-url";

export function CourseCard({
  course,
  href,
  action,
  actionSlot,
}: {
  course: Course;
  href?: string;
  action?: string;
  actionSlot?: ReactNode;
}) {
  const t = useTranslations("courseCard");
  return (
    <Card className="h-full border-2 py-0 transition-transform hover:-translate-y-1">
      {course.thumbnail ? (
        <div className="aspect-[3/2] w-full overflow-hidden bg-muted">
          {/* Backend-hosted user upload. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resourceUrl(course.thumbnail)}
            alt={t("thumbnailAlt", { title: course.title })}
            className="size-full object-contain"
          />
        </div>
      ) : (
        <div className="grid h-36 place-items-center bg-secondary">
          <BookOpen className="size-12 text-secondary-foreground" />
        </div>
      )}
      <CardHeader className="pt-1">
        <div>
          <Badge className="bg-accent text-accent-foreground">{t("free")}</Badge>
        </div>
        <CardAction>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-[#f4c542] text-[#c9990d]" />
            {course.rating ? course.rating.toFixed(1) : t("new")}
          </span>
        </CardAction>
        <CardTitle className="line-clamp-2 pt-3 text-lg font-bold">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-6">
          {course.shortDescription || course.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{course.category || t("general")}</span>
          <span>{t("modules", { count: course.totalModules || 0 })}</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto border-0 bg-transparent pt-0">
        {actionSlot || (
          <Button className="w-full" asChild>
            <Link href={href || "/courses"}>
              {action || t("startLearning")}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
