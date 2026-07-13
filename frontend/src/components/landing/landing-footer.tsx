import Link from "next/link";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { EduPlatformLogo } from "@/components/brand/edu-platform-logo";

export function LandingFooter({
  platformName,
  supportEmail,
}: {
  platformName: string;
  supportEmail?: string | null;
}) {
  const t = useTranslations("landing");
  return (
    <footer id="about" className="relative overflow-hidden border-t bg-background py-12 sm:py-14">
      <div
        className="pointer-events-none absolute -right-7 bottom-1 text-primary/10 sm:right-5"
        aria-hidden
      >
        <GraduationCap className="size-36 rotate-6 sm:size-44" strokeWidth={1.15} />
      </div>
      <svg
        className="pointer-events-none absolute bottom-3 right-28 hidden h-20 w-64 text-primary/20 md:block"
        viewBox="0 0 260 80"
        aria-hidden="true"
      >
        <path
          d="M2 64 C62 15 112 78 180 38 S234 28 258 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="7 8"
        />
        <rect x="8" y="54" width="10" height="10" rx="1" fill="#f4c542" />
      </svg>
      <div className="page-shell relative grid gap-9 text-sm md:grid-cols-[1.4fr_.65fr_.85fr] md:gap-12">
        <div className="max-w-md">
          <Link
            href="/"
            className="inline-flex"
            aria-label={t("homeAria", { platform: platformName })}
          >
            <EduPlatformLogo platformName={platformName} wordmarkClassName="text-xl" />
          </Link>
          <p className="mt-4 leading-6 text-muted-foreground">
            {t("footer.description", { platform: platformName })}
          </p>
        </div>
        <div>
          <p className="font-bold text-foreground">{t("footer.explore")}</p>
          <nav
            className="mt-3 flex flex-col items-start gap-2.5"
            aria-label={t("footer.navigation")}
          >
            <Link href="/#courses" className="hover:text-primary">
              {t("footer.featuredCourses")}
            </Link>
            <Link href="/courses" className="hover:text-primary">
              {t("allCourses")}
            </Link>
            <Link href="/#how" className="hover:text-primary">
              {t("header.howToLearn")}
            </Link>
          </nav>
        </div>
        <div>
          <p className="font-bold text-foreground">{t("footer.needHelp")}</p>
          <a
            href={`mailto:${supportEmail || "support@eduplatform.id"}`}
            className="mt-3 inline-block font-semibold text-primary hover:underline"
          >
            {supportEmail || "support@eduplatform.id"}
          </a>
          <p className="mt-4 max-w-52 leading-6 text-muted-foreground">
            {t("footer.helpDescription")}
          </p>
        </div>
      </div>
    </footer>
  );
}
