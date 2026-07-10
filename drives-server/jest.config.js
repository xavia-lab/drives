module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    // Change the simple '@swc/jest' string into a configuration array
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true, // Enables decorators syntax
          },
          transform: {
            legacyDecorator: true, // Required for NestJS/Angular style decorators
            decoratorMetadata: true, // Required for NestJS dependency injection
          },
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
