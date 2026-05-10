const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    },
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    transformIgnorePatterns: [
        'node_modules/(?!(jose|openid-client)/)',
    ],
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
    ],

    coveragePathIgnorePatterns: [
        "/node_modules/",

        "src/index.ts",
        "src/proxy.ts",

        "src/db/schema.ts",
        "src/db/seed.ts",
        "src/db/index.ts",

        "src/types/",

        "src/app/.*/layout.tsx",
        "src/app/admin/",
        "src/app/\\(partner\\)/",

        "src/components/Partner",

        "src/app/layout.tsx",
        "src/app/providers.tsx",
        "src/app/not-found.tsx",
    ],
};

module.exports = createJestConfig(customJestConfig);