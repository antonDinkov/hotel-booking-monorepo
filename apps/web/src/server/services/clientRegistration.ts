import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roles, userProfiles, userRoles, users } from "@/db/schema";
import type {
	ClientRegistrationInput,
	ClientRegistrationResult,
} from "@/types/client-registration";

const CLIENT_DASHBOARD_PATH = "/dashboard";

export class ClientRegistrationError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly status = 400
	) {
		super(message);
		this.name = "ClientRegistrationError";
	}
}

async function getClientRoleId(): Promise<number> {
	const role = await db
		.select({ id: roles.id })
		.from(roles)
		.where(eq(roles.name, "client"))
		.then((rows) => rows[0]);

	if (!role) {
		throw new ClientRegistrationError(
			"CLIENT_ROLE_MISSING",
			"Client registration is not configured yet.",
			500
		);
	}

	return role.id;
}

async function assertEmailIsAvailable(email: string): Promise<void> {
	const existingUser = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.then((rows) => rows[0]);

	if (existingUser) {
		throw new ClientRegistrationError(
			"EMAIL_ALREADY_EXISTS",
			"An account with this email already exists."
		);
	}
}

function getPasswordHash(password: string): Promise<string> {
	return bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS ?? 10));
}

export async function registerClient(
	input: ClientRegistrationInput
): Promise<ClientRegistrationResult> {
	await assertEmailIsAvailable(input.email);

	const [clientRoleId, passwordHash] = await Promise.all([
		getClientRoleId(),
		getPasswordHash(input.password),
	]);

	return db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({ email: input.email, passwordHash, isActive: true })
			.returning({ id: users.id, email: users.email });

		await tx.insert(userRoles).values({ userId: user.id, roleId: clientRoleId });
		await tx.insert(userProfiles).values({
			userId: user.id,
			fullName: input.fullName,
		});

		return {
			userId: user.id,
			email: user.email,
			fullName: input.fullName,
			roles: ["client"],
			redirectTo: CLIENT_DASHBOARD_PATH,
		};
	});
}
