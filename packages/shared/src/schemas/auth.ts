import { z } from 'zod';

/** Must match the length set in supabase/config.toml ([auth.email] otp_length). */
export const OTP_LENGTH = 6;

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
});

export const otpSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
});

export type EmailInput = z.input<typeof emailSchema>;
export type OtpInput = z.input<typeof otpSchema>;
