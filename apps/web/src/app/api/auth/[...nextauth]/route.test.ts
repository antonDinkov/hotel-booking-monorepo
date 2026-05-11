// Mock modules BEFORE imports to avoid side-effects
jest.resetModules();

jest.mock("next-auth", () => {
  const NextAuth = jest.fn().mockReturnValue(() => {});
  return { __esModule: true, default: NextAuth, NextAuth };
});

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/providers/credentials", () => jest.fn((opts) => ({ credentialsProvider: opts })));
jest.mock("next-auth/providers/github", () => jest.fn((opts) => ({ githubProvider: opts })));

jest.mock("@/server/services/auth", () => ({
  getUserRoles: jest.fn(),
  ensureOAuthUser: jest.fn(),
  validateCredentials: jest.fn(),
}));

import { authOptions, authorize, authorizeApi, redirectToRoleDashboard } from "./route";
import { getServerSession } from "next-auth/next";
import { getUserRoles, ensureOAuthUser } from "@/server/services/auth";

const mockGetServerSession = getServerSession as jest.MockedFunction<any>;
const mockGetUserRoles = getUserRoles as jest.MockedFunction<any>;
const mockEnsureOAuthUser = ensureOAuthUser as jest.MockedFunction<any>;

describe("auth route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    const token = await authOptions.callbacks.jwt({ token: {}, user: { id: "u3", email: "e3" } } as any);

    expect(token.id).toBe("u3");
    expect(token.email).toBe("e3");
    expect(token.roles).toEqual(["admin"]);
  });

  it("session callback sets session.user.id and email", async () => {
    const session = { user: {} };
    const out = await authOptions.callbacks.session({ session, token: { id: "u4", email: "e4" } } as any);

    expect(out.user.id).toBe("u4");
    expect(out.user.email).toBe("e4");
  });

  it("signIn callback handles github provider and upserts oauth user", async () => {
    const user: any = {};
    mockEnsureOAuthUser.mockResolvedValue({ user: { id: "oauth1", email: "o@example.com" }, created: true });

    const allowed = await authOptions.callbacks.signIn({ user, account: { provider: "github" }, profile: { email: "o@example.com" } } as any);

    expect(allowed).toBe(true);
    expect(user.id).toBe("oauth1");
    expect(user.email).toBe("o@example.com");
  });

  it("signIn callback allows non-github providers", async () => {
    const allowed = await authOptions.callbacks.signIn({ user: {}, account: { provider: "credentials" } } as any);
    expect(allowed).toBe(true);
  });
});
