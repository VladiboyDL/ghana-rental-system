const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter, sanitizeRequest } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS whitelist configuration
const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8081',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check whitelist
    if (corsWhitelist.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Check for render.com and onrender.com domains
    if (/\.onrender\.com$/.test(origin) || /\.render\.com$/.test(origin)) {
      return callback(null, true);
    }

    // Log rejected origin for debugging
    console.log('CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Security middleware - helmet first
app.use(helmet());

// CORS with whitelist
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request sanitization
app.use(sanitizeRequest);

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Static files (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply stricter rate limiter to auth routes
app.use('/api/auth', authLimiter);

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
