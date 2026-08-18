// Test setup for XYZ AI School Assistant
const { initializeDatabase } = require('../db/init');

// Initialize test database
beforeAll(() => {
  initializeDatabase();
});

module.exports = {};