import type { User } from './user';

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
  sessionCookie: string | null;
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
