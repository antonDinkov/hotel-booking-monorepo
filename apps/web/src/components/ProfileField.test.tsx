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
