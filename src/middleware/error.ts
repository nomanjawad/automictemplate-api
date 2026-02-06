/**
 * @module middleware/error
 * @description Global error handling middleware with structured logging
 */

import { Request, Response, NextFunction } from 'express'
import { logger, AppError, UnprocessableEntityError } from '../utils/index.js'

/**
 * Global error handler middleware
 * Catches all unhandled errors, logs them, and returns appropriate JSON response
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Determine if this is an operational error (expected) or programming error (unexpected)
  const isOperational = err instanceof AppError ? err.isOperational : false
  const statusCode = err instanceof AppError ? err.statusCode : 500

  // Log error with context
  const errorLog = {
    message: err.message,
    statusCode,
    isOperational,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    stack: err.stack,
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
    error: isOperational ? err.message : 'Internal server error',
    statusCode,
  }

  // Add validation errors if present
  if (err instanceof UnprocessableEntityError && err.errors) {
    response.errors = err.errors
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack
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
