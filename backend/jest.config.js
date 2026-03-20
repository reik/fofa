module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/utils/migrate.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
