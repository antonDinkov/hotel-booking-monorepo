import { NextResponse } from "next/server";

import { apiError } from "@/app/api/api-response";
import {
	clientRegistrationSchema,
	getClientRegistrationErrorMessage,
} from "@/lib/client-registration";
import {
	ClientRegistrationError,
	registerClient,
} from "@/server/services/clientRegistration";

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = clientRegistrationSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(
			getClientRegistrationErrorMessage(parsed.error),
			"VALIDATION_ERROR",
			400
		);
	}

	try {
		const result = await registerClient(parsed.data);
		return NextResponse.json({ data: result }, { status: 201 });
	} catch (error) {
		if (error instanceof ClientRegistrationError) {
			return apiError(error.message, error.code, error.status);
		}

		console.error("[client-register] failed", error);
		return apiError(
			"Client registration failed. Please try again or contact support.",
			"CLIENT_REGISTRATION_FAILED",
			500
		);
	}
}
