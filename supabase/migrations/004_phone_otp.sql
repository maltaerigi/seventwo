-- ============================================
-- Phone OTP Authentication
-- ============================================
-- This migration adds phone-based OTP authentication
-- Works in mock mode (all codes = 123456) or real mode (Twilio)
-- ============================================

-- ============================================
-- Phone Verifications Table
-- ============================================
-- Stores OTP codes with expiration

CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by phone
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone);
CREATE INDEX idx_phone_verifications_expires_at ON public.phone_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Only the system can access this table (no direct user access)
-- All operations go through API routes
CREATE POLICY "No direct access to phone verifications"
    ON public.phone_verifications FOR ALL
    USING (false);

-- ============================================
-- Add phone column to profiles
-- ============================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Index for phone lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ============================================
-- Update handle_new_user to include phone
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Cleanup function for expired verifications
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.phone_verifications
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to validate OTP (used by API)
-- ============================================
-- Note: This requires service role key to execute

CREATE OR REPLACE FUNCTION verify_phone_otp(
    p_phone TEXT,
    p_code TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    user_id UUID
) AS $$
DECLARE
    v_verification RECORD;
    v_profile RECORD;
BEGIN
    -- Find the latest unexpired verification for this phone
    SELECT * INTO v_verification
    FROM public.phone_verifications
    WHERE phone = p_phone
      AND expires_at > NOW()
      AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    -- No verification found
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'No pending verification found. Please request a new code.'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check attempts
    IF v_verification.attempts >= v_verification.max_attempts THEN
        RETURN QUERY SELECT false, 'Too many attempts. Please request a new code.'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Update attempts
    UPDATE public.phone_verifications
    SET attempts = attempts + 1
    WHERE id = v_verification.id;

    -- Check code
    IF v_verification.code != p_code THEN
        RETURN QUERY SELECT false, 'Invalid code. Please try again.'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Mark as verified
    UPDATE public.phone_verifications
    SET verified_at = NOW()
    WHERE id = v_verification.id;

    -- Find existing user with this phone
    SELECT id INTO v_profile
    FROM public.profiles
    WHERE phone = p_phone;

    IF FOUND THEN
        RETURN QUERY SELECT true, 'Verification successful.'::TEXT, v_profile.id;
    ELSE
        RETURN QUERY SELECT true, 'Verification successful. New user.'::TEXT, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

