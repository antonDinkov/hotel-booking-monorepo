import type { DefaultSession } from "next-auth";

// Shared auth shape for session user augmentation.
export type AuthSessionUser = {
  id: string;
  email: string;
};

declare module "next-auth" {
  interface Session {
    user: AuthSessionUser & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

export {};
