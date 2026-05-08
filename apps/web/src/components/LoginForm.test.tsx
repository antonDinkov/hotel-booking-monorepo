/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { signIn } from "next-auth/react";
const routerPushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));
import LoginForm from "./LoginForm";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    routerPushMock.mockClear();
  });

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

  it("redirects to returned url when credentials are valid", async () => {
    const signInMock = signIn as jest.Mock;
    signInMock.mockResolvedValue({ url: "/dashboard" });

    // assignMock installed in beforeEach

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@company.com"), {
      target: { value: "guest@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "good-pass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    // navigation handled via next/navigation router push; assert router was asked to navigate
    expect(routerPushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows Logging in... and disables submit while signIn is pending", async () => {
    let resolveSignIn: (value?: any) => void;
    const signInMock = signIn as jest.Mock;
    signInMock.mockImplementation(
      () => new Promise((res) => {
        resolveSignIn = res;
      })
    );

    // assignMock installed in beforeEach

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("you@company.com"), {
      target: { value: "guest@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "good-pass" },
    });

    // click submit and assert intermediate state
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Login" }));
    });

    const submit = screen.getByRole("button", { name: "Logging in..." });
    expect(submit).toBeDisabled();

    // finish signIn and assert router push called
    await act(async () => {
      // @ts-ignore
      resolveSignIn({ url: "/dashboard" });
    });

    expect(routerPushMock).toHaveBeenCalledWith("/dashboard");
  });
});
