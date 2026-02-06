export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@controllers$': '<rootDir>/src/controllers/index.ts',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@db$': '<rootDir>/src/db/index.ts',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@middleware$': '<rootDir>/src/middleware/index.ts',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@repositories$': '<rootDir>/src/repositories/index.ts',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@routes$': '<rootDir>/src/routes/index.ts',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@types$': '<rootDir>/src/types/index.ts',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils$': '<rootDir>/src/utils/index.ts',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@validators$': '<rootDir>/src/validators/index.ts',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@config$': '<rootDir>/src/config/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
        diagnostics: {
          ignoreCodes: ['TS151002'],
        },
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    // Repository coverage thresholds - gradually increase as more tests are added
    'src/repositories/**/*.ts': {
      branches: 15,
      functions: 25,
      lines: 20,
      statements: 20,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}
