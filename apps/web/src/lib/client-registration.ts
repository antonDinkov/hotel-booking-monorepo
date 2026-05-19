import { z } from "zod";

import type { ClientRegistrationInput } from "@repo/types";

export const clientRegistrationSchema = z.object({
	fullName: z.string()
		.trim()
		.min(1, "Full name is required.")
		.max(120, "Full name is too long."),
	email: z.string()
		.trim()
		.email("Enter a valid email address.")
		.transform((value) => value.toLowerCase()),
	password: z.string()
		.min(6, "Password must be at least 6 characters long.")
		.max(128, "Password is too long."),
	confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((value) => value.password === value.confirmPassword, {
	message: "Passwords do not match.",
	path: ["confirmPassword"],
}) satisfies z.ZodType<ClientRegistrationInput>;

export function getClientRegistrationErrorMessage(error: z.ZodError): string {
	return error.issues[0]?.message ?? "Check the registration fields and try again.";
}
