/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import RegisterForm from "./RegisterForm";

jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

/* jest.mock("./AppButton", () => ({
    AppButton: ({ children, type, variant, size, className }: any) => (
        <button type={type} className={className}>
            {children}
        </button>
    ),
})); */

jest.mock("./AppButton", () => ({
    AppButton: ({ children, type, className }: any) => (
        <button type={type} className={className}>
            {children}
        </button>
    ),
}));

describe("RegisterForm", () => {
    it("renders the registration form with all fields", () => {
        render(<RegisterForm />);

        expect(screen.getByText("Create your account")).toBeInTheDocument();
        expect(screen.getByText("Register with your email and password.")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@company.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Repeat password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByText("Already have an account?")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders the back to home button", () => {
        render(<RegisterForm />);

        expect(screen.getByRole("button", { name: /back to home/i })).toBeInTheDocument();
    });

    it("renders the sign in link with correct href", () => {
        render(<RegisterForm />);

        const signInLink = screen.getByRole("link", { name: /sign in/i });
        expect(signInLink).toHaveAttribute("href", "/login");
    });

    it("renders the back to home link with correct href", () => {
        render(<RegisterForm />);

        const backLink = screen.getByRole("link", { name: /back to home/i });
        expect(backLink).toHaveAttribute("href", "/");
    });


    it("renders inputs with correct types", () => {
        render(<RegisterForm />);

        expect(screen.getByPlaceholderText("you@company.com"))
            .toHaveAttribute("type", "email");

        expect(screen.getAllByPlaceholderText(/password/i)).toHaveLength(2);
    });

    it("handles form submit event", () => {
        render(<RegisterForm />);

        const form = document.querySelector("form");

        expect(form).toBeInTheDocument();

        fireEvent.submit(form!);
    });
});