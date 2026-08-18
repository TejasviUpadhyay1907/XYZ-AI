const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initializeDatabase } = require('./db/init');
const { authenticateToken, requireRole } = require('./src/middleware/auth');

dotenv.config();
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Import routes
const apiRoutes = require('./src/routes/api');
const authRoutes = require('./src/routes/auth');

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Auth routes (unprotected)
app.use('/api/auth', authRoutes);

// Authenticated API routes
app.use('/api', authenticateToken, apiRoutes);

// Handle 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).send('Not found');
});

// For any other route, serve the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Only listen if this file is run directly (not when required as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;