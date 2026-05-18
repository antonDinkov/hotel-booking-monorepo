/**
 * @jest-environment node
 */

// Ensure we can mock the profile service before the module under test imports it
jest.resetModules();

jest.mock("../../../server/services/profile", () => ({
    getCurrentUserProfile: jest.fn(),
    updateCurrentUserProfile: jest.fn(),
}));

jest.mock("next-auth/next", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
    authOptions: {},
}));

jest.mock("@/server/lib/r2", () => ({
    uploadAvatar: jest.fn(),
    getPublicImageUrl: jest.fn((k: string) => `https://r2.test/${k}`),
}));

import { saveCurrentUserProfile } from "./actions";
import { uploadAvatarAction } from "./actions";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../../../server/services/profile";
import { getServerSession } from "next-auth/next";
import { uploadAvatar } from "@/server/lib/r2";

const mockGet = getCurrentUserProfile as jest.MockedFunction<any>;
const mockUpdate = updateCurrentUserProfile as jest.MockedFunction<any>;

describe("saveCurrentUserProfile server action", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns null when there is no current profile", async () => {
        mockGet.mockResolvedValue(null);

        const profile = {
            name: "Test User",
            email: "new@example.com",
            phone: "",
            nationality: "",
            dateOfBirth: "",
            gender: "",
            passportNumber: "",
            avatarKey: null,
            preferences: { smoking: false, pets: false, notifications: true },
            address: { street: "", city: "", country: "", zip: "" },
        };

        const res = await saveCurrentUserProfile(profile as any);

        expect(res).toBeNull();
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("merges incoming profile and preserves existing email", async () => {
        const existing = { email: "existing@example.com" };
        mockGet.mockResolvedValue(existing);

        const profile = {
            name: "New Name",
            email: "attempt@change.com",
            phone: "",
            nationality: "",
            dateOfBirth: "",
            gender: "",
            passportNumber: "",
            avatarKey: null,
            preferences: { smoking: false, pets: false, notifications: true },
            address: { street: "", city: "", country: "", zip: "" },
        };

        const updated = { ...profile, email: existing.email };
        mockUpdate.mockResolvedValue(updated);

        const res = await saveCurrentUserProfile(profile as any);

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ email: existing.email }));
        expect(res).toEqual(updated);
    });
});

describe("uploadAvatarAction server action", () => {
    beforeEach(() => jest.clearAllMocks());

    it("uploads file, persists avatarKey and returns profile with avatarUrl", async () => {
        const FileCtor = (global as any).File ?? class MockFile {};
        (global as any).File = FileCtor;

        const mockSession = { user: { id: "1" } } as any;
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);

        const returnedKey = "avatars/user_1/avatar.jpg";
        (uploadAvatar as jest.Mock).mockResolvedValue(returnedKey);

        const existingProfile = {
            name: "A",
            email: "a@b.com",
            phone: "",
            nationality: "",
            dateOfBirth: "",
            gender: "",
            passportNumber: "",
            avatarKey: null,
            preferences: { smoking: false, pets: false, notifications: true },
            address: { street: "", city: "", country: "", zip: "" },
        };

        (getCurrentUserProfile as jest.Mock).mockResolvedValue(existingProfile);
        (updateCurrentUserProfile as jest.Mock).mockImplementation(async (p) => p);

        // minimal file-like object (server-side) - uploadAvatar is mocked so contents aren't used
        const fileLike = FileCtor.length >= 2
            ? new FileCtor([new Uint8Array([1])], "avatar.jpg", { type: "image/jpeg" })
            : Object.assign(new FileCtor(), {
                name: "avatar.jpg",
                type: "image/jpeg",
                size: 1024,
            });

        const res = await uploadAvatarAction(fileLike as any);

        expect(uploadAvatar).toHaveBeenCalled();
        expect(updateCurrentUserProfile).toHaveBeenCalledWith(expect.objectContaining({ avatarKey: returnedKey }));
        expect(res).toHaveProperty("avatarUrl", `https://r2.test/${returnedKey}`);
    });
});
