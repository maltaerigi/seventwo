/**
 * Event Validation Schemas
 * 
 * Zod schemas for validating event-related data.
 * Used in both client-side forms and server-side API validation.
 */

import { z } from 'zod';
import { VALIDATION, DEFAULT_SMALL_BLIND, DEFAULT_BIG_BLIND, DEFAULT_MAX_SEATS, MIN_SEATS, MAX_SEATS } from '@/constants';

/**
 * Schema for creating a new event
 */
export const createEventSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN_LENGTH, `Title must be at least ${VALIDATION.TITLE_MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE_MAX_LENGTH, `Title must be at most ${VALIDATION.TITLE_MAX_LENGTH} characters`),
  
  description: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
  
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  
  event_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format. Use HH:MM or HH:MM:SS'),
  
  location: z
    .string()
    .min(1, 'Location is required')
    .max(VALIDATION.LOCATION_MAX_LENGTH, `Location must be at most ${VALIDATION.LOCATION_MAX_LENGTH} characters`),
  
  is_private: z.boolean().default(false),
  
  small_blind: z
    .number()
    .min(0, 'Small blind must be positive')
    .default(DEFAULT_SMALL_BLIND),
  
  big_blind: z
    .number()
    .min(0, 'Big blind must be positive')
    .default(DEFAULT_BIG_BLIND),
  
  max_seats: z
    .number()
    .int('Max seats must be a whole number')
    .min(MIN_SEATS, `Must have at least ${MIN_SEATS} seats`)
    .max(MAX_SEATS, `Cannot exceed ${MAX_SEATS} seats`)
    .default(DEFAULT_MAX_SEATS),
  
  requires_approval: z.boolean().default(false),
  
  cover_photo_url: z
    .string()
    .nullable()
    .optional(),
}).refine(
  (data) => data.big_blind >= data.small_blind,
  {
    message: 'Big blind must be greater than or equal to small blind',
    path: ['big_blind'],
  }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * Schema for updating an event
 */
export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['upcoming', 'active', 'completed']).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Schema for event query parameters
 */
export const eventQuerySchema = z.object({
  status: z.enum(['upcoming', 'active', 'completed']).optional(),
  host_id: z.string().uuid().optional(),
  is_private: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type EventQueryInput = z.infer<typeof eventQuerySchema>;

