import { Request, Response, NextFunction } from "express";
import { sendErrorResponse } from "../helper/responseHandler";
import config from "../config";

/**
 * Centralized global error handling middleware.
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Log the full error for server-side debugging
  console.error("Intercepted API runtime Exception:", err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Determine error type label
  let errorType = 'API_ERROR';
  if (statusCode === 422) errorType = 'VALIDATION_ERROR';
  if (statusCode === 404) errorType = 'RESOURCE_NOT_FOUND';
  if (statusCode === 401) errorType = 'AUTHENTICATION_ERROR';
  if (statusCode === 403) errorType = 'AUTHORIZATION_ERROR';
  if (statusCode === 409) errorType = 'CONFLICT_ERROR';

  // Only expose internal error details (stack trace) for server failures in development mode.
  const errorDetails =
    statusCode >= 500 && config.env === "development" ? err.stack : undefined;

  sendErrorResponse(res, statusCode, message, errorType, errorDetails);
};
