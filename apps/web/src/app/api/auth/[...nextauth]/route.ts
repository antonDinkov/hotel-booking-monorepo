import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Тук пишеш логиката за проверка на имейл/парола
        // Например: проверка в база данни
        if (credentials?.email === "test@example.com" && credentials?.password === "1234") {
          return { id: "1", name: "Test User", email: "test@example.com" };
        }
        // Ако не е валидно → връща null
        return null;
      }
    })
  ],
})

export { handler as GET, handler as POST }