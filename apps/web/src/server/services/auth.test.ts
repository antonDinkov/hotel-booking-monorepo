// CRITICAL: Mock modules BEFORE any imports to prevent db/index.ts initialization
jest.resetModules();

jest.mock("@/db", () => ({
    db: {
        select: jest.fn(),
        insert: jest.fn(),
    },
}));

jest.mock("bcryptjs");

import bcrypt from "bcryptjs";
import { validateCredentials, ensureOAuthUser, getUserRoles } from "./auth";
import { db } from "@/db";

const mockDb = db as jest.Mocked<typeof db>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("auth service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("validateCredentials", () => {
        it("should return null when user is not found", async () => {
            const mockSelect = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });

            mockDb.select = mockSelect;

            const result = await validateCredentials("notfound@example.com", "password");

            expect(result).toBeNull();
            expect(mockSelect).toHaveBeenCalled();
        });

        it("should return null when user has no passwordHash", async () => {
            const mockSelect = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([
                        {
                            id: "user-123",
                            email: "test@example.com",
                            passwordHash: null,
                        },
                    ]),
                }),
            });

            mockDb.select = mockSelect;

            const result = await validateCredentials("test@example.com", "password");

            expect(result).toBeNull();
        });

        it("should return null when password comparison fails", async () => {
            const mockSelect = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([
                        {
                            id: "user-123",
                            email: "test@example.com",
                            passwordHash: "$2a$10$hashedpassword",
                        },
                    ]),
                }),
            });

            mockDb.select = mockSelect;
            mockBcrypt.compare.mockResolvedValue(false);

            const result = await validateCredentials("test@example.com", "wrongpassword");

            expect(result).toBeNull();
            expect(mockBcrypt.compare).toHaveBeenCalledWith(
                "wrongpassword",
                "$2a$10$hashedpassword"
            );
        });

        it("should return user id and email when credentials are valid", async () => {
            const mockSelect = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([
                        {
                            id: "user-123",
                            email: "test@example.com",
                            passwordHash: "$2a$10$hashedpassword",
                        },
                    ]),
                }),
            });

            mockDb.select = mockSelect;
            mockBcrypt.compare.mockResolvedValue(true);

            const result = await validateCredentials("test@example.com", "correctpassword");

            expect(result).toEqual({
                id: "user-123",
                email: "test@example.com",
            });
            expect(mockBcrypt.compare).toHaveBeenCalledWith(
                "correctpassword",
                "$2a$10$hashedpassword"
            );
        });

        it("should select only id, email, and passwordHash from users", async () => {
            const mockSelect = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });

            mockDb.select = mockSelect;

            await validateCredentials("test@example.com", "password");

            expect(mockSelect).toHaveBeenCalledWith({
                id: expect.anything(),
                email: expect.anything(),
                passwordHash: expect.anything(),
            });
        });
    });

    describe("ensureOAuthUser", () => {
        it("should normalize email by trimming and lowercasing", async () => {
            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            {
                                id: "user-123",
                                email: "test@example.com",
                            },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

            mockDb.insert = jest
                .fn()
                .mockReturnValueOnce({
                    values: jest.fn().mockResolvedValue([]),
                });

            const result = await ensureOAuthUser("  TEST@EXAMPLE.COM  ");

            expect(result.user.email).toBe("test@example.com");
        });

        it("should return existing user with created: false", async () => {
            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            {
                                id: "user-456",
                                email: "existing@example.com",
                            },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { userId: "user-456", roleId: "role-client" },
                        ]),
                    }),
                });

            mockDb.insert = jest.fn();

            const result = await ensureOAuthUser("existing@example.com");

            expect(result.created).toBe(false);
            expect(result.user).toEqual({
                id: "user-456",
                email: "existing@example.com",
            });
        });

        it("should create new user with created: true", async () => {
            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

            mockDb.insert = jest
                .fn()
                .mockReturnValueOnce({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([
                            {
                                id: "user-789",
                                email: "newuser@example.com",
                            },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    values: jest.fn().mockResolvedValue([]),
                });

            const result = await ensureOAuthUser("newuser@example.com");

            expect(result.created).toBe(true);
            expect(result.user.email).toBe("newuser@example.com");
        });

        it("should handle non-array returning response", async () => {
            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

            mockDb.insert = jest
                .fn()
                .mockReturnValueOnce({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue({
                            id: "user-1",
                            email: "test@test.com",
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    values: jest.fn().mockResolvedValue([]),
                });

            const result = await ensureOAuthUser("test@test.com");

            expect(result.user.id).toBe("user-1");
            expect(result.created).toBe(true);
        });

        it("should set passwordHash to null for new OAuth users", async () => {
            const insertedValues: any = {};

            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

            mockDb.insert = jest
                .fn()
                .mockReturnValueOnce({
                    values: jest.fn().mockImplementation((values) => {
                        insertedValues.userInsert = values;
                        return {
                            returning: jest.fn().mockResolvedValue([
                                {
                                    id: "user-oauth",
                                    email: "oauth@example.com",
                                },
                            ]),
                        };
                    }),
                })
                .mockReturnValueOnce({
                    values: jest.fn().mockResolvedValue([]),
                });

            await ensureOAuthUser("oauth@example.com");

            expect(insertedValues.userInsert).toEqual({
                email: "oauth@example.com",
                passwordHash: null,
            });
        });

        it("should throw error when client role does not exist", async () => {
            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

            mockDb.insert = jest
                .fn()
                .mockReturnValueOnce({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([
                            {
                                id: "user-new",
                                email: "test@example.com",
                            },
                        ]),
                    }),
                });

            await expect(ensureOAuthUser("test@example.com")).rejects.toThrow(
                "Role 'client' does not exist"
            );
        });

        it("should not duplicate role assignment for existing user", async () => {
            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            {
                                id: "user-123",
                                email: "test@example.com",
                            },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { userId: "user-123", roleId: "role-client" },
                        ]),
                    }),
                });

            mockDb.insert = jest.fn();

            const result = await ensureOAuthUser("test@example.com");

            expect(result.created).toBe(false);
            // insert should not be called since user already exists
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it("should assign client role to new users", async () => {
            const insertedValues: any = {};

            mockDb.select = jest
                .fn()
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { id: "role-client-id" },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

            mockDb.insert = jest
                .fn()
                .mockReturnValueOnce({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([
                            {
                                id: "new-user-id",
                                email: "newuser@example.com",
                            },
                        ]),
                    }),
                })
                .mockReturnValueOnce({
                    values: jest.fn().mockImplementation((values) => {
                        insertedValues.roleInsert = values;
                        return Promise.resolve();
                    }),
                });

            const result = await ensureOAuthUser("newuser@example.com");

            expect(insertedValues.roleInsert).toEqual({
                userId: "new-user-id",
                roleId: "role-client-id",
            });
            expect(result.created).toBe(true);
        });
    });

    describe("getUserRoles", () => {
        it("should return empty array when user has no roles", async () => {
            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const result = await getUserRoles("user-123");

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it("should return array of role names for user with roles", async () => {
            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { name: "client" },
                            { name: "admin" },
                        ]),
                    }),
                }),
            });

            const result = await getUserRoles("user-123");

            expect(result).toEqual(["client", "admin"]);
            expect(result).toHaveLength(2);
        });

        it("should return single role when user has one role", async () => {
            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { name: "client" },
                        ]),
                    }),
                }),
            });

            const result = await getUserRoles("user-123");

            expect(result).toEqual(["client"]);
            expect(result).toHaveLength(1);
        });

        it("should filter results by userId", async () => {
            const mockWhere = jest.fn().mockResolvedValue([
                { name: "partner" },
            ]);

            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: mockWhere,
                    }),
                }),
            });

            const userId = "specific-user-id";
            const result = await getUserRoles(userId);

            expect(result).toEqual(["partner"]);
            expect(mockWhere).toHaveBeenCalled();
        });

        it("should join roles and userRoles tables correctly", async () => {
            const mockInnerJoin = jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([
                    { name: "client" },
                ]),
            });

            const mockFrom = jest.fn().mockReturnValue({
                innerJoin: mockInnerJoin,
            });

            mockDb.select = jest.fn().mockReturnValue({
                from: mockFrom,
            });

            await getUserRoles("user-123");

            expect(mockFrom).toHaveBeenCalled();
            expect(mockInnerJoin).toHaveBeenCalled();
        });

        it("should map role names correctly from result rows", async () => {
            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([
                            { name: "admin" },
                            { name: "partner" },
                            { name: "client" },
                        ]),
                    }),
                }),
            });

            const result = await getUserRoles("user-123");

            expect(result).toEqual(["admin", "partner", "client"]);
            expect(result.every((role) => typeof role === "string")).toBe(true);
        });
    });
});
