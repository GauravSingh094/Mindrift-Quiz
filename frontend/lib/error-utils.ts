import { ApiError } from '@/types';

export function isApiError(err: any): err is ApiError {
  return (
    err !== null &&
    typeof err === 'object' &&
    typeof err.status === 'number' &&
    typeof err.message === 'string'
  );
}

export function getErrorMessage(err: any): string {
  if (isApiError(err)) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function getFieldErrors(err: any): Record<string, string[]> | null {
  if (isApiError(err) && err.errors) {
    return err.errors;
  }
  return null;
}
