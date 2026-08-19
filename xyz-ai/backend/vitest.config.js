export default {
  test: {
    globals: true,
    environment: 'node',
    roots: ['tests'],
    include: ['**/*.test.js'],
    testTimeout: 30000,  // 30s for LLM-dependent tests
    hookTimeout: 15000,
  },
}