/**
 * @jest-environment node
 */

// keep module mocks isolated
jest.resetModules();

const mockProfile = {
    name: "John Doe",
    email: "john@example.com",
    phone: "",
    nationality: "",
    dateOfBirth: "",
    gender: "",
    passportNumber: "",
    avatarKey: null,
    preferences: { smoking: false, pets: false, notifications: true },
    address: { street: "", city: "", country: "", zip: "" },
};

jest.mock("next/navigation", () => ({
    redirect: jest.fn(),
}));

jest.mock("../../../server/services/profile", () => ({
    getCurrentUserProfile: jest.fn(),
}));

jest.mock("../../../server/services/auth", () => ({
    getUserRoles: jest.fn(),
}));

jest.mock("next-auth/next", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
    authOptions: {},
}));

jest.mock("./actions", () => ({
    saveCurrentUserProfile: jest.fn(),
}));

jest.mock("./ProfilePageClient", () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

const { getCurrentUserProfile } = require("../../../server/services/profile");
const { getUserRoles } = require("../../../server/services/auth");
const { getServerSession } = require("next-auth/next");
const { redirect } = require("next/navigation");

const ProfilePage = require("./page").default;

describe("ProfilePage server component", () => {
    beforeEach(() => jest.clearAllMocks());

    it("passes fetched profile to ProfilePageClient", async () => {
        getServerSession.mockResolvedValue(null);
        getUserRoles.mockResolvedValue([]);
        getCurrentUserProfile.mockResolvedValue(mockProfile);

        const result = await ProfilePage();

        expect(result).toBeDefined();
        // result is a React element - props should include initialProfile
        expect(result.props).toBeDefined();
        expect(result.props.initialProfile).toEqual(mockProfile);
        expect(typeof result.props.onSaveProfile).toBe("function");
    });

    it("calls redirect when profile is missing", async () => {
        (redirect as jest.Mock).mockImplementation(() => { throw new Error("redirect"); });
        getServerSession.mockResolvedValue(null);
        getUserRoles.mockResolvedValue([]);
        getCurrentUserProfile.mockResolvedValue(null);

        await expect(ProfilePage()).rejects.toThrow("redirect");
        expect((redirect as jest.Mock).mock.calls[0][0]).toBe("/login");
    });
});
