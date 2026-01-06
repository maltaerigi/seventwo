/**
 * Send OTP API Route
 * 
 * POST /api/auth/send-otp
 * Body: { phone: string }
 * 
 * Sends a 6-digit OTP code to the provided phone number.
 * In mock mode (MOCK_OTP=true), code is always 123456.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, formatPhoneNumber, isValidPhoneNumber, isMockMode } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate input
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use a valid phone number.' },
        { status: 400 }
      );
    }

    // Rate limiting could be added here in production
    // For now, we rely on the database's verification expiry

    // Send OTP
    const result = await sendOTP(phone);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Return success (don't reveal the code in response!)
    return NextResponse.json({
      success: true,
      message: result.message,
      phone: formatPhoneNumber(phone),
      expiresAt: result.expiresAt,
      // Only include mock info in development
      ...(isMockMode() && { mockCode: '123456' }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Provide more helpful error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key. Check ENV_SETUP.md' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('phone_verifications')) {
      return NextResponse.json(
        { error: 'Database not set up. Please run the migration from supabase/migrations/004_phone_otp.sql' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to send verification code: ${errorMessage}` },
      { status: 500 }
    );
  }
}

