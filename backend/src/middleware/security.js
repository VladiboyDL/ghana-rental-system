/**
 * Security middleware - Rate limiting and request sanitization
 * DEMO MODE: Lenient limits for testing
 */

// Simple in-memory rate limiter
const createRateLimiter = (options = {}) => {
  const { windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests' } = options;
  const requests = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests) {
      if (now - data.startTime > windowMs) requests.delete(key);
    }
  }, 60000);

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    const data = requests.get(key);
    if (now - data.startTime > windowMs) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    data.count++;
    if (data.count > max) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT', message } });
    }
    next();
  };
};

const generalLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }); // 200 req/15min
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }); // 20 req/15min

const sanitizeRequest = (req, res, next) => {
  // Trim strings in body
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};

module.exports = { generalLimiter, authLimiter, sanitizeRequest, createRateLimiter };
