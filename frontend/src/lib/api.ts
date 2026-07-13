import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api`;

type ApiErrorBody = { error?: string; message?: string };

let sessionPromise: Promise<Session | null> | null = null;
let sessionCachedUntil = 0;

function cachedSession(): Promise<Session | null> {
  if (!sessionPromise || Date.now() >= sessionCachedUntil) {
    sessionPromise = getSession().catch((error: unknown) => {
      sessionPromise = null;
      throw error;
    });
    sessionCachedUntil = Date.now() + 5_000;
  }
  return sessionPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isPublic =
    endpoint === "/platform" ||
    endpoint.startsWith("/courses") ||
    endpoint.startsWith("/course-categories") ||
    endpoint === "/auth/register";
  const session = isPublic ? null : await cachedSession();
  if (session?.error === "RefreshTokenExpired") {
    await signOut({ callbackUrl: "/login" });
    throw new Error("Sesi berakhir. Silakan masuk kembali.");
  }

  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);
  if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 && !endpoint.startsWith("/auth/")) {
      sessionPromise = null;
      sessionCachedUntil = 0;
      await signOut({ callbackUrl: "/login" });
    }
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // The status text below remains a useful fallback for non-JSON errors.
    }
    throw new Error(body.error || body.message || `Permintaan gagal (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function jsonBody(data: unknown): BodyInit {
  return JSON.stringify(data);
}

export const api = {
  request,
  get<T>(endpoint: string, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: "GET" });
  },
  post<T>(endpoint: string, data?: unknown, options?: RequestInit) {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data === undefined ? undefined : jsonBody(data),
    });
  },
  put<T>(endpoint: string, data: unknown, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: "PUT", body: jsonBody(data) });
  },
  patch<T>(endpoint: string, data: unknown, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: "PATCH", body: jsonBody(data) });
  },
  upload<T>(endpoint: string, formData: FormData, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: "POST", body: formData });
  },
  delete<T = void>(endpoint: string, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
