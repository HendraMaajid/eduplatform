import { getSession } from "next-auth/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api";

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const session = await getSession();
    
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
