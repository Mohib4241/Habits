import type { Config } from 'jest';

const config: Config = {
    // ── Runner ───────────────────────────────────────────────────────────────
    preset:          'ts-jest',
    testEnvironment: 'node',

    // ── File discovery ────────────────────────────────────────────────────────
    roots:     ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],

    // ── TypeScript transform ──────────────────────────────────────────────────
    // Override tsconfig so ts-jest does NOT enforce rootDir=src.
    // This allows test files in tests/ to import from src/ freely.
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                strict:            false,
                esModuleInterop:   true,
                module:            'commonjs',
                target:            'ES2022',
                resolveJsonModule: true,
                skipLibCheck:      true,
                // NO rootDir override — defaults to project root so both
                // tests/ and src/ are resolvable via relative imports
            },
        }],
    },

    // ── Module aliases ────────────────────────────────────────────────────────
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },

    // ── Setup — env vars loaded before any test file ──────────────────────────
    setupFiles: ['<rootDir>/tests/src/setup/testEnv.ts'],

    // ── Coverage ──────────────────────────────────────────────────────────────
    collectCoverage: true,
    collectCoverageFrom: [
        'src/controllers/**/*.ts',
        'src/services/**/*.ts',
    ],
    coverageDirectory:  'coverage',
    coverageReporters:  ['text', 'text-summary', 'lcov', 'html', 'json'],
    coverageThreshold: {
        global: {
            lines:      70,
            functions:  70,
            branches:   60,
            statements: 70,
        },
    },

    // ── Output ────────────────────────────────────────────────────────────────
    verbose:     true,
    testTimeout: 15000,
};

export default config;
