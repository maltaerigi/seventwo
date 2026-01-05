/**
 * Auth Validation Schemas
 * 
 * Zod schemas for authentication-related data.
 */

import { z } from 'zod';
import { VALIDATION } from '@/constants';

/**
 * Schema for magic link login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(VALIDATION.DISPLAY_NAME_MIN_LENGTH, `Display name must be at least ${VALIDATION.DISPLAY_NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.DISPLAY_NAME_MAX_LENGTH, `Display name must be at most ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} characters`)
    .optional(),
  avatar_url: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema for newsletter subscription
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

