module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/prisma.js'],
};
