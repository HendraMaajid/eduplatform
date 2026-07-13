import Image from "next/image";
import Link from "next/link";
import { EduPlatformLogo } from "@/components/brand/edu-platform-logo";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r bg-[#eaf0ff] p-10 dark:bg-[#122442] lg:flex lg:flex-col">
        <Link href="/" className="relative z-10 w-fit" aria-label="EduPlatform, halaman utama">
          <EduPlatformLogo wordmarkClassName="text-lg" />
        </Link>
        <div className="relative z-10 mt-10 max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">
            Belajar tanpa batas
          </p>
          <h2 className="mt-3 text-4xl font-extrabold leading-tight">
            Satu akun untuk semua course, proyek, dan sertifikat.
          </h2>
        </div>
        <Image
          src="/illustrations/auth-student.png"
          alt="Pelajar menggunakan platform pembelajaran"
          width={1122}
          height={1402}
          priority
          className="relative z-0 mx-auto mt-8 max-h-[58vh] w-auto object-contain"
        />
      </section>
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex lg:hidden"
            aria-label="EduPlatform, halaman utama"
          >
            <EduPlatformLogo markClassName="size-8" />
          </Link>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">100% gratis</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
