import type { User } from "./user";

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
};

export type AuthSession = {
  user?: {
    id?: string;
    email?: string;
    roles?: string[];
  };
} | null;

export type StoredAuthSession = {
  accessToken: string | null;
  sessionCookie: string | null;
  user: User;
};

export type MobileLoginResult = {
  accessToken: string;
  user: User;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ClientRegistrationInput = RegisterInput;

export type ClientRegistrationResult = {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  redirectTo: string;
};
