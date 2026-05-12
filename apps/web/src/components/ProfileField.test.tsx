/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileField from "./ProfileField";

describe("ProfileField", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onSave with updated value when Save clicked", () => {
    const onSave = jest.fn();

    render(
      <ProfileField
        label="Name"
        value="John Doe"
        inputType="text"
        placeholder="Full name"
        onSave={onSave}
      />
    );

    const changeBtn = screen.getByRole("button", { name: /Change/i });
    fireEvent.click(changeBtn);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane Doe" } });

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(onSave).toHaveBeenCalledWith("Jane Doe");
    expect(screen.queryByRole("button", { name: /Save/i })).not.toBeInTheDocument();
  });

  it("calls onCancel when Cancel clicked", () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();

    render(
      <ProfileField
        label="Phone"
        value="123"
        inputType="text"
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Change/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "456" } });
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onCancel).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Save/i })).not.toBeInTheDocument();
  });

  it("shows saved message when saved prop true", () => {
    const onSave = jest.fn();
    render(
      <ProfileField
        label="City"
        value="Toronto"
        inputType="text"
        onSave={onSave}
        saved={true}
      />
    );

    expect(screen.getByText(/Your data has been saved/i)).toBeInTheDocument();
  });

  it("shows 'Not set' for empty value and disables change when isEditable is false", () => {
    const onSave = jest.fn();
    render(
      <ProfileField
        label="Bio"
        value=""
        inputType="text"
        onSave={onSave}
        isEditable={false}
      />
    );

    expect(screen.getByText("Not set")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Change/i }) as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it("treats whitespace-only value as 'Not set' and clicking disabled Change does nothing", () => {
    const onSave = jest.fn();
    render(
      <ProfileField
        label="Bio"
        value="   "
        inputType="text"
        onSave={onSave}
        isEditable={false}
      />
    );

    expect(screen.getByText("Not set")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Change/i });
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    // Should not enter edit mode
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("Change button uses enabled class when editable and disabled class when not", () => {
    const onSave = jest.fn();

    // editable (default)
    const { rerender } = render(
      <ProfileField label="City" value="X" inputType="text" onSave={onSave} />
    );
    let btn = screen.getByRole("button", { name: /Change/i });
    expect(btn.className).toEqual(expect.stringContaining("text-blue-600"));

    // not editable
    rerender(<ProfileField label="City" value="X" inputType="text" onSave={onSave} isEditable={false} />);
    btn = screen.getByRole("button", { name: /Change/i });
    expect(btn.className).toEqual(expect.stringContaining("cursor-not-allowed"));
  });

  it("allows selecting and saving a select input", () => {
    const onSave = jest.fn();

    render(
      <ProfileField
        label="Gender"
        value="Female"
        inputType="select"
        options={["Female", "Male"]}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Change/i }));
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Male" } });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(onSave).toHaveBeenCalledWith("Male");
  });
});
