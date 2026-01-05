/**
 * Database Types for Seventwo
 * 
 * These types mirror the Supabase database schema.
 * When using Supabase CLI, you can generate these automatically with:
 * `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts`
 * 
 * For now, we define them manually to match our planned schema.
 */

// ============================================
// Enums
// ============================================

export type EventStatus = 'upcoming' | 'active' | 'completed';
export type ParticipantStatus = 'pending' | 'approved' | 'denied' | 'checked_in';
export type TransactionStatus = 'pending' | 'completed';
export type PaymentMethod = 'venmo' | 'cashapp' | 'cash' | 'other';

// ============================================
// Core Tables (MVP)
// ============================================

/**
 * User profile - extends Supabase auth.users
 * Contains aggregate stats; individual game results are in event_participants
 */
export interface Profile {
  id: string; // UUID, references auth.users.id
  display_name: string | null;
  avatar_url: string | null;
  total_games_played: number;
  total_profit_loss: number; // Decimal stored as number
  created_at: string; // ISO timestamp
  updated_at: string;
}

/**
 * Poker event/game night
 */
export interface Event {
  id: string; // UUID
  host_id: string; // UUID, references profiles.id
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  event_date: string; // ISO date (YYYY-MM-DD)
  event_time: string; // Time (HH:MM:SS)
  location: string;
  location_lat: number | null; // For future location-based discovery
  location_lng: number | null;
  is_private: boolean;
  status: EventStatus;
  slug: string; // Unique, for shareable URLs
  share_token: string | null; // UUID, for private event sharing
  small_blind: number; // Decimal
  big_blind: number; // Decimal
  max_seats: number;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Event participant - tracks individual game results/transactions per user
 * This serves as the transaction log for a user's poker history
 */
export interface EventParticipant {
  id: string; // UUID
  event_id: string; // UUID, references events.id
  user_id: string; // UUID, references profiles.id
  checked_in_at: string | null; // ISO timestamp
  buy_in_amount: number; // Decimal - auto-calculated from ledger entries
  cash_out_amount: number | null; // Decimal
  cashed_out_at: string | null; // ISO timestamp - when player left
  net_profit_loss: number; // Calculated: cash_out - buy_in
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Event transaction - tracks debts between users after a game
 */
export interface EventTransaction {
  id: string; // UUID
  event_id: string; // UUID, references events.id
  from_user_id: string; // UUID, who owes
  to_user_id: string; // UUID, who is owed
  amount: number; // Decimal
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  created_at: string;
  updated_at: string;
}

/**
 * Newsletter subscriber
 */
export interface NewsletterSubscriber {
  id: string; // UUID
  email: string;
  subscribed_at: string; // ISO timestamp
  unsubscribed_at: string | null;
}

/**
 * Buy-in ledger entry - tracks individual buy-ins/rebuys
 * A participant can have multiple entries (initial buy-in + rebuys)
 */
export interface BuyInLedgerEntry {
  id: string; // UUID
  participant_id: string; // UUID, references event_participants.id
  amount: number; // Decimal
  is_rebuy: boolean;
  notes: string | null;
  created_at: string; // ISO timestamp
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'slug'> & {
  id?: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
};

export type EventParticipantInsert = Omit<EventParticipant, 'id' | 'created_at' | 'updated_at' | 'net_profit_loss'> & {
  id?: string;
  net_profit_loss?: number;
  created_at?: string;
  updated_at?: string;
};

export type EventTransactionInsert = Omit<EventTransaction, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type NewsletterSubscriberInsert = Omit<NewsletterSubscriber, 'id' | 'subscribed_at'> & {
  id?: string;
  subscribed_at?: string;
};

export type BuyInLedgerInsert = Omit<BuyInLedgerEntry, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type BuyInLedgerUpdate = Partial<Omit<BuyInLedgerEntry, 'id' | 'participant_id' | 'created_at'>>;

// ============================================
// Update Types (for updating existing records)
// ============================================

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;
export type EventUpdate = Partial<Omit<Event, 'id' | 'host_id' | 'created_at'>>;
export type EventParticipantUpdate = Partial<Omit<EventParticipant, 'id' | 'event_id' | 'user_id' | 'created_at'>>;
export type EventTransactionUpdate = Partial<Omit<EventTransaction, 'id' | 'event_id' | 'created_at'>>;

// ============================================
// Joined/Extended Types (for queries with relations)
// ============================================

/**
 * Event with host profile information
 */
export interface EventWithHost extends Event {
  host: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
}

/**
 * Participant with profile and event information
 */
export interface ParticipantWithProfile extends EventParticipant {
  profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
}

/**
 * Event with participants list
 */
export interface EventWithParticipants extends Event {
  participants: ParticipantWithProfile[];
}

/**
 * User's game result with event details
 * Used for transaction history / performance tracking
 */
export interface UserGameResult {
  event_id: string;
  event_title: string;
  event_date: string;
  event_time: string;
  buy_in_amount: number;
  cash_out_amount: number | null;
  net_profit_loss: number;
  status: ParticipantStatus;
}

/**
 * Transaction with user profiles
 */
export interface TransactionWithUsers extends EventTransaction {
  from_user: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
  to_user: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
}

/**
 * Participant with full ledger details
 */
export interface ParticipantWithLedger extends EventParticipant {
  profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
  buy_in_ledger: BuyInLedgerEntry[];
}

/**
 * Event ledger summary - complete overview of money in/out
 */
export interface EventLedgerSummary {
  event_id: string;
  total_buy_ins: number;
  total_cash_outs: number;
  balance_check: number; // Should be 0 when all cashed out
  participants_count: number;
  participants_cashed_out: number;
  participants_still_playing: number;
  participants: ParticipantWithLedger[];
}

