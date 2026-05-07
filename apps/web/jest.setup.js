const React = require("react");

require("@testing-library/jest-dom");

jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, fill, priority, ...props }) =>
		React.createElement("img", {
			src: typeof src === "string" ? src : src?.src ?? "",
			alt,
			...props,
		}),
}));

jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ href, children, prefetch, ...props }) =>
		React.createElement(
			"a",
			{
				href: typeof href === "string" ? href : href?.pathname ?? "",
				...props,
			},
			children
		),
}));