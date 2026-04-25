"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { UserRole } from "@/lib/types";
import {
  GraduationCap,
  Shield,
  UserCog,
  BookOpen,
  Users,
  Loader2,
} from "lucide-react";

const roles: { role: UserRole; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { role: "super_admin", label: "Super Admin", icon: Shield, desc: "Akses penuh ke semua fitur" },
  { role: "admin", label: "Admin", icon: UserCog, desc: "Kelola kursus dan pengguna" },
  { role: "teacher", label: "Pengajar", icon: BookOpen, desc: "Kelola materi dan penilaian" },
  { role: "student", label: "Siswa", icon: Users, desc: "Belajar dan kerjakan tugas" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentRole } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setErrorMsg("Email atau password salah.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };
  const handleDevLogin = async (role: UserRole) => {
    setSelectedRole(role);
    setLoading(true);

    let email = "";
    if (role === "super_admin") email = "admin@eduplatform.com";
    if (role === "admin") email = "admin@admin.com";
    if (role === "teacher") email = "budi@teacher.com";
    if (role === "student") email = "student@example.com";

    const result = await signIn("credentials", {
      email,
      password: "password123",
      redirect: false,
    });

    if (result?.error) {
      alert("Login gagal: " + result.error);
      setLoading(false);
      setSelectedRole(null);
    } else {
      setCurrentRole(role);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/25">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-extrabold gradient-text">EduPlatform</span>
          </Link>
        </div>

        <Card className="border-0 shadow-2xl glass-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Selamat Datang!</CardTitle>
            <CardDescription>Masuk untuk mulai belajar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-white gap-2"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            {/* Dev mode separator */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                Mode Development
              </span>
            </div>

            {/* Dev Role Selector */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Pilih role untuk testing
              </p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(({ role, label, icon: Icon, desc }) => (
                  <button
                    key={role}
                    onClick={() => handleDevLogin(role)}
                    className={`relative p-3 rounded-xl border text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md ${
                      selectedRole === role
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary mb-1.5" />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    {selectedRole === role && (
                      <div className="absolute top-2 right-2">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Dengan masuk, Anda menyetujui{" "}
          <Link href="#" className="text-primary hover:underline">Syarat & Ketentuan</Link>
          {" "}dan{" "}
          <Link href="#" className="text-primary hover:underline">Kebijakan Privasi</Link>
        </p>
      </div>
    </div>
  );
}
