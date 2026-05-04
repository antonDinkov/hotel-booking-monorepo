import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"

import { ensureOAuthUser, validateCredentials } from "@/server/services/auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        return validateCredentials(email, password);
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github") return true;

      console.info("[auth] GitHub profile", profile);

      const email = user.email?.toString().trim() ?? profile?.email?.toString().trim();
      if (!email) return false;

      console.info("[auth] GitHub lookup", { email });

      const { user: oauthUser, created } = await ensureOAuthUser(email);

      if (created) {
        console.info("[auth] GitHub user created", oauthUser);
      } else {
        console.info("[auth] GitHub user found", oauthUser);
      }

      user.id = oauthUser.id;
      user.email = oauthUser.email;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.email) token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.email) session.user.email = token.email as string;
      }

      return session;
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }