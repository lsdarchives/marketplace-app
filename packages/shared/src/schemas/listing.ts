import { z } from 'zod';

import type { Database } from '../database.types';
import { normaliseWhatsApp, parsePriceToCents } from '../market';

export type ListingCondition = Database['public']['Enums']['listing_condition'];
export type ListingStatus = Database['public']['Enums']['listing_status'];

export const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'for_parts', label: 'For parts' },
];

export const conditionLabel = (value: ListingCondition) =>
  CONDITIONS.find((c) => c.value === value)?.label ?? value;

export const MAX_LISTING_PHOTOS = 8;
/** Mirrors the price_cents CHECK on public.listings (R 10 000 000). */
export const MAX_PRICE_CENTS = 1_000_000_000;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => (value === '' ? null : value));

/** Mirrors the CHECK constraints in supabase/migrations/20261107000000_listings.sql. */
export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Give your item a title (at least 3 characters)')
    .max(80, 'Keep the title to 80 characters or fewer'),
  description: z.string().trim().max(4000, 'Keep the description to 4000 characters or fewer'),
  price: z
    .string()
    .transform((value, ctx) => {
      const cents = parsePriceToCents(value);
      if (cents === null) {
        ctx.addIssue({ code: 'custom', message: 'Enter a price, e.g. 450 or 450.50' });
        return z.NEVER;
      }
      if (cents > MAX_PRICE_CENTS) {
        ctx.addIssue({ code: 'custom', message: 'That price is too high' });
        return z.NEVER;
      }
      return cents;
    }),
  category_slug: z.string().min(1, 'Choose a category'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'for_parts'], {
    error: 'Choose a condition',
  }),
  brand: optionalText(60, 'Brand'),
  region: optionalText(80, 'Area'),
});

export type ListingFormInput = z.input<typeof listingSchema>;
export type ListingFormOutput = z.output<typeof listingSchema>;

export const soldPriceSchema = z.object({
  price: listingSchema.shape.price,
});

/** Optional WhatsApp number on the seller's profile. Empty clears it. */
export const whatsappSchema = z.object({
  whatsapp: z.string().transform((value, ctx) => {
    if (value.trim() === '') return null;
    const e164 = normaliseWhatsApp(value);
    if (!e164) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid mobile number, e.g. 082 123 4567' });
      return z.NEVER;
    }
    return e164;
  }),
});
