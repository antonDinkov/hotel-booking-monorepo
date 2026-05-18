/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileAvatar from "./ProfileAvatar";

describe("ProfileAvatar", () => {
  let originalFileReader: any;

  beforeEach(() => {
    originalFileReader = (global as any).FileReader;
    jest.clearAllMocks();
  });

  afterEach(() => {
    (global as any).FileReader = originalFileReader;
  });

  it("shows No Image when no initialSrc and updates preview on file selection", async () => {
    const mockFile = new File(["abc"], "avatar.png", { type: "image/png" });

    class MockFileReader {
      onload: any = null;
      result: any = null;
      readAsDataURL(file: any) {
        void file;
        this.result = "data:image/png;base64,FAKE";
        if (this.onload) this.onload();
      }
    }

    (global as any).FileReader = MockFileReader;

    const onFileChange = jest.fn();
    const { container } = render(<ProfileAvatar onFileChange={onFileChange} />);

    expect(screen.getByText(/No Image/i)).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    // simulate selecting a file
    fireEvent.change(input, { target: { files: [mockFile] } });

    await waitFor(() => expect(screen.getByAltText("Profile")).toHaveAttribute("src", "data:image/png;base64,FAKE"));
    expect(onFileChange).toHaveBeenCalledWith(mockFile);
  });

  it("renders initialSrc image when provided", () => {
    render(<ProfileAvatar initialSrc="https://example.com/avatar.png" />);
    const img = screen.getByAltText("Profile") as HTMLImageElement;
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("calls onFileChange(null) when no file is selected", async () => {
    const onFileChange = jest.fn();
    const { container } = render(<ProfileAvatar onFileChange={onFileChange} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    // simulate no file selected
    fireEvent.change(input, { target: { files: [] } });

    expect(onFileChange).toHaveBeenCalledWith(null);
  });
});
