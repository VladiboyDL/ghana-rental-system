/**
 * Custom Error Classes for Ghana Rental Market API
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(this.field && { field: this.field })
    };
  }
}

class ValidationError extends AppError {
  constructor(message, details = null, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
    this.field = field;
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', resource = null, id = null) {
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
    this.resourceId = id;
    this.name = 'NotFoundError';
    if (resource && id) {
      this.message = resource + " with ID '" + id + "' not found";
    } else if (resource) {
      this.message = resource + ' not found';
    }
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'UnauthorizedError';
  }

  static invalidToken(message = 'Invalid token') {
    return new UnauthorizedError(message, 'INVALID_TOKEN');
  }

  static tokenExpired(message = 'Token has expired') {
    return new UnauthorizedError(message, 'TOKEN_EXPIRED');
  }

  static missingToken(message = 'No authentication token provided') {
    return new UnauthorizedError(message, 'MISSING_TOKEN');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied', requiredRole = null) {
    super(message, 403, 'FORBIDDEN');
    this.requiredRole = requiredRole;
    this.name = 'ForbiddenError';
    if (requiredRole) {
      this.message = 'Access denied. Required role: ' + requiredRole;
    }
  }

  static insufficientPermissions(action = null) {
    const message = action
      ? 'You do not have permission to ' + action
      : 'Insufficient permissions to perform this action';
    return new ForbiddenError(message);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', field = null, value = null) {
    super(message, 409, 'CONFLICT');
    this.field = field;
    this.conflictValue = value;
    this.name = 'ConflictError';
    if (field && value) {
      this.message = "A resource with " + field + " '" + value + "' already exists";
    } else if (field) {
      this.message = 'A resource with this ' + field + ' already exists';
    }
  }

  static duplicate(field, value = null) {
    return new ConflictError('Duplicate ' + field, field, value);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code);
    this.name = 'BadRequestError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', service = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.service = service;
    this.name = 'ServiceUnavailableError';
    if (service) {
      this.message = service + ' service is temporarily unavailable';
    }
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error', originalError = null) {
    super(message, 500, 'DATABASE_ERROR', true);
    this.originalError = originalError;
    this.name = 'DatabaseError';
  }

  static constraintViolation(constraint = null) {
    const message = constraint
      ? 'Database constraint violation: ' + constraint
      : 'Database constraint violation';
    return new DatabaseError(message);
  }
}

const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

const createErrorFromStatus = (statusCode, message) => {
  switch (statusCode) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 429:
      return new RateLimitError(message);
    case 503:
      return new ServiceUnavailableError(message);
    default:
      return new AppError(message, statusCode);
  }
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  ServiceUnavailableError,
  RateLimitError,
  DatabaseError,
  isOperationalError,
  createErrorFromStatus
};
