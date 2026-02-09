/**
 * @module middleware/error
 * @description Global error handling middleware with structured logging
 */

import { Request, Response, NextFunction } from 'express'
import { logger, AppError, UnprocessableEntityError } from '../utils/index.js'
import { ApiError, DatabaseError } from '../utils/apiError.js'

/**
 * Global error handler middleware
 * Catches all unhandled errors, logs them, and returns appropriate JSON response
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Convert database errors to ApiError
  let error = err
  if (err.name === 'PostgrestError' || (err as any).code) {
    error = new DatabaseError(err)
  }

  // Determine if this is an operational error (expected) or programming error (unexpected)
  const isOperational = error instanceof ApiError 
    ? error.isOperational 
    : error instanceof AppError 
    ? error.isOperational 
    : false
  
  const statusCode = error instanceof ApiError 
    ? error.statusCode 
    : error instanceof AppError 
    ? error.statusCode 
    : 500

  const errorCode = error instanceof ApiError ? error.code : 'INTERNAL_ERROR'
  const errorDetails = error instanceof ApiError ? error.details : undefined

  // Log error with context
  const errorLog = {
    message: error.message,
    statusCode,
    code: errorCode,
    isOperational,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    details: errorDetails,
    stack: error.stack,
  }

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server Error', errorLog)
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorLog)
  } else {
    logger.info('Request Error', errorLog)
  }

  // Prepare response
  const response: any = {
    error: isOperational ? error.message : 'Internal server error',
    code: errorCode,
  }

  // Add error details if present
  if (errorDetails) {
    response.details = errorDetails
  }

  // Add validation errors if present
  if (error instanceof UnprocessableEntityError && error.errors) {
    response.errors = error.errors
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack
  }

  // Send response
  res.status(statusCode).json(response)

  // If it's a programming error, we should restart the server (in production)
  if (!isOperational && process.env.NODE_ENV === 'production') {
    logger.error('Non-operational error detected. Server should be restarted.')
    // In production, you might want to use PM2 or similar to restart
    // process.exit(1)
  }
}
