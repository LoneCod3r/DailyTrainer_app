import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createLogger } from '@/lib/logger';

const log = createLogger('api');

// Consistent API error shape across every route, so the frontend can rely on
// `{ error: { code, message, details? } }` everywhere instead of each route
// inventing its own error format.
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  unauthorized: (message = 'Authentication required') => new ApiError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'You do not have permission to perform this action') =>
    new ApiError(403, 'FORBIDDEN', message),
  notFound: (message = 'Resource not found') => new ApiError(404, 'NOT_FOUND', message),
  conflict: (message = 'Resource already exists') => new ApiError(409, 'CONFLICT', message),
  badRequest: (message = 'Invalid request', details?: unknown) =>
    new ApiError(400, 'BAD_REQUEST', message, details),
  tooManyRequests: (message = 'Too many requests, please try again later') =>
    new ApiError(429, 'RATE_LIMITED', message),
  internal: (message = 'Something went wrong') => new ApiError(500, 'INTERNAL_ERROR', message),
};

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// Wraps an API route handler so every uncaught error becomes a consistent
// JSON response, and nothing sensitive (stack traces, DB errors) leaks to
// the client — while still being logged server-side for diagnosis.
export function withErrorHandling(handler: () => Promise<NextResponse>) {
  return (async () => {
    try {
      return await handler();
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.flatten() } },
          { status: 400 },
        );
      }
      log.error('unhandled API error', { message: (err as Error)?.message });
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
        { status: 500 },
      );
    }
  })();
}
