import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testMatch: [
    '**/src/**/__tests__/**/*.[jt]s?(x)',
    '**/src/**/?(*.)+(spec|test).[jt]s?(x)',
    '**/tests/**/*.[jt]s?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '\\.spec\\.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-syntax-highlighter|refractor|hastscript|hast-util-.*|unist-.*|property-information|space-separated-tokens|comma-separated-tokens|react-markdown|remark-.*|rehype-.*|micromark.*|mdast-.*|ccount|decode-named-character-reference|character-entities|escape-string-regexp|markdown-table|vfile.*)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
