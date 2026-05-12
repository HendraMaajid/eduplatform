import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EduCourse by Hendra Maajid - Platform Pembelajaran Online",
    template: "%s | EduCourse",
  },
  description:
    "Platform pembelajaran online terbaik dengan kursus berkualitas tinggi dari instruktur berpengalaman. Belajar Web Development, Mobile Dev, UI/UX, Data Science & DevOps.",
  keywords: [
    "kursus online",
    "pembelajaran",
    "bootcamp",
    "programming",
    "web development",
    "mobile development",
    "UI/UX design",
    "data science",
    "devops",
    "sertifikat online",
    "belajar coding",
  ],
  metadataBase: new URL("https://educourse.hendramaajid.my.id"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://educourse.hendramaajid.my.id",
    siteName: "EduPlatform",
    title: "EduPlatform - Platform Pembelajaran Online Terbaik",
    description:
      "Pelajari teknologi terkini dari instruktur berpengalaman. Bangun portofolio nyata dan dapatkan sertifikat profesional.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduPlatform - Platform Pembelajaran Online",
    description:
      "Platform pembelajaran online dengan kursus berkualitas, quiz interaktif, dan sertifikat profesional.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://educourse.hendramaajid.my.id",
  },
  verification: {
    google: "SWmKow-jKtZqk_o_a4z0QodFua3OUJiu-mliSD63OJs",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${jakartaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
