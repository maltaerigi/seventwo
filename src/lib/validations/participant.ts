/**
 * Participant Validation Schemas
 * 
 * Zod schemas for validating participant-related data.
 * Used for check-ins, buy-ins, cash-outs, and approvals.
 */

import { z } from 'zod';
import { VALIDATION } from '@/constants';

/**
 * Schema for joining an event
 */
export const joinEventSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
});

export type JoinEventInput = z.infer<typeof joinEventSchema>;

/**
 * Schema for checking in to an event
 */
export const checkInSchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

/**
 * Schema for recording a buy-in
 */
export const recordBuyInSchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
  amount: z
    .number()
    .min(VALIDATION.MIN_BUY_IN, 'Buy-in amount must be positive')
    .max(VALIDATION.MAX_BUY_IN, `Buy-in cannot exceed ${VALIDATION.MAX_BUY_IN}`),
});

export type RecordBuyInInput = z.infer<typeof recordBuyInSchema>;

/**
 * Schema for recording a cash-out
 */
export const recordCashOutSchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
  amount: z
    .number()
    .min(0, 'Cash-out amount cannot be negative')
    .max(VALIDATION.MAX_BUY_IN * 10, 'Cash-out amount seems unusually high'),
});

export type RecordCashOutInput = z.infer<typeof recordCashOutSchema>;

/**
 * Schema for approving/denying a participant
 */
export const approveParticipantSchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
  approved: z.boolean(),
});

export type ApproveParticipantInput = z.infer<typeof approveParticipantSchema>;

/**
 * Schema for marking a transaction as paid
 */
export const markTransactionPaidSchema = z.object({
  transaction_id: z.string().uuid('Invalid transaction ID'),
  payment_method: z.enum(['venmo', 'cashapp', 'cash', 'other']).optional(),
});

export type MarkTransactionPaidInput = z.infer<typeof markTransactionPaidSchema>;

