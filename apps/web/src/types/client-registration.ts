export type ClientRegistrationInput = {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export type ClientRegistrationResult = {
	userId: string;
	email: string;
	fullName: string;
	roles: string[];
	redirectTo: string;
};
