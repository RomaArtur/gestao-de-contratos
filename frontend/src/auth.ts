import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const response = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as LoginResponse;
        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
        return token;
      }

      if (token.accessTokenExpires && Date.now() < Number(token.accessTokenExpires)) {
        return token;
      }

      const response = await fetch(`${process.env.API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });
      if (!response.ok) {
        token.accessToken = undefined;
        return token;
      }
      const data = (await response.json()) as LoginResponse;
      token.accessToken = data.accessToken;
      token.refreshToken = data.refreshToken;
      token.role = data.user.role;
      token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
      return token;
    },
    session({ session, token }) {
      if (!token.accessToken) {
        if (session.user) {
          session.user.email = "";
          session.user.name = "";
        }
        return session;
      }
      if (session.user) {
        session.user.role = token.role as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
