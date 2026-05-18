const React = require("react");
const { TextEncoder, TextDecoder } = require("util");

require("@testing-library/jest-dom");

// Polyfill TextDecoder and TextEncoder for jsdom environment
// Required by @neondatabase/serverless
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost/test";

// Mock @neondatabase/serverless FIRST - prevents db/index.ts initialization errors
jest.mock("@neondatabase/serverless", () => ({
	neon: jest.fn(() => {
		// Return a mock SQL client with required methods
		const mockSql = jest.fn().mockResolvedValue({ rows: [] });
		mockSql.setTypeParser = jest.fn();
		mockSql.end = jest.fn();
		return mockSql;
	}),
}));

// Clear the db module from cache after mocking the dependency
// This allows the mocked @neondatabase/serverless to be used when db/index.ts loads
jest.resetModules();

jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, ...props }) => {
		delete props.fill;
		delete props.priority;
		return React.createElement("img", {
			src: typeof src === "string" ? src : src?.src ?? "",
			alt,
			...props,
		});
	},
}));

jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ href, children, ...props }) => {
		delete props.prefetch;
		return React.createElement(
			"a",
			{
				href: typeof href === "string" ? href : href?.pathname ?? "",
				...props,
			},
			children
		);
	},
}));
