// Mock modules BEFORE imports to avoid side-effects
jest.resetModules();

jest.mock("next-auth", () => {
  const NextAuth = jest.fn().mockReturnValue(() => {});
  return { __esModule: true, default: NextAuth, NextAuth };
});

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(async () => ({
    get: jest.fn(() => null),
  })),
}));

jest.mock("next-auth/providers/credentials", () => jest.fn((opts) => ({ credentialsProvider: opts })));
jest.mock("next-auth/providers/github", () => jest.fn((opts) => ({ githubProvider: opts })));

jest.mock("@/server/services/auth", () => ({
  getUserRoles: jest.fn(),
  ensureOAuthUser: jest.fn(),
  validateCredentialsForRole: jest.fn(),
}));

import { authOptions, authorize, authorizeApi, redirectToRoleDashboard } from "./route";
import { getServerSession } from "next-auth/next";
import { getUserRoles, ensureOAuthUser, validateCredentialsForRole } from "@/server/services/auth";

const mockGetServerSession = getServerSession as jest.MockedFunction<any>;
const mockGetUserRoles = getUserRoles as jest.MockedFunction<any>;
const mockEnsureOAuthUser = ensureOAuthUser as jest.MockedFunction<any>;

type AuthCallbacks = NonNullable<typeof authOptions.callbacks>;
const callbacks = authOptions.callbacks as AuthCallbacks & {
  jwt: NonNullable<AuthCallbacks["jwt"]>;
  session: NonNullable<AuthCallbacks["session"]>;
  signIn: NonNullable<AuthCallbacks["signIn"]>;
  redirect: NonNullable<AuthCallbacks["redirect"]>;
};

describe("auth route", () => {
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it("authorize returns unauthenticated when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await authorize(["client"]);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("unauthenticated");
  });

  it("authorize returns forbidden when user lacks role", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1" } });
    mockGetUserRoles.mockResolvedValue(["client"]);

    const result = await authorize(["admin"]);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("forbidden");
  });

  it("authorizeApi returns 401 for unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await authorizeApi(["client"]);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.response).toEqual({ error: "Unauthorized" });
  });

  it("authorizeApi returns 403 for forbidden", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1" } });
    mockGetUserRoles.mockResolvedValue(["client"]);

    const result = await authorizeApi(["admin"]);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.response).toEqual({ error: "Forbidden" });
  });

  it("authorizeApi returns ok for allowed roles", async () => {
    const session = { user: { id: "u2" } };
    mockGetServerSession.mockResolvedValue(session);
    mockGetUserRoles.mockResolvedValue(["client"]);

    const result = await authorizeApi(["client"]);

    expect(result.ok).toBe(true);
    expect(result.userId).toBe("u2");
  });

  it("redirectToRoleDashboard returns expected paths", () => {
    expect(redirectToRoleDashboard(["admin"])) .toBe("/admin/dashboard");
    expect(redirectToRoleDashboard(["partner"])) .toBe("/partner/dashboard");
    expect(redirectToRoleDashboard(["client"])) .toBe("/dashboard");
  });

  it("jwt callback attaches id, email and roles", async () => {
    mockGetUserRoles.mockResolvedValue(["admin"]);

    const token = await callbacks.jwt({ token: {}, user: { id: "u3", email: "e3" } } as any);

    expect(token.id).toBe("u3");
    expect(token.email).toBe("e3");
    expect(token.roles).toEqual(["admin"]);
  });

  it("session callback sets session.user.id and email", async () => {
    const session = { user: {} };
    const out = await callbacks.session({ session, token: { id: "u4", email: "e4" } } as any) as any;

    expect(out.user.id).toBe("u4");
    expect(out.user.email).toBe("e4");
  });

  it("signIn callback handles github provider and upserts oauth user", async () => {
    const user: any = {};
    mockEnsureOAuthUser.mockResolvedValue({ user: { id: "oauth1", email: "o@example.com" }, created: true });
    mockGetUserRoles.mockResolvedValue(["client"]);

    const allowed = await callbacks.signIn({ user, account: { provider: "github" }, profile: { email: "o@example.com" } } as any);

    expect(allowed).toBe(true);
    expect(user.id).toBe("oauth1");
    expect(user.email).toBe("o@example.com");
  });

  it("signIn callback handles github provider when existing oauth user (created=false)", async () => {
    const user: any = {};
    mockEnsureOAuthUser.mockResolvedValue({ user: { id: "oauth2", email: "o2@example.com" }, created: false });
    mockGetUserRoles.mockResolvedValue(["client"]);

    const allowed = await callbacks.signIn({ user, account: { provider: "github" }, profile: { email: "o2@example.com" } } as any);

    expect(allowed).toBe(true);
    expect(user.id).toBe("oauth2");
    expect(user.email).toBe("o2@example.com");
  });

  it("signIn callback allows non-github providers", async () => {
    const allowed = await callbacks.signIn({ user: {}, account: { provider: "credentials" } } as any);
    expect(allowed).toBe(true);
  });

  it("credentials provider authorize returns null when missing credentials and calls validateCredentials when provided", async () => {
    const credsProvider = (authOptions.providers?.[0] as any).credentialsProvider;

    // missing credentials -> null
    const resMissing = await credsProvider.authorize?.({} as any);
    expect(resMissing).toBeNull();

    // valid credentials -> calls validateCredentialsForRole
    const mockValidate = validateCredentialsForRole as jest.MockedFunction<any>;
    mockValidate.mockResolvedValue({ id: "cred-user", email: "cred@example.com" });

    const resValid = await credsProvider.authorize?.({ email: "cred@example.com", password: "secret" } as any);
    expect(mockValidate).toHaveBeenCalledWith("cred@example.com", "secret", "client");
    expect(resValid).toEqual({ id: "cred-user", email: "cred@example.com" });
  });

  it("signIn callback returns false for github when no email available", async () => {
    const user: any = {};
    const allowed = await callbacks.signIn({ user, account: { provider: "github" }, profile: {} } as any);
    expect(allowed).toBe(false);
  });

  it("redirect callback returns the provided baseUrl", async () => {
    const out = await callbacks.redirect({ url: "http://other.example/login", baseUrl: "http://example.com" } as any);
    expect(out).toBe("http://example.com");
  });
});
