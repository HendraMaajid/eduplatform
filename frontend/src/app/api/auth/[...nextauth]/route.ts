import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { AuthResponse } from "@/lib/types";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function readAuthResponse(response: Response): Promise<AuthResponse | null> {
  if (!response.ok) return null;
  return (await response.json()) as AuthResponse;
}

function applyAuth(token: JWT, auth: AuthResponse): JWT {
  return {
    ...token,
    id: auth.user.id,
    name: auth.user.name,
    email: auth.user.email,
    picture: auth.user.avatar || token.picture,
    role: auth.user.role,
    token: auth.token,
    refreshToken: auth.refresh_token,
    tokenExpires: Date.now() + 14 * 60 * 1000,
    error: undefined,
  };
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });
    const auth = await readAuthResponse(response);
    if (!auth) throw new Error("Refresh failed");
    return applyAuth(token, auth);
  } catch {
    return { ...token, error: "RefreshTokenExpired" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email dan password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const response = await fetch(`${backendUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
        const auth = await readAuthResponse(response);
        if (!auth) return null;
        return {
          id: auth.user.id,
          name: auth.user.name,
          email: auth.user.email,
          image: auth.user.avatar,
          role: auth.user.role,
          token: auth.token,
          refreshToken: auth.refresh_token,
          tokenExpires: Date.now() + 14 * 60 * 1000,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { prompt: "select_account", access_type: "offline" } },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && account.id_token) {
        const response = await fetch(`${backendUrl}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
        });
        const auth = await readAuthResponse(response);
        if (!auth) return { ...token, error: "RefreshTokenExpired" };
        return applyAuth(token, auth);
      }
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          token: user.token,
          refreshToken: user.refreshToken,
          tokenExpires: user.tokenExpires,
        };
      }
      if (token.tokenExpires && Date.now() < token.tokenExpires) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.token = token.token;
      session.error = token.error;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.refreshToken) return;
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: token.refreshToken }),
      }).catch(() => undefined);
    },
  },
  pages: { signIn: "/login", signOut: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 2 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
