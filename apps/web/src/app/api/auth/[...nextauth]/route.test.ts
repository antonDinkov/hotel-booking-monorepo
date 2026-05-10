/**
 * @jest-environment node
 */

jest.mock("next-auth", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        GET: jest.fn(),
        POST: jest.fn(),
    })),
}));

jest.mock("next-auth/next", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/server/services/auth", () => ({
    __esModule: true,
    ensureOAuthUser: jest.fn(),
    getUserRoles: jest.fn(),
    validateCredentials: jest.fn(),
}));

let getServerSession: any;
let ensureOAuthUser: any;
let getUserRoles: any;
let validateCredentials: any;

let authOptions: any;
let authorize: any;
let authorizeApi: any;
let redirectToRoleDashboard: any;

let mockGetServerSession: jest.Mock;
let mockEnsureOAuthUser: jest.Mock;
let mockGetUserRoles: jest.Mock;
let mockValidateCredentials: jest.Mock;

describe("auth route", () => {
    let credentialsProvider: any;

    beforeAll(async () => {
        jest.resetModules();

        const nextAuthNext = await import("next-auth/next");
        getServerSession = nextAuthNext.getServerSession;

        const authServices = await import("@/server/services/auth");
        ensureOAuthUser = authServices.ensureOAuthUser;
        getUserRoles = authServices.getUserRoles;
        validateCredentials = authServices.validateCredentials;

        mockGetServerSession = getServerSession as jest.Mock;
        mockEnsureOAuthUser = ensureOAuthUser as jest.Mock;
        mockGetUserRoles = getUserRoles as jest.Mock;
        mockValidateCredentials = validateCredentials as jest.Mock;

        const routeModule = await import("./route");
        authOptions = routeModule.authOptions;
        authorize = routeModule.authorize;
        authorizeApi = routeModule.authorizeApi;
        redirectToRoleDashboard = routeModule.redirectToRoleDashboard;
        credentialsProvider = authOptions.providers[0] as any;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Credentials authorize", () => {
        it("returns null when email is missing", async () => {
            const result = await credentialsProvider.options.authorize({
                password: "123456",
            });

            expect(result).toBeNull();
        });

        it("returns null when password is missing", async () => {
            const result = await credentialsProvider.options.authorize({
                email: "john@test.com",
            });

            expect(result).toBeNull();
        });

        it("validates credentials", async () => {
            mockValidateCredentials.mockResolvedValue({
                id: "1",
                email: "john@test.com",
            });

            const result = await credentialsProvider.options.authorize({
                email: "john@test.com",
                password: "123456",
            });

            expect(mockValidateCredentials).toHaveBeenCalledWith(
                "john@test.com",
                "123456"
            );

            expect(result).toEqual({
                id: "1",
                email: "john@test.com",
            });
        });
    });

    describe("callbacks.signIn", () => {
        it("returns true for non github provider", async () => {
            const result = await authOptions.callbacks!.signIn!({
                user: {},
                account: {
                    provider: "credentials",
                },
                profile: {},
            } as any);

            expect(result).toBe(true);
        });

        it("returns false when github email is missing", async () => {
            const result = await authOptions.callbacks!.signIn!({
                user: {},
                account: {
                    provider: "github",
                },
                profile: {},
            } as any);

            expect(result).toBe(false);
        });

        it("creates github oauth user", async () => {
            mockEnsureOAuthUser.mockResolvedValue({
                user: {
                    id: "1",
                    email: "github@test.com",
                },
                created: true,
            });

            const user: any = {};

            const result = await authOptions.callbacks!.signIn!({
                user,
                account: {
                    provider: "github",
                },
                profile: {
                    email: "github@test.com",
                },
            } as any);

            expect(mockEnsureOAuthUser).toHaveBeenCalledWith(
                "github@test.com"
            );

            expect(user.id).toBe("1");
            expect(user.email).toBe("github@test.com");

            expect(result).toBe(true);
        });

        it("uses existing github user", async () => {
            mockEnsureOAuthUser.mockResolvedValue({
                user: {
                    id: "2",
                    email: "existing@test.com",
                },
                created: false,
            });

            const user: any = {
                email: "existing@test.com",
            };

            const result = await authOptions.callbacks!.signIn!({
                user,
                account: {
                    provider: "github",
                },
                profile: {},
            } as any);

            expect(result).toBe(true);
        });
    });

    describe("callbacks.jwt", () => {
        it("returns token unchanged without user", async () => {
            const token = { name: "john" };

            const result = await authOptions.callbacks!.jwt!({
                token,
            } as any);

            expect(result).toEqual(token);
        });

        it("adds user data to token", async () => {
            mockGetUserRoles.mockResolvedValue(["admin"]);

            const token: any = {};
            const user: any = {
                id: "1",
                email: "john@test.com",
            };

            const result = await authOptions.callbacks!.jwt!({
                token,
                user,
            } as any);

            expect(mockGetUserRoles).toHaveBeenCalledWith("1");

            expect(result).toEqual({
                id: "1",
                email: "john@test.com",
                roles: ["admin"],
            });
        });
    });

    describe("callbacks.session", () => {
        it("returns session unchanged without session user", async () => {
            const session = {};

            const result = await authOptions.callbacks!.session!({
                session,
                token: {},
            } as any);

            expect(result).toEqual(session);
        });

        it("adds token data to session", async () => {
            const session: any = {
                user: {},
            };

            const token = {
                id: "1",
                email: "john@test.com",
            };

            const result = await authOptions.callbacks!.session!({
    session,
    token,
} as any);
expect((result.user as any).id).toBe("1");
expect(result.user?.email).toBe("john@test.com");

            /* expect(result.user.id).toBe("1");
            expect(result.user.email).toBe("john@test.com"); */
        });
    });

    describe("callbacks.redirect", () => {
        it("returns baseUrl", async () => {
            const result = await authOptions.callbacks!.redirect!({
                baseUrl: "http://localhost:3000",
                url: "/dashboard",
            });

            expect(result).toBe("http://localhost:3000");
        });
    });

    describe("authorize", () => {
        it("returns unauthenticated when no session", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const result = await authorize(["admin"]);

            expect(result).toEqual({
                ok: false,
                error: "unauthenticated",
                session: null,
                roles: [],
                userId: null,
            });
        });

        it("returns forbidden when role is missing", async () => {
            mockGetServerSession.mockResolvedValue({
                user: {
                    id: "1",
                },
            });

            mockGetUserRoles.mockResolvedValue(["user"]);

            const result = await authorize(["admin"]);

            expect(result).toEqual({
                ok: false,
                error: "forbidden",
                session: {
                    user: {
                        id: "1",
                    },
                },
                roles: ["user"],
                userId: "1",
            });
        });

        it("returns success when role is allowed", async () => {
            mockGetServerSession.mockResolvedValue({
                user: {
                    id: "1",
                },
            });

            mockGetUserRoles.mockResolvedValue(["admin"]);

            const result = await authorize(["admin"]);

            expect(result).toEqual({
                ok: true,
                session: {
                    user: {
                        id: "1",
                    },
                },
                roles: ["admin"],
                userId: "1",
            });
        });
    });

    describe("authorizeApi", () => {
        it("returns 401 when unauthenticated", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const result = await authorizeApi(["admin"]);

            expect(result).toEqual({
                ok: false,
                status: 401,
                response: {
                    error: "Unauthorized",
                },
            });
        });

        it("returns 403 when forbidden", async () => {
            mockGetServerSession.mockResolvedValue({
                user: {
                    id: "1",
                },
            });

            mockGetUserRoles.mockResolvedValue(["user"]);

            const result = await authorizeApi(["admin"]);

            expect(result).toEqual({
                ok: false,
                status: 403,
                response: {
                    error: "Forbidden",
                },
            });
        });

        it("returns success response", async () => {
            mockGetServerSession.mockResolvedValue({
                user: {
                    id: "1",
                },
            });

            mockGetUserRoles.mockResolvedValue(["admin"]);

            const result = await authorizeApi(["admin"]);

            expect(result).toEqual({
                ok: true,
                session: {
                    user: {
                        id: "1",
                    },
                },
                roles: ["admin"],
                userId: "1",
            });
        });
    });

    describe("redirectToRoleDashboard", () => {
        it("returns admin dashboard", () => {
            expect(
                redirectToRoleDashboard(["admin"])
            ).toBe("/admin/dashboard");
        });

        it("returns partner dashboard", () => {
            expect(
                redirectToRoleDashboard(["partner"])
            ).toBe("/partner/dashboard");
        });

        it("returns default dashboard", () => {
            expect(
                redirectToRoleDashboard(["user"])
            ).toBe("/dashboard");
        });
    });
});