import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { partners, roles, userProfiles, userRoles, users } from "@/db/schema";
import type {
	PartnerRegistrationInput,
	PartnerRegistrationResult,
} from "@/types/partner-registration";

const PARTNER_DASHBOARD_PATH = "/partner/dashboard";

export class PartnerRegistrationError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly status = 400
	) {
		super(message);
		this.name = "PartnerRegistrationError";
	}
}

async function getRoleIdByName(name: string): Promise<number> {
	const role = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.name, name))
		.then((rows) => rows[0]);

	if (!role) {
		throw new PartnerRegistrationError(
			"PARTNER_ROLE_MISSING",
			"Partner registration is not configured yet.",
			500
		);
	}

	return role.id;
}

async function assertRegistrationIsUnique(input: PartnerRegistrationInput): Promise<void> {
	const existingUser = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, input.email))
		.then((rows) => rows[0]);

	if (existingUser) {
		throw new PartnerRegistrationError(
			"EMAIL_ALREADY_EXISTS",
			"An account with this email already exists."
		);
	}

	if (!input.vatNumber) return;

	const existingVat = await db
		.select({ id: partners.id })
		.from(partners)
		.where(eq(partners.vatNumber, input.vatNumber))
		.then((rows) => rows[0]);

	if (existingVat) {
		throw new PartnerRegistrationError(
			"VAT_NUMBER_ALREADY_EXISTS",
			"A partner with this VAT/tax number already exists."
		);
	}
}

function getRepresentativeFullName(input: PartnerRegistrationInput): string {
	return `${input.representativeFirstName} ${input.representativeLastName}`.trim();
}

export async function registerPartner(
	input: PartnerRegistrationInput
): Promise<PartnerRegistrationResult> {
	await assertRegistrationIsUnique(input);

	const partnerRoleId = await getRoleIdByName("partner");
	const passwordHash = await bcrypt.hash(
		input.password,
		Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)
	);

	return db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({ email: input.email, passwordHash, isActive: true })
			.returning({ id: users.id, email: users.email });

		const [partner] = await tx
			.insert(partners)
			.values({
				userId: user.id,
				companyName: input.companyName,
				representativeFirstName: input.representativeFirstName,
				representativeLastName: input.representativeLastName,
				position: input.position,
				email: input.email,
				phone: input.phone,
				website: input.website,
				companyAddress: input.companyAddress,
				vatNumber: input.vatNumber,
			})
			.returning({ id: partners.id });

		await tx.insert(userRoles).values({ userId: user.id, roleId: partnerRoleId });
		await tx.insert(userProfiles).values({
			userId: user.id,
			fullName: getRepresentativeFullName(input),
			phone: input.phone,
		});

		return {
			userId: user.id,
			partnerId: partner.id,
			email: user.email,
			redirectTo: PARTNER_DASHBOARD_PATH,
		};
	});
}
