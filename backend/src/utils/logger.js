/**
 * Simple Logger Utility for Ghana Rental Market API
 * Provides structured logging with timestamps and levels
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

const formatTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = formatTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const shouldLog = (level) => {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
};

const logger = {
  error: (message, meta = {}) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },

  warn: (message, meta = {}) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },

  debug: (message, meta = {}) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  },

  // Log HTTP requests
  request: (req, meta = {}) => {
    if (shouldLog('info')) {
      const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id,
        ...meta
      };
      console.log(formatMessage('info', `${req.method} ${req.originalUrl}`, logData));
    }
  },

  // Log errors with stack trace
  errorWithStack: (message, error, meta = {}) => {
    if (shouldLog('error')) {
      const errorMeta = {
        ...meta,
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack
      };
      console.error(formatMessage('error', message, errorMeta));
    }
  },

  // Log database queries (debug level)
  query: (sql, params = [], duration = null) => {
    if (shouldLog('debug')) {
      const meta = {
        sql: sql.substring(0, 200),
        paramCount: params.length,
        ...(duration && { durationMs: duration })
      };
      console.log(formatMessage('debug', 'DB Query', meta));
    }
  }
};

module.exports = logger;
