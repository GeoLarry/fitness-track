import { HttpErrorResponse } from '@angular/common/http';

// A message to show the user for a failed API call: the API's own { message } when it sent one.
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Cannot reach the server. Please try again later.';
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

// Only same-app paths, so a crafted ?returnUrl=https://evil.example cannot redirect elsewhere.
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}
