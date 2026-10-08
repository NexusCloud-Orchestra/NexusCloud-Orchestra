export class ApiError extends Error {
  public status: number;
  public detail: string;
  public isNetworkError: boolean;

  constructor(status: number, detail: string, isNetworkError: boolean = false) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isNetworkError = isNetworkError;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Normalizes HTTP/API status codes into user-friendly messages without leaking stack traces.
 */
export function normalizeApiError(status: number, detail?: string): string {
  if (status === 401) {
    return 'Invalid email or password';
  }
  if (status === 400) {
    return detail || 'Invalid request';
  }
  if (status === 403) {
    return 'Account is inactive';
  }
  if (status === 429) {
    return 'Too many login attempts. Please try again later.';
  }
  if (status >= 500) {
    return 'Authentication service temporarily unavailable';
  }
  return detail || 'An unexpected error occurred. Please try again.';
}
