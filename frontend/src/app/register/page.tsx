"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { GraduationCap, Loader2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setErrorMsg("Nama lengkap wajib diisi.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Email wajib diisi.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak sama.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register", {
        name: trimmedName,
        email,
        password,
      });

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setSuccessMsg("Akun berhasil dibuat. Silakan login untuk masuk.");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mendaftar.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
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
            <CardTitle className="text-xl">Buat Akun Baru</CardTitle>
            <CardDescription>Lengkapi data untuk mulai belajar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-sm text-emerald-600 bg-emerald-500/10 rounded-md">
                  {successMsg}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nama kamu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
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
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-white gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
