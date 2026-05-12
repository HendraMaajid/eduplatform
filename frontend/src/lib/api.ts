import { getSession, signOut } from "next-auth/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api";

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const session = await getSession();

    // If session has refresh error, force logout
    if ((session as any)?.error === "RefreshTokenExpired") {
      signOut({ callbackUrl: "/login" });
      throw new Error("Session expired");
    }

    const headers = {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If 401, force re-login
      if (response.status === 401) {
        signOut({ callbackUrl: "/login" });
        throw new Error("Session expired");
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    // Some endpoints might return 204 No Content
    if (response.status === 204) return null;

    return response.json();
  },

  get(endpoint: string, options?: RequestInit) {
    return this.fetch(endpoint, { ...options, method: "GET" });
  },

  post(endpoint: string, data: any, options?: RequestInit) {
    return this.fetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  put(endpoint: string, data: any, options?: RequestInit) {
    return this.fetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(endpoint: string, options?: RequestInit) {
    return this.fetch(endpoint, { ...options, method: "DELETE" });
  },
};
