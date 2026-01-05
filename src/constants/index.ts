/**
 * Application Constants
 * 
 * Centralized configuration and constants for the application.
 * This makes it easy to modify values across the app and ensures consistency.
 */

// ============================================
// Application Info
// ============================================

export const APP_NAME = 'Seventwo';
export const APP_DESCRIPTION = 'The ultimate poker night companion. Create events, track buy-ins, and settle debts with ease.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// API Configuration
// ============================================

export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================
// Event Defaults
// ============================================

export const DEFAULT_SMALL_BLIND = 0.25;
export const DEFAULT_BIG_BLIND = 0.50;
export const DEFAULT_MAX_SEATS = 9;
export const MIN_SEATS = 2;
export const MAX_SEATS = 100;

// ============================================
// Event Status
// ============================================

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  active: 'In Progress',
  completed: 'Completed',
};

// ============================================
// Participant Status
// ============================================

export const PARTICIPANT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CHECKED_IN: 'checked_in',
} as const;

export const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  denied: 'Denied',
  checked_in: 'Checked In',
};

// ============================================
// Payment Methods
// ============================================

export const PAYMENT_METHODS = {
  VENMO: 'venmo',
  CASHAPP: 'cashapp',
  CASH: 'cash',
  OTHER: 'other',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  venmo: 'Venmo',
  cashapp: 'Cash App',
  cash: 'Cash',
  other: 'Other',
};

// ============================================
// Routes
// ============================================

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  AUTH_CALLBACK: '/auth/callback',
  
  // Public event page (shareable)
  EVENT_PUBLIC: (slug: string) => `/e/${slug}`,
  
  // Protected routes (dashboard)
  DASHBOARD: '/events',
  EVENTS: '/events',
  EVENT_CREATE: '/events/create',
  EVENT_DETAIL: (id: string) => `/events/${id}`,
  PROFILE: '/profile',
  
  // API routes
  API: {
    EVENTS: '/api/events',
    EVENT: (id: string) => `/api/events/${id}`,
    PARTICIPANTS: '/api/participants',
    CALCULATIONS: '/api/calculations',
    NEWSLETTER: '/api/newsletter',
    AUTH: '/api/auth',
  },
} as const;

// ============================================
// Validation Limits
// ============================================

export const VALIDATION = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  LOCATION_MAX_LENGTH: 200,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 50,
  MIN_BUY_IN: 0,
  MAX_BUY_IN: 100000,
} as const;

// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Event errors
  EVENT_FULL: 'EVENT_FULL',
  EVENT_CLOSED: 'EVENT_CLOSED',
  NOT_HOST: 'NOT_HOST',
  
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// ============================================
// Date/Time Formats
// ============================================

export const DATE_FORMAT = {
  DISPLAY: 'MMMM d, yyyy', // January 15, 2025
  SHORT: 'MMM d, yyyy', // Jan 15, 2025
  ISO: 'yyyy-MM-dd', // 2025-01-15
  TIME: 'h:mm a', // 7:30 PM
  DATETIME: 'MMM d, yyyy h:mm a', // Jan 15, 2025 7:30 PM
} as const;

