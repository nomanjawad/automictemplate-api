/**
 * Custom API Error Classes
 * Centralized error handling for consistent error responses
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  statusCode: number
  code: string
  details?: any
  isOperational: boolean

  constructor(
    statusCode: number,
    message: string,
    code: string,
    details?: any,
    isOperational = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = isOperational

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 400 - Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message: string, code = 'BAD_REQUEST', details?: any) {
    super(400, message, code, details)
  }
}

/**
 * 401 - Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'User not authenticated', code = 'NOT_AUTHENTICATED', details?: any) {
    super(401, message, code, details)
  }
}

/**
 * 403 - Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden', code = 'FORBIDDEN', details?: any) {
    super(403, message, code, details)
  }
}

/**
 * 404 - Not Found
 */
export class NotFoundError extends ApiError {
  constructor(message: string, code = 'NOT_FOUND', details?: any) {
    super(404, message, code, details)
  }
}

/**
 * 409 - Conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string, code = 'CONFLICT', details?: any) {
    super(409, message, code, details)
  }
}

/**
 * 500 - Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR', details?: any) {
    super(500, message, code, details, false)
  }
}

/**
 * Database Error Handler
 * Converts Supabase/PostgreSQL errors to API errors
 */
export class DatabaseError extends ApiError {
  constructor(error: any, context?: string) {
    const { message, code, details, statusCode } = parseDatabaseError(error)
    super(statusCode, message, code, details, true)
    
    if (context) {
      this.message = `${context}: ${this.message}`
    }
  }
}

/**
 * Parse database errors and return appropriate status codes and messages
 */
export function parseDatabaseError(error: any): { 
  message: string
  code: string
  details: any
  statusCode: number 
} {
  const code = error.code || 'DB_ERROR'
  const details = error.details || null
  let message = error.message || 'Database operation failed'
  let statusCode = 500

  // PostgreSQL error codes
  switch (code) {
    // Unique constraint violation
    case '23505':
      statusCode = 409
      message = 'A record with this value already exists'
      if (error.message?.includes('slug')) {
        message = 'A page with this slug already exists'
      }
      if (error.message?.includes('email')) {
        message = 'This email is already registered'
      }
      break

    // Foreign key constraint violation
    case '23503':
      statusCode = 400
      message = 'Referenced record does not exist'
      break

    // Check constraint violation
    case '23514':
      statusCode = 400
      message = 'Invalid data: constraint violation'
      break

    // Invalid input syntax
    case '22P02':
      statusCode = 400
      message = 'Invalid input format'
      break

    // Not null violation
    case '23502':
      statusCode = 400
      message = 'Required field is missing'
      break

    // Postgrest/Supabase errors
    case 'PGRST116':
      statusCode = 404
      message = 'Record not found'
      break

    case 'PGRST301':
      statusCode = 400
      message = 'Invalid query parameters'
      break

    // RLS policy violation
    case '42501':
      statusCode = 403
      message = 'Permission denied: Row level security policy violation'
      break

    default:
      statusCode = 500
      message = `Database error: ${message}`
  }

  return { message, code, details, statusCode }
}

/**
 * Async error handler wrapper
 * Catches async errors and passes them to error middleware
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
