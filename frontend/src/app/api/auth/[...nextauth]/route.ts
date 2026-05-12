import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { "Content-Type": "application/json" }
          });

          const data = await res.json();

          if (res.ok && data.user && data.token) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              image: data.user.avatar,
              role: data.user.role,
              token: data.token,
              refreshToken: data.refresh_token,
              tokenExpires: Date.now() + 14 * 60 * 1000, // 14 min (refresh before 15min expiry)
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.token = (user as any).token;
        token.refreshToken = (user as any).refreshToken;
        token.tokenExpires = (user as any).tokenExpires;
        return token;
      }

      // Token still valid — return as is
      if (Date.now() < (token.tokenExpires as number)) {
        return token;
      }

      // Access token expired — refresh it
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: token.refreshToken }),
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        return {
          ...token,
          token: data.token,
          refreshToken: data.refresh_token,
          tokenExpires: Date.now() + 14 * 60 * 1000,
        };
      } catch {
        // Refresh token also expired/invalid — force re-login
        return { ...token, error: "RefreshTokenExpired" };
      }
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session as any).token = token.token;
      }
      if (token.error) {
        (session as any).error = token.error;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours idle timeout
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
