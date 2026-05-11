/**
 * @jest-environment node
 */

// Ensure we can mock the profile service before the module under test imports it
jest.resetModules();

jest.mock("../../../server/services/profile", () => ({
    getCurrentUserProfile: jest.fn(),
    updateCurrentUserProfile: jest.fn(),
}));

import { saveCurrentUserProfile } from "./actions";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../../../server/services/profile";

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
            avatarUrl: null,
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
            avatarUrl: null,
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
