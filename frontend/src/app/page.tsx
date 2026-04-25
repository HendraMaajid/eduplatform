"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mock-data";
import { api } from "@/lib/api";
import {
  GraduationCap,
  BookOpen,
  Users,
  Trophy,
  Star,
  ArrowRight,
  Play,
  ChevronRight,
  Sparkles,
  Code,
  Palette,
  Database,
  Cloud,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

const features = [
  {
    icon: BookOpen,
    title: "Materi Berkualitas",
    desc: "Kursus disusun oleh instruktur berpengalaman dengan kurikulum terkini",
  },
  {
    icon: Code,
    title: "Project-Based",
    desc: "Belajar dengan membangun proyek nyata yang bisa ditambahkan ke portofolio",
  },
  {
    icon: Trophy,
    title: "Sertifikat",
    desc: "Dapatkan sertifikat resmi setelah menyelesaikan kursus",
  },
  {
    icon: Users,
    title: "Komunitas",
    desc: "Bergabung dengan komunitas learner yang saling membantu",
  },
];

const categories = [
  { name: "Mobile Dev", icon: Code, count: 5, color: "from-blue-500 to-cyan-500" },
  { name: "Web Dev", icon: Code, count: 8, color: "from-indigo-500 to-violet-500" },
  { name: "UI/UX Design", icon: Palette, count: 4, color: "from-pink-500 to-rose-500" },
  { name: "Data Science", icon: Database, count: 3, color: "from-emerald-500 to-teal-500" },
  { name: "DevOps", icon: Cloud, count: 2, color: "from-orange-500 to-amber-500" },
];

const levelLabels: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await api.get("/courses");
        if (data && Array.isArray(data)) {
          setCourses(data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto relative flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 z-10">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">EduPlatform</span>
          </Link>

          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <Link href="#courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Kursus
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fitur
            </Link>
            <Link href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Kategori
            </Link>
          </nav>

          <div className="flex items-center gap-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button size="sm" className="gradient-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" asChild>
              <Link href="/login">
                Mulai Belajar <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-0">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="gap-2 py-1.5 px-4 text-sm border-primary/30 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              Platform Pembelajaran #1 di Indonesia
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Tingkatkan Skill Anda dengan{" "}
              <span className="gradient-text">Kursus Berkualitas</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Pelajari teknologi terkini dari instruktur berpengalaman.
              Bangun portofolio nyata dan dapatkan sertifikat profesional.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gradient-primary text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all text-base px-8" asChild>
                <Link href="/login">
                  Mulai Belajar Gratis <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" asChild>
                <Link href="#courses">
                  <Play className="h-5 w-5 mr-2" />
                  Jelajahi Kursus
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 pt-8">
              {[
                { value: "5+", label: "Kursus" },
                { value: "180+", label: "Siswa" },
                { value: "10+", label: "Instruktur" },
                { value: "4.8", label: "Rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4">Mengapa Kami?</Badge>
            <h2 className="text-3xl font-bold">Belajar dengan Cara Terbaik</h2>
            <p className="text-muted-foreground mt-2">
              Platform kami dirancang untuk memberikan pengalaman belajar terbaik
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <f.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Kursus Populer</h2>
              <p className="text-muted-foreground mt-1">Pilihan kursus terbaik untuk Anda</p>
            </div>
            <Button variant="outline" className="gap-2 hidden sm:flex" asChild>
              <Link href="/login">
                Lihat Semua <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((c) => c.status === "published" || c.status === "active" || c.status === "published")
              .slice(0, 3)
              .map((course) => (
                <Card key={course.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className={`relative h-48 overflow-hidden ${!course.thumbnail ? 'gradient-primary' : 'bg-muted'}`}>
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${course.thumbnail}` : course.thumbnail} 
                        alt={course.title} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30">
                        {levelLabels[course.level] || course.level || "Beginner"}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {course.rating || "4.5"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <Badge variant="outline" className="text-xs mb-2">{course.category}</Badge>
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {course.shortDescription}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {course.modules?.length || course.totalModules || 0} modul
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.enrolledStudents || 0} siswa
                      </span>
                      <span>{course.duration || "12 Minggu"}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(course.price)}
                      </span>
                      <Button size="sm" className="gap-1" asChild>
                        <Link href="/login">
                          Daftar <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Jelajahi Kategori</h2>
            <p className="text-muted-foreground mt-2">
              Temukan kursus berdasarkan bidang yang Anda minati
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Card key={cat.name} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className={`mx-auto mb-3 h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <cat.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat.count} kursus</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 md:p-16 text-center text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h40v40H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%2040L40%200%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.05)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-30" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Siap Memulai Perjalanan Belajar Anda?
              </h2>
              <p className="text-lg text-white/80">
                Bergabung dengan ribuan pelajar dan mulai bangun karir impian Anda hari ini.
              </p>
              <Button size="lg" variant="secondary" className="text-base px-8 shadow-xl" asChild>
                <Link href="/login">
                  Daftar Sekarang — Gratis <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold gradient-text">EduPlatform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EduPlatform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
