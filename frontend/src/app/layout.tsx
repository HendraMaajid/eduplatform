import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { getPlatformSettings } from "@/lib/platform-settings";
import "./globals.css";

const jakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-sans",
  weight: "200 800",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [platform, locale] = await Promise.all([getPlatformSettings(), getLocale()]);
  const description = locale === "en" ? platform.descriptionEn : platform.descriptionId;
  const learningTitle = locale === "en" ? "Free Technology Learning" : "Belajar Teknologi Gratis";

  return {
    title: {
      default: `${platform.name} - ${learningTitle}`,
      template: `%s | ${platform.name}`,
    },
    description,
    keywords: [
      "kursus online",
      "pembelajaran",
      "programming",
      "web development",
      "mobile development",
      "UI/UX design",
      "sertifikat online",
      "belajar coding",
    ],
    metadataBase: new URL("https://educourse.hendramaajid.my.id"),
    icons: { icon: "/api/platform-icon", shortcut: "/api/platform-icon" },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "id_ID",
      url: "https://educourse.hendramaajid.my.id",
      siteName: platform.name,
      title: `${platform.name} - ${learningTitle}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${platform.name} - ${learningTitle}`,
      description,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: "https://educourse.hendramaajid.my.id" },
    verification: { google: "SWmKow-jKtZqk_o_a4z0QodFua3OUJiu-mliSD63OJs" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages, platformSettings, requestHeaders] = await Promise.all([
    getLocale(),
    getMessages(),
    getPlatformSettings(),
    headers(),
  ]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      className={`${jakartaSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers nonce={nonce} platformSettings={platformSettings}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
