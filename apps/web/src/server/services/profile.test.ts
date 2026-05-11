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
                avatarUrl: null,
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
                avatarUrl: null,
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
                avatarUrl: "https://example.com/avatar.jpg",
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
                avatarUrl: "https://example.com/avatar.jpg",
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
                    avatarUrl: "https://example.com/avatar.jpg",
                    street: "Main St",
                    city: "Plovdiv",
                    country: "Bulgaria",
                    zip: "4000",
                })
            );
            expect(mockOnConflict).toHaveBeenCalled();
            expect(result?.email).toBe("john@example.com");
            expect(result?.name).toBe("John Doe");
            expect(result?.avatarUrl).toBe("https://example.com/avatar.jpg");
        });
    });
});
