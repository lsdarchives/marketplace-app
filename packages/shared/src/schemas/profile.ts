import { z } from 'zod';

/**
 * Mirrors the CHECK constraints on public.profiles
 * (supabase/migrations/20261105000000_create_profiles.sql). The database remains the
 * source of truth; this gives users instant feedback before a round-trip.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
export const DISPLAY_NAME_MAX = 60;
export const REGION_MAX = 80;

/** Empty optional text fields are stored as NULL, not ''. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => (value === '' ? null : value));

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, '3–30 characters: lowercase letters, numbers or underscores'),
  display_name: optionalText(DISPLAY_NAME_MAX, 'Name'),
  region: optionalText(REGION_MAX, 'Area'),
});

/** What the form holds (all strings). */
export type ProfileFormInput = z.input<typeof profileSchema>;
/** What gets written to the database (empty strings become null). */
export type ProfileUpdate = z.output<typeof profileSchema>;
