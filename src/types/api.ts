/**
 * API Types for Seventwo
 * 
 * These types define the shape of API requests and responses.
 * Keeping these separate from database types allows for flexibility
 * in API design while maintaining type safety.
 */

import type { 
  Event, 
  Profile,
  UserGameResult 
} from './database';

// Note: EventInsert, EventUpdate, EventParticipant, EventTransaction
// are available from './database' when needed for API types

// ============================================
// Generic API Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Pagination
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Auth API Types
// ============================================

export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// ============================================
// Event API Types
// ============================================

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  location: string;
  is_private?: boolean;
  small_blind: number;
  big_blind: number;
  max_seats: number;
  requires_approval?: boolean;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: Event['status'];
}

export interface EventListParams extends PaginationParams {
  status?: Event['status'];
  host_id?: string;
  is_private?: boolean;
}

// ============================================
// Participant API Types
// ============================================

export interface JoinEventRequest {
  event_id: string;
}

export interface CheckInRequest {
  event_id: string;
  participant_id: string;
}

export interface RecordBuyInRequest {
  participant_id: string;
  amount: number;
  notes?: string;
}

export interface RecordRebuyRequest {
  participant_id: string;
  amount: number;
  notes?: string;
}

export interface RecordCashOutRequest {
  participant_id: string;
  amount: number;
}

export interface UpdateLedgerEntryRequest {
  entry_id: string;
  amount?: number;
  notes?: string | null;
}

export interface DeleteLedgerEntryRequest {
  entry_id: string;
}

export interface ApproveParticipantRequest {
  participant_id: string;
  approved: boolean;
}

// ============================================
// Ledger API Types
// ============================================

/**
 * Participant summary in ledger
 */
export interface LedgerParticipantSummary {
  participant_id: string;
  user_id: string;
  display_name: string;
  initial_buy_in: number;
  total_rebuys: number;
  rebuy_count: number;
  total_buy_in: number;
  cash_out: number | null;
  net_profit_loss: number;
  is_cashed_out: boolean;
}

/**
 * Event ledger summary response
 */
export interface EventLedgerResponse {
  event_id: string;
  total_buy_ins: number;
  total_cash_outs: number;
  money_still_in_play: number;
  balance_check: number;
  is_balanced: boolean;
  participants_count: number;
  participants_cashed_out: number;
  participants_still_playing: number;
  can_settle: boolean;
  participants: LedgerParticipantSummary[];
}

// ============================================
// Calculation API Types
// ============================================

/**
 * Debt between two users
 */
export interface Debt {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
}

/**
 * Winner/Loser in settlement
 */
export interface SettlementParticipant {
  user_id: string;
  user_name: string;
  amount: number; // Positive for winners, represents profit/loss
}

/**
 * Result of debt calculation for an event
 */
export interface DebtCalculationResult {
  event_id: string;
  debts: Debt[];
  total_pot: number;
  participants_count: number;
  winners: SettlementParticipant[];
  losers: SettlementParticipant[];
}

/**
 * Settlement request
 */
export interface SettleEventRequest {
  event_id: string;
}

/**
 * Settlement response
 */
export interface SettleEventResponse {
  event_id: string;
  status: 'completed';
  debts_created: number;
  debts: Debt[];
}

// ============================================
// Profile API Types
// ============================================

export interface UpdateProfileRequest {
  display_name?: string;
  avatar_url?: string;
}

/**
 * Performance statistics for a user
 */
export interface UserPerformanceStats {
  total_games_played: number;
  total_profit_loss: number;
  average_profit_loss: number;
  win_rate: number; // Percentage (0-100)
  best_session: number;
  worst_session: number;
  games_won: number;
  games_lost: number;
}

export interface UserPerformanceResponse {
  stats: UserPerformanceStats;
  recent_games: UserGameResult[];
}

// ============================================
// Newsletter API Types
// ============================================

export interface SubscribeNewsletterRequest {
  email: string;
}

export interface SubscribeNewsletterResponse {
  message: string;
  subscribed: boolean;
}

