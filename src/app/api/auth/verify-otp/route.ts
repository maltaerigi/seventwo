/**
 * Verify OTP API Route
 * 
 * POST /api/auth/verify-otp
 * Body: { phone: string, code: string, displayName?: string, email?: string }
 * 
 * Verifies the OTP code and creates/signs in the user.
 * - If user exists: Signs them in
 * - If new user: Creates account with provided displayName and email
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, formatPhoneNumber, isValidPhoneNumber } from '@/lib/otp';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, displayName, email } = body;

    // Validate input
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Verify the OTP
    const result = await verifyOTP(phone, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const adminClient = createAdminClient();

    let userId = result.userId;
    let isNewUser = result.isNewUser;

    // If new user, create account
    if (isNewUser) {
      // Validate required fields for new users
      if (!displayName?.trim()) {
        return NextResponse.json(
          { error: 'Name is required for new users', isNewUser: true },
          { status: 400 }
        );
      }

      // Create user in Supabase Auth
      // Using phone as email identifier for auth (we store real email separately)
      const authEmail = `${formattedPhone.replace('+', '')}@phone.seventwo.app`;
      
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: authEmail,
        email_confirm: true, // Auto-confirm since we verified via OTP
        user_metadata: {
          display_name: displayName.trim(),
          phone: formattedPhone,
          actual_email: email || null,
        },
      });

      if (authError) {
        console.error('Failed to create user:', authError);
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }

      userId = authData.user.id;

      // Update profile with email if provided
      if (email) {
        await adminClient
          .from('profiles')
          .update({ 
            phone: formattedPhone,
            display_name: displayName.trim(),
          })
          .eq('id', userId);
      }
    }

    // Create session for the user
    if (!userId) {
      // This shouldn't happen, but handle it gracefully
      // Find user by phone
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('phone', formattedPhone)
        .single();
      
      if (!profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      userId = profile.id;
    }

    // Get user's auth data (userId is guaranteed to be defined at this point)
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId!);
    
    if (userError || !userData?.user) {
      console.error('Failed to retrieve user:', userError);
      return NextResponse.json(
        { error: 'Failed to retrieve user' },
        { status: 500 }
      );
    }

    // Generate a session link using admin API
    // This creates a magic link that we can use to establish a session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectTo = `${appUrl}/auth/callback?redirectTo=${encodeURIComponent('/events')}`;
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
      options: {
        redirectTo,
      },
    });

    if (linkError || !linkData) {
      console.error('Failed to generate session link:', linkError);
      return NextResponse.json(
        { error: `Failed to create session: ${linkError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Try to extract code from the action_link for direct session creation
    const actionUrl = new URL(linkData.properties.action_link);
    const authCode = actionUrl.searchParams.get('code');
    const token_hash = actionUrl.searchParams.get('token_hash');
    const type = actionUrl.searchParams.get('type');

    // Create a server client to set cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // Ignore errors in read-only contexts
              console.warn('Failed to set cookie:', error);
            }
          },
        },
      }
    );

    // Try to create session using authCode (preferred method)
    if (authCode) {
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(authCode);
      
      if (!sessionError && sessionData.session) {
        return NextResponse.json({
          success: true,
          message: isNewUser ? 'Account created successfully' : 'Signed in successfully',
          isNewUser,
          user: {
            id: sessionData.user?.id,
            phone: formattedPhone,
            displayName: sessionData.user?.user_metadata?.display_name,
          },
        });
      }
    }

    // Fallback: try token_hash method
    if (token_hash && type) {
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'magiclink',
      });

      if (!sessionError && sessionData.session) {
        return NextResponse.json({
          success: true,
          message: isNewUser ? 'Account created successfully' : 'Signed in successfully',
          isNewUser,
          user: {
            id: sessionData.user?.id,
            phone: formattedPhone,
            displayName: sessionData.user?.user_metadata?.display_name,
          },
        });
      }
      
      if (sessionError) {
        console.error('Failed to verify session token:', sessionError);
      }
    }

    // If both methods fail, return the action_link for frontend redirect
    console.warn('Direct session creation failed, returning redirect URL');
    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Signed in successfully',
      isNewUser,
      redirectUrl: linkData.properties.action_link,
      user: {
        id: userId,
        phone: formattedPhone,
        displayName: userData.user.user_metadata?.display_name,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}

