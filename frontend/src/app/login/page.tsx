"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { AlertCircle, Loader2 } from "lucide-react";

function GoogleMark() {
  return (
    <span
      aria-hidden
      className="grid size-5 place-items-center rounded-full border font-bold text-[#4285f4]"
    >
      G
    </span>
  );
}

function safeCallbackUrl() {
  if (typeof window === "undefined") return "/dashboard";
  const candidate = new URLSearchParams(window.location.search).get("callbackUrl");
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }
  try {
    const parsed = new URL(candidate, window.location.origin);
    if (parsed.origin !== window.location.origin) return "/dashboard";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email: email.trim(), password, redirect: false });
    if (result?.error) {
      setError("Email atau password tidak cocok.");
      setLoading(false);
      return;
    }
    router.push(safeCallbackUrl());
    router.refresh();
  }

  return (
    <AuthShell
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan progress belajar terakhir kamu."
    >
      <Button
        variant="outline"
        className="h-11 w-full border-2"
        disabled={googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          void signIn("google", { callbackUrl: safeCallbackUrl() });
        }}
      >
        {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleMark />} Lanjutkan dengan
        Google
      </Button>
      <FieldSeparator className="my-6">atau masuk dengan email</FieldSeparator>
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11"
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="h-11"
            />
            <FieldError />
          </Field>
          <Button type="submit" className="h-11 w-full playful-shadow" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Memeriksa akun..." : "Masuk"}
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  );
}
