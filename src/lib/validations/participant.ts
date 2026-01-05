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
 * Schema for recording an initial buy-in
 * Creates a new ledger entry for the participant
 */
export const recordBuyInSchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
  amount: z
    .number()
    .positive('Buy-in amount must be positive')
    .max(VALIDATION.MAX_BUY_IN, `Buy-in cannot exceed $${VALIDATION.MAX_BUY_IN}`),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
});

export type RecordBuyInInput = z.infer<typeof recordBuyInSchema>;

/**
 * Schema for recording a rebuy (additional buy-in)
 */
export const recordRebuySchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
  amount: z
    .number()
    .positive('Rebuy amount must be positive')
    .max(VALIDATION.MAX_BUY_IN, `Rebuy cannot exceed $${VALIDATION.MAX_BUY_IN}`),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
});

export type RecordRebuyInput = z.infer<typeof recordRebuySchema>;

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
 * Schema for removing/editing a ledger entry (host only)
 */
export const updateLedgerEntrySchema = z.object({
  entry_id: z.string().uuid('Invalid ledger entry ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(VALIDATION.MAX_BUY_IN, `Amount cannot exceed $${VALIDATION.MAX_BUY_IN}`)
    .optional(),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional().nullable(),
});

export type UpdateLedgerEntryInput = z.infer<typeof updateLedgerEntrySchema>;

/**
 * Schema for deleting a ledger entry
 */
export const deleteLedgerEntrySchema = z.object({
  entry_id: z.string().uuid('Invalid ledger entry ID'),
});

export type DeleteLedgerEntryInput = z.infer<typeof deleteLedgerEntrySchema>;

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

/**
 * Schema for settling an event (creating debt transactions)
 */
export const settleEventSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
});

export type SettleEventInput = z.infer<typeof settleEventSchema>;

