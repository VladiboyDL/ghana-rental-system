/**
 * Error Classes Unit Tests
 */

const {
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
} = require('../../utils/errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 418, 'TEAPOT');

      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('TEAPOT');
    });

    it('should have toJSON method', () => {
      const error = new AppError('Test error', 500, 'TEST');
      const json = error.toJSON();

      expect(json.code).toBe('TEST');
      expect(json.message).toBe('Test error');
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status code', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should include details and field', () => {
      const error = new ValidationError('Invalid email', { format: 'invalid' }, 'email');

      expect(error.details).toEqual({ format: 'invalid' });
      expect(error.field).toBe('email');
    });

    it('should include details in toJSON', () => {
      const error = new ValidationError('Invalid', { test: true }, 'field');
      const json = error.toJSON();

      expect(json.details).toEqual({ test: true });
      expect(json.field).toBe('field');
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status code', () => {
      const error = new NotFoundError();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('should format message with resource and id', () => {
      const error = new NotFoundError('Not found', 'User', '123');

      expect(error.message).toBe("User with ID '123' not found");
      expect(error.resource).toBe('User');
      expect(error.resourceId).toBe('123');
    });

    it('should format message with resource only', () => {
      const error = new NotFoundError('Not found', 'Property');

      expect(error.message).toBe('Property not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have 401 status code', () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });

    it('should have static factory methods', () => {
      const tokenError = UnauthorizedError.invalidToken();
      expect(tokenError.code).toBe('INVALID_TOKEN');

      const expiredError = UnauthorizedError.tokenExpired();
      expect(expiredError.code).toBe('TOKEN_EXPIRED');

      const missingError = UnauthorizedError.missingToken();
      expect(missingError.code).toBe('MISSING_TOKEN');
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status code', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should include required role in message', () => {
      const error = new ForbiddenError('Access denied', 'ADMIN');

      expect(error.message).toBe('Access denied. Required role: ADMIN');
      expect(error.requiredRole).toBe('ADMIN');
    });

    it('should have static factory method', () => {
      const error = ForbiddenError.insufficientPermissions('delete users');

      expect(error.message).toBe('You do not have permission to delete users');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new ConflictError();

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should format message with field and value', () => {
      const error = new ConflictError('Conflict', 'email', 'test@test.com');

      expect(error.message).toBe("A resource with email 'test@test.com' already exists");
    });

    it('should have static duplicate method', () => {
      const error = ConflictError.duplicate('username', 'john');

      expect(error.message).toBe("A resource with username 'john' already exists");
      expect(error.field).toBe('username');
      expect(error.conflictValue).toBe('john');
    });
  });

  describe('BadRequestError', () => {
    it('should have 400 status code', () => {
      const error = new BadRequestError('Bad request');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should have 503 status code', () => {
      const error = new ServiceUnavailableError();

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('Service temporarily unavailable');
    });

    it('should format message with service name', () => {
      const error = new ServiceUnavailableError('Unavailable', 'Payment');

      expect(error.message).toBe('Payment service is temporarily unavailable');
      expect(error.service).toBe('Payment');
    });
  });

  describe('RateLimitError', () => {
    it('should have 429 status code', () => {
      const error = new RateLimitError();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.message).toBe('Too many requests');
    });

    it('should store retryAfter value', () => {
      const error = new RateLimitError('Rate limited', 60);

      expect(error.retryAfter).toBe(60);
    });
  });

  describe('DatabaseError', () => {
    it('should have 500 status code', () => {
      const error = new DatabaseError();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.message).toBe('Database error');
    });

    it('should store original error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('DB connection error', originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should create constraint violation error', () => {
      const error = DatabaseError.constraintViolation('unique_email');

      expect(error.message).toBe('Database constraint violation: unique_email');
    });

    it('should create generic constraint violation error', () => {
      const error = DatabaseError.constraintViolation();

      expect(error.message).toBe('Database constraint violation');
    });
  });

  describe('isOperationalError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError('Test');
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return true for subclasses', () => {
      const error = new ValidationError('Test');
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for regular errors', () => {
      const error = new Error('Test');
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-operational AppError', () => {
      const error = new AppError('Test', 500, 'TEST', false);
      expect(isOperationalError(error)).toBe(false);
    });
  });

  describe('createErrorFromStatus', () => {
    it('should create ValidationError for status 400', () => {
      const error = createErrorFromStatus(400, 'Bad input');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Bad input');
    });

    it('should create UnauthorizedError for status 401', () => {
      const error = createErrorFromStatus(401, 'Not authenticated');

      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should create ForbiddenError for status 403', () => {
      const error = createErrorFromStatus(403, 'Access denied');

      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('should create NotFoundError for status 404', () => {
      const error = createErrorFromStatus(404, 'Not found');

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should create ConflictError for status 409', () => {
      const error = createErrorFromStatus(409, 'Conflict');

      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should create RateLimitError for status 429', () => {
      const error = createErrorFromStatus(429, 'Too many requests');

      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should create ServiceUnavailableError for status 503', () => {
      const error = createErrorFromStatus(503, 'Service down');

      expect(error).toBeInstanceOf(ServiceUnavailableError);
    });

    it('should create AppError for unknown status codes', () => {
      const error = createErrorFromStatus(418, "I'm a teapot");

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(418);
    });
  });

  describe('Error toJSON edge cases', () => {
    it('should not include undefined details in toJSON', () => {
      const error = new ValidationError('Test');
      const json = error.toJSON();

      expect(json).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Test'
      });
      expect(json.details).toBeUndefined();
      expect(json.field).toBeUndefined();
    });

    it('should include timestamp in AppError', () => {
      const error = new AppError('Test');

      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });
  });
});
