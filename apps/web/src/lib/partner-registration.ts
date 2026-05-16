import { z } from "zod";

import type { PartnerRegistrationInput } from "@/types/partner-registration";

const requiredText = (field: string, maxLength = 120) =>
	z.string()
		.trim()
		.min(1, `${field} is required.`)
		.max(maxLength, `${field} is too long.`);

const optionalText = (maxLength = 160) =>
	z.string()
		.trim()
		.max(maxLength, "This field is too long.")
		.optional()
		.transform((value) => value || null);

export const partnerRegistrationSchema = z.object({
	companyName: requiredText("Company name"),
	representativeFirstName: requiredText("Representative first name", 80),
	representativeLastName: requiredText("Representative last name", 80),
	position: requiredText("Position", 100),
	email: z.string()
		.trim()
		.email("Enter a valid email address.")
		.transform((value) => value.toLowerCase()),
	password: z.string()
		.min(6, "Password must be at least 6 characters long.")
		.max(128, "Password is too long."),
	repeatPassword: z.string().min(1, "Repeat password is required."),
	phone: optionalText(40),
	website: z.string()
		.trim()
		.url("Enter a valid website URL.")
		.optional()
		.or(z.literal(""))
		.transform((value) => value || null),
	companyAddress: optionalText(240),
	vatNumber: optionalText(60),
}).refine((value) => value.password === value.repeatPassword, {
	message: "Passwords do not match.",
	path: ["repeatPassword"],
}) satisfies z.ZodType<PartnerRegistrationInput>;

export function getPartnerRegistrationErrorMessage(error: z.ZodError): string {
	return error.issues[0]?.message ?? "Check the registration fields and try again.";
}
