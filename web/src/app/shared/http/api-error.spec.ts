import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage, safeReturnUrl } from './api-error';

describe('api-error helpers', () => {
  it('uses the message the API sent', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'This username is already taken.' } });
    expect(apiErrorMessage(error)).toBe('This username is already taken.');
  });

  it('explains when the server cannot be reached', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
  });

  it('falls back to a generic message', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 500 }))).toContain('Something went wrong');
    expect(apiErrorMessage(new Error('boom'), 'Custom')).toBe('Custom');
  });

  it('only allows return URLs inside the app', () => {
    expect(safeReturnUrl('/training')).toBe('/training');
    expect(safeReturnUrl('https://evil.example')).toBe('/');
    expect(safeReturnUrl('//evil.example')).toBe('/');
    expect(safeReturnUrl(undefined)).toBe('/');
  });
});
