/**
 * @module utils
 * @description Barrel export for utility modules
 */

// Export legacy error classes (for backward compatibility)
export {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  UnprocessableEntityError,
  ServiceUnavailableError,
  DatabaseError,
} from './errors.js'

// Export new centralized error classes
export {
  ApiError,
  BadRequestError,
  UnauthorizedError as ApiUnauthorizedError,
  ForbiddenError as ApiForbiddenError,
  NotFoundError as ApiNotFoundError,
  ConflictError as ApiConflictError,
  InternalServerError,
  DatabaseError as ApiDatabaseError,
  asyncHandler,
  parseDatabaseError,
} from './apiError.js'

// Export logger
export { logger, stream } from './logger.js'
