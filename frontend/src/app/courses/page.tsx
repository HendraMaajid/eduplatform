import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookOpen, Code2, Sparkles } from "lucide-react";
import { PublicCourseCatalog } from "@/components/course/public-course-catalog";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [platform, t] = await Promise.all([
    getPlatformSettings(),
    getTranslations("publicCatalog"),
  ]);
  return {
    title: `${t("metaTitle")} | ${platform.name}`,
    description: t("metaDescription"),
  };
}

export default async function PublicCoursesPage() {
  const [platform, t] = await Promise.all([
    getPlatformSettings(),
    getTranslations("publicCatalog"),
  ]);
  const platformName = platform.name;

  return (
    <main className="min-h-screen overflow-hidden">
      <LandingHeader platformName={platformName} />
      <section className="relative border-b bg-[#eef3ff] py-14 dark:bg-[#122442] sm:py-18">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <BookOpen
          className="pointer-events-none absolute -left-8 top-10 size-32 -rotate-12 text-primary/10"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <Code2
          className="pointer-events-none absolute right-[8%] top-12 size-16 rotate-6 text-primary/15"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <div className="page-shell relative max-w-4xl text-center">
          <Sparkles className="mx-auto mb-5 size-8 text-primary" aria-hidden="true" />
          <h1 className="text-balance text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty leading-7 text-muted-foreground sm:text-lg">
            {t("heroDescription")}
          </p>
        </div>
      </section>
      <section className="page-shell py-12 sm:py-16">
        <PublicCourseCatalog />
      </section>
      <LandingFooter platformName={platformName} supportEmail={platform.supportEmail} />
    </main>
  );
}
