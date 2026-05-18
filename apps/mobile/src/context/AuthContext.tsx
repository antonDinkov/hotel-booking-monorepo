import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { fetchAuthSession, loginClient, registerClient } from '@/lib/authApi';
import {
  clearStoredSession,
  loadStoredUser,
  restoreStoredSession,
  saveStoredSession,
} from '@/lib/sessionStorage';
import type { AuthSession, AuthState, LoginInput, RegisterInput } from '@/types/auth';
import type { User } from '@/types/user';

type AuthContextValue = {
  authState: AuthState;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    let active = true;

    void initializeAuth().then((nextState) => {
      if (!active) return;
      setAuthState(nextState);
    });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    authState,
    login: async (input) => {
      const { user, sessionCookie } = await loginClient(input);
      await saveStoredSession(user, sessionCookie);
      setAuthState({ isAuthenticated: true, isLoading: false, user });
    },
    register: async (input) => {
      await registerClient(input);
      const { user, sessionCookie } = await loginClient(input, input.fullName);
      await saveStoredSession(user, sessionCookie);
      setAuthState({ isAuthenticated: true, isLoading: false, user });
    },
    logout: async () => {
      await clearStoredSession();
      setAuthState({ isAuthenticated: false, isLoading: false, user: null });
    },
  }), [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

async function initializeAuth(): Promise<AuthState> {
  const storedSession = await restoreStoredSession();
  if (!storedSession) {
    return { isAuthenticated: false, isLoading: false, user: null };
  }

  try {
    const session = await fetchAuthSession(storedSession.sessionCookie);
    if (isInvalidSessionResponse(session.status, session.session)) {
      await clearStoredSession();
      return { isAuthenticated: false, isLoading: false, user: null };
    }

    if (isUnavailableSessionResponse(session.status)) {
      return {
        isAuthenticated: true,
        isLoading: false,
        user: storedSession.user,
      };
    }

    const user = mergeSessionUser(storedSession.user, session.session);
    await saveStoredSession(user, storedSession.sessionCookie);

    return {
      isAuthenticated: true,
      isLoading: false,
      user,
    };
  } catch {
    const fallbackUser = loadStoredUser();
    if (fallbackUser) {
      return {
        isAuthenticated: true,
        isLoading: false,
        user: fallbackUser,
      };
    }

    return { isAuthenticated: false, isLoading: false, user: null };
  }
}

function isInvalidSessionResponse(status: number, session: AuthSession): boolean {
  if (status === 401 || status === 403) return true;
  return Boolean(status >= 200 && status < 300 && !session?.user?.email);
}

function isUnavailableSessionResponse(status: number): boolean {
  return status !== 200 && status !== 401 && status !== 403;
}

function mergeSessionUser(storedUser: User, session: AuthSession): User {
  return {
    id: session?.user?.id ?? storedUser.id,
    email: session?.user?.email ?? storedUser.email,
    fullName: storedUser.fullName,
    roles: session?.user?.roles?.length ? session.user.roles : storedUser.roles,
  };
}
