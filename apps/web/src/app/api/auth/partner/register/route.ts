import { NextResponse } from "next/server";

import {
	getPartnerRegistrationErrorMessage,
	partnerRegistrationSchema,
} from "@/lib/partner-registration";
import {
	PartnerRegistrationError,
	registerPartner,
} from "@/server/services/partners";

function errorResponse(message: string, code: string, status: number) {
	return NextResponse.json({ error: { message, code } }, { status });
}

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = partnerRegistrationSchema.safeParse(body);

	if (!parsed.success) {
		return errorResponse(
			getPartnerRegistrationErrorMessage(parsed.error),
			"VALIDATION_ERROR",
			400
		);
	}

	try {
		const result = await registerPartner(parsed.data);
		return NextResponse.json({ data: result }, { status: 201 });
	} catch (error) {
		if (error instanceof PartnerRegistrationError) {
			return errorResponse(error.message, error.code, error.status);
		}

		console.error("[partner-register] failed", error);
		return errorResponse(
			"Partner registration failed. Please try again or contact support.",
			"PARTNER_REGISTRATION_FAILED",
			500
		);
	}
}
