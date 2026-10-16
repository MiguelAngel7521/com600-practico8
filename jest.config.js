module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  reporters: ['default'],
  collectCoverageFrom: ['src/*.js', '!src/server.js'],
  coverageDirectory: process.env.COVERAGE_DIR || 'coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 }
  }
};
