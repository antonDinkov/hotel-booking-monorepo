// CRITICAL: Mock modules BEFORE any imports to prevent db/index.ts initialization
jest.resetModules();

jest.mock("@/db", () => ({
    db: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
    },
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
    authOptions: {},
}));

import { getServerSession } from "next-auth";
import { getCurrentUserProfile, updateCurrentUserProfile } from "./profile";
import { db } from "@/db";
import type { ProfileData } from "@/types/profile";

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.Mock;

describe("profile service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getCurrentUserProfile", () => {
        it("should return null when user is unauthenticated", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const result = await getCurrentUserProfile();

            expect(result).toBeNull();
            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("should map database profile fields into ProfileData", async () => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

            const mockRow = {
                email: "jane@example.com",
                fullName: "Jane Doe",
                phone: null,
                nationality: null,
                dateOfBirth: new Date("1992-03-18T00:00:00Z"),
                gender: null,
                passportNumber: "P123456",
                avatarKey: null,
                street: null,
                city: "Sofia",
                country: null,
                zip: "1000",
            };

            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([mockRow]),
                    }),
                }),
            });

            const result = await getCurrentUserProfile();

            expect(result).toEqual({
                name: "Jane Doe",
                email: "jane@example.com",
                phone: "",
                nationality: "",
                dateOfBirth: "1992-03-18",
                gender: "Prefer not to say",
                passportNumber: "P123456",
                avatarKey: null,
                preferences: {
                    smoking: false,
                    pets: true,
                    notifications: true,
                },
                address: {
                    street: "",
                    city: "Sofia",
                    country: "",
                    zip: "1000",
                },
            });
        });

        it("should map string dateOfBirth correctly", async () => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-789" } });

            const mockRow = {
                email: "string@example.com",
                fullName: "String User",
                phone: null,
                nationality: null,
                dateOfBirth: "1992-03-18",
                gender: null,
                passportNumber: null,
                avatarKey: null,
                street: null,
                city: null,
                country: null,
                zip: null,
            };

            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([mockRow]),
                    }),
                }),
            });

            const result = await getCurrentUserProfile();

            expect(result?.dateOfBirth).toBe("1992-03-18");
        });
    });

    describe("updateCurrentUserProfile", () => {
        it("should update user email and upsert the profile", async () => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-456" } });

            const profile: ProfileData = {
                name: "  John Doe  ",
                email: "john@example.com",
                phone: "",
                nationality: "Bulgaria",
                dateOfBirth: "1990-05-10",
                gender: "Male",
                passportNumber: "A1234567",
                avatarKey: "https://example.com/avatar.jpg",
                preferences: {
                    smoking: false,
                    pets: true,
                    notifications: true,
                },
                address: {
                    street: "Main St",
                    city: "Plovdiv",
                    country: "Bulgaria",
                    zip: "4000",
                },
            };

            const mockUpdateWhere = jest.fn().mockResolvedValue([]);
            const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
            mockDb.update = jest.fn().mockReturnValue({ set: mockUpdateSet });

            const mockOnConflict = jest.fn().mockResolvedValue([]);
            const mockValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
            mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

            const updatedRow = {
                email: "john@example.com",
                fullName: "John Doe",
                phone: null,
                nationality: "Bulgaria",
                dateOfBirth: "1990-05-10",
                gender: "Male",
                passportNumber: "A1234567",
                avatarKey: "https://example.com/avatar.jpg",
                street: "Main St",
                city: "Plovdiv",
                country: "Bulgaria",
                zip: "4000",
            };

            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([updatedRow]),
                    }),
                }),
            });

            const result = await updateCurrentUserProfile(profile);

            expect(mockUpdateSet).toHaveBeenCalledWith({ email: "john@example.com" });
            expect(mockValues).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-456",
                    fullName: "John Doe",
                    phone: null,
                    nationality: "Bulgaria",
                    dateOfBirth: "1990-05-10",
                    gender: "Male",
                    passportNumber: "A1234567",
                    avatarKey: "https://example.com/avatar.jpg",
                    street: "Main St",
                    city: "Plovdiv",
                    country: "Bulgaria",
                    zip: "4000",
                })
            );
            expect(mockOnConflict).toHaveBeenCalled();
            expect(result?.email).toBe("john@example.com");
            expect(result?.name).toBe("John Doe");
            expect(result?.avatarKey).toBe("https://example.com/avatar.jpg");
        });

        it("returns null when unauthenticated (early-return)", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const profile: ProfileData = {
                name: "Test",
                email: "t@example.com",
                phone: "",
                nationality: "",
                dateOfBirth: "",
                gender: "",
                passportNumber: "",
                avatarKey: null,
                preferences: { smoking: false, pets: false, notifications: false },
                address: { street: "", city: "", country: "", zip: "" },
            };

            const res = await updateCurrentUserProfile(profile);
            expect(res).toBeNull();
            expect(mockDb.update).not.toHaveBeenCalled();
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        describe("helper normalization functions", () => {
            // import helpers for direct unit testing
            const helpers = require("./profile") as any;

            it("normalizeOptionalDbString returns null for empty/whitespace and trims otherwise", () => {
                expect(helpers.normalizeOptionalDbString(null)).toBeNull();
                expect(helpers.normalizeOptionalDbString("")).toBeNull();
                expect(helpers.normalizeOptionalDbString("   ")).toBeNull();
                expect(helpers.normalizeOptionalDbString("  abc ")).toBe("abc");
            });

            it("normalizeDateValue handles Date, string and falsy", () => {
                expect(helpers.normalizeDateValue(null)).toBe("");
                const d = new Date("2000-01-02T00:00:00Z");
                expect(helpers.normalizeDateValue(d)).toBe("2000-01-02");
                expect(helpers.normalizeDateValue("1999-12-31")).toBe("1999-12-31");
            });

            it("normalizeGender returns default when empty and trims otherwise", () => {
                expect(helpers.normalizeGender(null)).toBe("Prefer not to say");
                expect(helpers.normalizeGender("")).toBe("Prefer not to say");
                expect(helpers.normalizeGender("  Male ")).toBe("Male");
            });

            it("buildProfileInsertValues and buildProfileUpdateValues normalize avatarKey and other fields", () => {
                const profile: any = {
                    name: " Bob ",
                    email: "b@e.com",
                    phone: "",
                    nationality: "",
                    dateOfBirth: "",
                    gender: "",
                    passportNumber: "",
                    avatarKey: "   ",
                    preferences: { smoking: false, pets: false, notifications: false },
                    address: { street: " ", city: " ", country: " ", zip: " " },
                };

                const insert = helpers.buildProfileInsertValues("u1", profile);
                expect(insert.userId).toBe("u1");
                expect(insert.avatarKey).toBeNull();

                const update = helpers.buildProfileUpdateValues(profile);
                expect(update.avatarKey).toBeNull();
            });

            it("mapProfileRow maps row values including date and defaults", () => {
                const row = {
                    email: "x@x.com",
                    fullName: " Alice ",
                    phone: null,
                    nationality: null,
                    dateOfBirth: new Date("2001-02-03T00:00:00Z"),
                    gender: null,
                    passportNumber: null,
                    avatarKey: null,
                    street: null,
                    city: null,
                    country: null,
                    zip: null,
                };

                const mapped = helpers.mapProfileRow(row);
                expect(mapped.name).toBe("Alice");
                expect(mapped.dateOfBirth).toBe("2001-02-03");
                expect(mapped.gender).toBe("Prefer not to say");
            });

            it("buildProfileInsertValues keeps a real avatarKey when provided", () => {
                const profile: any = {
                    name: "Bob",
                    email: "b@e.com",
                    phone: "",
                    nationality: "",
                    dateOfBirth: "",
                    gender: "",
                    passportNumber: "",
                    avatarKey: "https://img.example/img.png",
                    preferences: { smoking: false, pets: false, notifications: false },
                    address: { street: "", city: "", country: "", zip: "" },
                };

                const insert = helpers.buildProfileInsertValues("u2", profile);
                expect(insert.avatarKey).toBe("https://img.example/img.png");

                const update = helpers.buildProfileUpdateValues(profile);
                expect(update.avatarKey).toBe("https://img.example/img.png");
            });

            it("getCurrentUserProfile returns null when profile row not found", async () => {
                mockGetServerSession.mockResolvedValue({ user: { id: "user-empty" } });
                mockDb.select = jest.fn().mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        leftJoin: jest.fn().mockReturnValue({
                            where: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                });

                const res = await getCurrentUserProfile();
                expect(res).toBeNull();
            });
        });

        it("should handle empty optional fields and insert nulls where appropriate", async () => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-000" } });

            const profile: ProfileData = {
                name: "  ",
                email: " ",
                phone: "",
                nationality: "",
                dateOfBirth: "",
                gender: "",
                passportNumber: "",
                avatarKey: "",
                preferences: { smoking: false, pets: false, notifications: false },
                address: { street: "", city: "", country: "", zip: "" },
            };

            const mockUpdateWhere = jest.fn().mockResolvedValue([]);
            const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
            mockDb.update = jest.fn().mockReturnValue({ set: mockUpdateSet });

            const mockOnConflict = jest.fn().mockResolvedValue([]);
            const mockValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
            mockDb.insert = jest.fn().mockReturnValue({ values: mockValues });

            mockDb.select = jest.fn().mockReturnValue({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await updateCurrentUserProfile(profile);

            expect(mockValues).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-000",
                    fullName: null,
                    phone: null,
                    nationality: null,
                    dateOfBirth: null,
                    gender: null,
                    passportNumber: null,
                    avatarKey: null,
                    street: null,
                    city: null,
                    country: null,
                    zip: null,
                })
            );
        });
    });
});
