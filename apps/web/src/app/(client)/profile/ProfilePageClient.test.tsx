/**
 * @jest-environment jsdom
 */
// Ensure auth modules are mocked to prevent pulling server-side ESM deps
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
  default: { getServerSession: jest.fn() },
}));
// Also mock server lib r2 to avoid any runtime calls if imported indirectly
jest.mock("@/server/lib/r2", () => ({
  getPublicImageUrl: jest.fn((k: string) => `https://r2.test/${k}`),
}));
// Mock server actions to avoid importing server-side modules in this client test
jest.mock("./actions", () => ({
  saveCurrentUserProfile: jest.fn(),
  uploadAvatarAction: jest.fn(),
}));
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ProfilePageClient, { getFieldValue, setFieldValue } from "./ProfilePageClient";
import { act } from "react";

describe("ProfilePageClient", () => {
  const initialProfile = {
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

  let originalResizeObserver: any;

  beforeAll(() => {
    originalResizeObserver = (global as any).ResizeObserver;
    (global as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  afterAll(() => {
    (global as any).ResizeObserver = originalResizeObserver;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("edits name and calls onSaveProfile, showing saved indicator", async () => {
    const onSaveProfile = jest.fn().mockImplementation(async (p) => p);

    render(<ProfilePageClient initialProfile={initialProfile} onSaveProfile={onSaveProfile} />);

    const nameLabel = screen.getByText("Name");
    const fieldRoot = nameLabel.parentElement?.parentElement?.parentElement as HTMLElement;
    const changeBtn = within(fieldRoot).getByRole("button", { name: /Change/i });
    fireEvent.click(changeBtn);

    const input = within(fieldRoot).getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane Doe" } });
    fireEvent.click(within(fieldRoot).getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onSaveProfile).toHaveBeenCalled());
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ name: "Jane Doe" }));

    await waitFor(() => expect(within(fieldRoot).getByText(/Your data has been saved/i)).toBeInTheDocument());
  });

  it("does not allow editing email field (change button disabled)", () => {
    render(<ProfilePageClient initialProfile={initialProfile} />);
    const emailLabel = screen.getByText("Email");
    const emailRoot = emailLabel.parentElement?.parentElement?.parentElement as HTMLElement;
    const changeBtn = within(emailRoot).getByRole("button", { name: /Change/i });
    expect(changeBtn).toBeDisabled();
    expect(changeBtn).toHaveAttribute("aria-disabled", "true");
  });

  it("saves address street and clears saved indicator after timeout", async () => {
    jest.useFakeTimers();
    const onSaveProfile = jest.fn().mockImplementation(async (p) => p);

    render(<ProfilePageClient initialProfile={initialProfile} onSaveProfile={onSaveProfile} />);

    const streetLabel = screen.getByText("Street");
    const fieldRoot = streetLabel.parentElement?.parentElement?.parentElement as HTMLElement;
    const changeBtn = within(fieldRoot).getByRole("button", { name: /Change/i });
    fireEvent.click(changeBtn);

    const input = within(fieldRoot).getByRole("textbox");
    fireEvent.change(input, { target: { value: "123 Main St" } });
    fireEvent.click(within(fieldRoot).getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onSaveProfile).toHaveBeenCalled());
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ address: expect.objectContaining({ street: "123 Main St" }) }));

    await waitFor(() => expect(within(fieldRoot).getByText(/Your data has been saved/i)).toBeInTheDocument());

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(within(fieldRoot).queryByText(/Your data has been saved/i)).not.toBeInTheDocument());

    jest.useRealTimers();
  });

  it("getFieldValue/setFieldValue defaults with unknown field", () => {
    expect(getFieldValue(initialProfile as any, 'unknown' as any)).toBe("");
    expect(setFieldValue(initialProfile as any, 'unknown' as any, 'x')).toEqual(initialProfile);
  });

  it("sets avatar width based on header offsetWidth (clamped)", async () => {
    render(<ProfilePageClient initialProfile={initialProfile} />);

    const header = screen.getByText("My Profile") as HTMLElement;
    // simulate a very large header width so clamp to max (120)
    Object.defineProperty(header, "offsetWidth", { configurable: true, value: 300 });

    // trigger the resize handler
    await act(async () => { window.dispatchEvent(new Event("resize")); });

    const noImage = await screen.findByText("No Image");
    const avatarOuter = noImage.closest(".overflow-hidden") as HTMLElement;
    await waitFor(() => expect(avatarOuter.style.width).toBe("120px"));
    expect(avatarOuter.style.height).toBe("120px");
  });

  it("persistProfile early-return when no onSaveProfile (no errors)", async () => {
    jest.useFakeTimers();

    render(<ProfilePageClient initialProfile={initialProfile} />);

    const phoneLabel = screen.getByText("Phone");
    const fieldRoot = phoneLabel.parentElement?.parentElement?.parentElement as HTMLElement;
    const changeBtn = within(fieldRoot).getByRole("button", { name: /Change/i });
    fireEvent.click(changeBtn);

    const input = within(fieldRoot).getByRole("textbox");
    fireEvent.change(input, { target: { value: "+1 800 000 0000" } });
    fireEvent.click(within(fieldRoot).getByRole("button", { name: /Save/i }));

    // Saved indicator should appear even when no onSaveProfile provided
    await waitFor(() => expect(within(fieldRoot).getByText(/Your data has been saved/i)).toBeInTheDocument());

    // Advance timers to clear saved state
    await act(async () => { jest.advanceTimersByTime(3000); });
    await waitFor(() => expect(within(fieldRoot).queryByText(/Your data has been saved/i)).not.toBeInTheDocument());

    jest.useRealTimers();
  });
});
