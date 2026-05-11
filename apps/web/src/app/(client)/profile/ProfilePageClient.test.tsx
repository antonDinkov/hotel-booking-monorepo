/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ProfilePageClient from "./ProfilePageClient";

describe("ProfilePageClient", () => {
  const initialProfile = {
    name: "John Doe",
    email: "john@example.com",
    phone: "",
    nationality: "",
    dateOfBirth: "",
    gender: "",
    passportNumber: "",
    avatarUrl: null,
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
});
