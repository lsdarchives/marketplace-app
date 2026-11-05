type MaybeAuthError = { code?: string; status?: number; message?: string } | null | undefined;

/** Turns Supabase Auth errors into messages a shopper can act on. */
export function friendlyAuthError(error: MaybeAuthError): string {
  if (!error) return 'Something went wrong. Please try again.';

  switch (error.code) {
    case 'otp_expired':
      return 'That code is wrong or has expired. Check the email or send a new code.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'email_address_invalid':
      return 'That email address can’t be used. Try another one.';
    case 'signup_disabled':
      return 'New sign-ups are paused right now.';
  }

  if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (!error.status || /network|fetch/i.test(error.message ?? '')) {
    return 'Can’t reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
