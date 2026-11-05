import { friendlyAuthError } from '@/lib/auth-errors';

describe('friendlyAuthError', () => {
  it('explains wrong or expired codes', () => {
    expect(friendlyAuthError({ code: 'otp_expired', status: 403 })).toMatch(/wrong or has expired/);
  });

  it('explains rate limits by code or HTTP status', () => {
    expect(friendlyAuthError({ code: 'over_email_send_rate_limit', status: 429 })).toMatch(/wait a minute/);
    expect(friendlyAuthError({ status: 429 })).toMatch(/wait a minute/);
  });

  it('explains network failures', () => {
    expect(friendlyAuthError({ message: 'Network request failed' })).toMatch(/connection/);
  });

  it('falls back to a generic message', () => {
    expect(friendlyAuthError({ status: 500, message: 'boom' })).toBe(
      'Something went wrong. Please try again.',
    );
    expect(friendlyAuthError(null)).toBe('Something went wrong. Please try again.');
  });
});
