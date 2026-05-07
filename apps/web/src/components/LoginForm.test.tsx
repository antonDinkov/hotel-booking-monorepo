/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { signIn } from "next-auth/react";
import LoginForm from "./LoginForm";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows an error message when credentials are invalid", async () => {
    const signInMock = signIn as jest.Mock;
    signInMock.mockResolvedValue({ error: "Invalid" });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@company.com"), {
      target: { value: "guest@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "bad-pass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "guest@example.com",
      password: "bad-pass",
      redirect: false,
      callbackUrl: "/dashboard",
    });

    expect(
      await screen.findByText("Invalid email or password.")
    ).toBeInTheDocument();
  });

  it("starts GitHub sign-in when the button is clicked", () => {
    const signInMock = signIn as jest.Mock;
    signInMock.mockResolvedValue({});

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "GitHub" }));

    expect(signInMock).toHaveBeenCalledWith("github", {
      callbackUrl: "/dashboard",
    });
  });
});
