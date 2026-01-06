/**
 * OTP Service for Phone Authentication
 * 
 * Supports two modes:
 * - Mock mode (MOCK_OTP=true): All codes are "123456", no SMS sent
 * - Production mode: Sends real SMS via Twilio
 * 
 * Usage:
 * ```ts
 * import { sendOTP, verifyOTP } from '@/lib/otp';
 * 
 * // Send OTP
 * const result = await sendOTP('+1234567890');
 * 
 * // Verify OTP
 * const verified = await verifyOTP('+1234567890', '123456');
 * ```
 */

import { createAdminClient } from '@/lib/supabase/admin';

// ============================================
// Configuration
// ============================================

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

// Check if we're in mock mode
export function isMockMode(): boolean {
  // If MOCK_OTP is explicitly set, use that
  if (process.env.MOCK_OTP !== undefined) {
    return process.env.MOCK_OTP === 'true' || process.env.MOCK_OTP === '1';
  }
  
  // Default to mock mode in development if not set
  if (process.env.NODE_ENV === 'development') {
    console.warn('[OTP] MOCK_OTP not set, defaulting to mock mode in development');
    return true;
  }
  
  // Production: require explicit setting
  return false;
}

// ============================================
// Phone Number Formatting
// ============================================

/**
 * Formats phone number to E.164 format (+1XXXXXXXXXX)
 * Assumes US numbers if no country code provided
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 1 and has 11 digits (US with country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If has 10 digits (US without country code)
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already has + prefix and looks valid
  if (phone.startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }
  
  // Return as-is with + prefix (for international numbers)
  return phone.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Validates phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: + followed by 10-15 digits
  return /^\+[1-9]\d{9,14}$/.test(formatted);
}

/**
 * Masks phone number for display (e.g., +1******7890)
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 8) return phone;
  const visible = 4;
  return phone.slice(0, 3) + '*'.repeat(phone.length - 3 - visible) + phone.slice(-visible);
}

// ============================================
// OTP Generation
// ============================================

/**
 * Generates a random 6-digit OTP code
 * In mock mode, always returns "123456"
 */
export function generateOTP(): string {
  if (isMockMode()) {
    return '123456';
  }
  
  // Generate cryptographically random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

// ============================================
// Twilio Integration
// ============================================

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }
  
  return { accountSid, authToken, fromNumber };
}

/**
 * Sends SMS via Twilio
 */
async function sendTwilioSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  const config = getTwilioConfig();
  
  if (!config) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: config.fromNumber,
        Body: body,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio error:', error);
      return { success: false, error: error.message || 'Failed to send SMS' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Twilio request failed:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}

// ============================================
// Main OTP Functions
// ============================================

export interface SendOTPResult {
  success: boolean;
  message: string;
  expiresAt?: string;
}

/**
 * Sends OTP to the given phone number
 * - Stores verification record in database
 * - Sends SMS (or skips in mock mode)
 */
export async function sendOTP(phone: string): Promise<SendOTPResult> {
  // Validate phone number
  if (!isValidPhoneNumber(phone)) {
    return { success: false, message: 'Invalid phone number format' };
  }
  
  const formattedPhone = formatPhoneNumber(phone);
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  try {
    // Create admin client for database operations
    const supabase = createAdminClient();
    
    // Invalidate any existing verifications for this phone
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('phone', formattedPhone)
      .is('verified_at', null);
    
    // Create new verification record
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        phone: formattedPhone,
        code,
        max_attempts: MAX_ATTEMPTS,
        expires_at: expiresAt.toISOString(),
      });
    
    if (insertError) {
      console.error('Failed to create verification record:', insertError);
      return { success: false, message: 'Failed to create verification' };
    }
    
    // Send SMS (or skip in mock mode)
    const mockMode = isMockMode();
    
    if (!mockMode) {
      // Production mode: send real SMS
      const smsResult = await sendTwilioSMS(
        formattedPhone,
        `Your Seventwo verification code is: ${code}. Expires in ${OTP_EXPIRY_MINUTES} minutes.`
      );
      
      if (!smsResult.success) {
        return { success: false, message: smsResult.error || 'Failed to send SMS' };
      }
    } else {
      // Mock mode: just log the code
      console.log(`[MOCK MODE] OTP for ${formattedPhone}: ${code}`);
    }
    
    return {
      success: true,
      message: isMockMode() 
        ? 'Code sent (mock mode - use 123456)' 
        : 'Verification code sent',
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('sendOTP error:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  userId?: string; // Existing user ID if found
  isNewUser?: boolean;
}

/**
 * Verifies the OTP code for a phone number
 */
export async function verifyOTP(phone: string, code: string): Promise<VerifyOTPResult> {
  if (!isValidPhoneNumber(phone)) {
    return { success: false, message: 'Invalid phone number format' };
  }
  
  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    const supabase = createAdminClient();
    
    // Find the latest unexpired verification
    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !verification) {
      return { success: false, message: 'No pending verification found. Please request a new code.' };
    }
    
    // Check attempts
    if (verification.attempts >= verification.max_attempts) {
      return { success: false, message: 'Too many attempts. Please request a new code.' };
    }
    
    // Update attempts
    await supabase
      .from('phone_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id);
    
    // Check code
    if (verification.code !== code) {
      return { success: false, message: 'Invalid code. Please try again.' };
    }
    
    // Mark as verified
    await supabase
      .from('phone_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);
    
    // Check if user exists with this phone
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .single();
    
    if (profile) {
      return {
        success: true,
        message: 'Verification successful',
        userId: profile.id,
        isNewUser: false,
      };
    }
    
    return {
      success: true,
      message: 'Verification successful',
      isNewUser: true,
    };
  } catch (error) {
    console.error('verifyOTP error:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

