import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/types";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    token: string;
    refreshToken: string;
    tokenExpires: number;
  }

  interface Session {
    user: DefaultSession["user"] & { id: string; role: UserRole };
    token: string;
    error?: "RefreshTokenExpired";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    token: string;
    refreshToken: string;
    tokenExpires: number;
    error?: "RefreshTokenExpired";
  }
}
