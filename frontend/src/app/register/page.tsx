"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Nama minimal 2 karakter.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmPassword) return setError("Konfirmasi password belum sama.");
    setLoading(true);
    try {
      await api.post<{ user: User }>("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error)
        throw new Error("Akun dibuat. Silakan masuk menggunakan email dan password.");
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pendaftaran gagal.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Buat akun gratis"
      description="Daftar sebagai siswa dan langsung akses semua course published."
    >
      <Button
        variant="outline"
        className="h-11 w-full border-2"
        disabled={googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          void signIn("google", { callbackUrl: "/dashboard" });
        }}
      >
        {googleLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <span className="grid size-5 place-items-center rounded-full border font-bold text-[#4285f4]">
            G
          </span>
        )}{" "}
        Daftar dengan Google
      </Button>
      <FieldSeparator className="my-6">atau daftar dengan email</FieldSeparator>
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama kamu"
              className="h-11"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="h-11"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
              required
              minLength={8}
            />
            <FieldDescription>Gunakan minimal 8 karakter.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Ulangi password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11"
              required
            />
          </Field>
          <Button type="submit" className="h-11 w-full playful-shadow" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Membuat akun..." : "Buat akun & mulai belajar"}
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
