const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Ghana Rental Market Taxation System API',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/health',
      demo: true
    }
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Ghana Rental Market Taxation System - Backend API        ║
║                                                            ║
║   Server running on: http://localhost:${PORT}                 ║
║   API Base URL: http://localhost:${PORT}/api                  ║
║   Health Check: http://localhost:${PORT}/api/health           ║
║                                                            ║
║   Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}                                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
