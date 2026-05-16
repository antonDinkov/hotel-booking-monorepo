export type PartnerRegistrationInput = {
	companyName: string;
	representativeFirstName: string;
	representativeLastName: string;
	position: string;
	email: string;
	password: string;
	repeatPassword: string;
	phone: string | null;
	website: string | null;
	companyAddress: string | null;
	vatNumber: string | null;
};

export type PartnerRegistrationResult = {
	userId: string;
	partnerId: string;
	email: string;
	redirectTo: string;
};
