import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, CheckCircle2, Code2, Sparkles, Star, Trophy } from "lucide-react";
import { CourseCard } from "@/components/course/course-card";
import { PublicCourseAction } from "@/components/course/public-course-action";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course, PaginatedResponse } from "@/lib/types";
import { getPlatformSettings } from "@/lib/platform-settings";
import { LandingHeroActions } from "@/components/landing/landing-hero-actions";
import { LandingHeader } from "@/components/landing/landing-header";

const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api`;

async function getLandingData() {
  try {
    const coursesResponse = await fetch(`${apiUrl}/courses?limit=6`, {
      next: { revalidate: 60 },
    });
    const courses = coursesResponse.ok
      ? ((await coursesResponse.json()) as PaginatedResponse<Course>).data
      : [];
    return courses;
  } catch {
    return [] as Course[];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, platform, t] = await Promise.all([
    getLocale(),
    getPlatformSettings(),
    getTranslations("landing"),
  ]);
  const description =
    (locale === "en" ? platform.descriptionEn : platform.descriptionId) || t("metaDescription");
  return {
    title: `${t("metaTitle")} | ${platform.name}`,
    description,
    openGraph: {
      title: `${t("metaTitle")} | ${platform.name}`,
      description,
    },
    twitter: {
      title: `${t("metaTitle")} | ${platform.name}`,
      description,
    },
  };
}

export default async function LandingPage() {
  const [courses, platform, locale, t] = await Promise.all([
    getLandingData(),
    getPlatformSettings(),
    getLocale(),
    getTranslations("landing"),
  ]);
  const platformName = platform.name;
  const platformDescription =
    (locale === "en" ? platform.descriptionEn : platform.descriptionId) || t("heroDesc");
  const learningSteps = [
    { Icon: BookOpen, title: t("steps.chooseTitle"), description: t("steps.chooseDescription") },
    { Icon: Code2, title: t("steps.practiceTitle"), description: t("steps.practiceDescription") },
    {
      Icon: Trophy,
      title: t("steps.certificateTitle"),
      description: t("steps.certificateDescription"),
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden">
      <LandingHeader platformName={platformName} />

      <section className="relative overflow-hidden border-b bg-[#eef3ff] py-14 dark:bg-[#122442] sm:py-20 lg:py-24">
        <div className="dot-grid absolute inset-0 opacity-50" />
        <BookOpen
          className="pointer-events-none absolute -left-5 top-24 size-28 -rotate-12 text-primary/15"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <Code2
          className="pointer-events-none absolute left-[24%] top-28 hidden size-12 rotate-6 text-primary/15 lg:block"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <Star
          className="pointer-events-none absolute right-[3%] top-28 size-10 rotate-12 text-[#d6a900]/45"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-primary/20"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 36 C120 8 150 112 280 74 S470 26 590 82 M1160 20 C1240 8 1245 94 1325 78 S1390 48 1440 66"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 9"
          />
        </svg>
        <div className="page-shell relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-2xl">
            <Badge className="mb-5 border-2 border-foreground/10 bg-accent text-accent-foreground">
              <Sparkles /> {t("freeForever")}
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-[-.04em] text-foreground sm:text-5xl lg:text-7xl">
              {t("heroTitle")}{" "}
              <span className="relative text-primary">
                {t("heroHighlight")}
                <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-[#f4c542]/70" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              {platformDescription}
            </p>
            <LandingHeroActions />
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-foreground/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#25956f]" />
                {t("noCreditCard")}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#25956f]" />
                {t("selfPaced")}
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-x-8 bottom-1 h-12 rounded-[50%] bg-navy/10 blur-xl" />
            <Image
              src="/illustrations/hero-learners.png"
              alt={t("heroImageAlt")}
              width={1448}
              height={1086}
              priority
              className="relative h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section id="courses" className="relative overflow-hidden py-16 sm:py-20">
        <div className="page-shell relative">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[.16em] text-primary">
                {t("featuredEyebrow")}
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t("featuredTitle")}
              </h2>
            </div>
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <Link href="/courses">
                {t("allCourses")} <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          {courses.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  actionSlot={<PublicCourseAction courseId={course.id} />}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed bg-muted/30 p-10 text-center">
              <BookOpen className="mx-auto mb-3 size-9 text-primary" />
              <h3 className="font-bold">{t("emptyCoursesTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyCoursesDescription")}</p>
            </div>
          )}
          <div className="mt-8 flex justify-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/courses">
                {t("allCourses")} <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
        <BookOpen
          className="pointer-events-none absolute -bottom-7 right-[7%] size-24 rotate-12 text-primary/10"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-1 h-16 w-full text-primary/15"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M180 58 C300 8 420 74 560 36 S820 72 960 32 S1210 70 1380 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 9"
          />
        </svg>
      </section>

      <section
        id="how"
        className="relative overflow-hidden border-y bg-secondary/60 py-16 sm:py-20"
      >
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-25" />
        <Star
          className="pointer-events-none absolute right-[5%] top-12 size-14 rotate-12 text-[#d6a900]/35"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <div className="page-shell relative">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">
              {t("howEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold">{t("howTitle")}</h2>
          </div>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
            <div className="pointer-events-none absolute left-[17%] right-[17%] top-14 hidden border-t-2 border-dashed border-primary/25 sm:block" />
            {learningSteps.map(({ Icon, title, description }, index) => {
              return (
                <div key={title} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 grid size-28 place-items-center rounded-full border-2 bg-card shadow-sm">
                    <span className="absolute -top-3 grid size-8 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                      {index + 1}
                    </span>
                    <Icon className="size-11 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <LandingFooter platformName={platformName} supportEmail={platform.supportEmail} />
    </main>
  );
}
