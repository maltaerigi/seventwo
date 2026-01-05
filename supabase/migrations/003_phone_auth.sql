-- ============================================
-- Phone Authentication Updates
-- ============================================
-- Adds phone number to profiles and updates triggers
-- Run this in Supabase SQL Editor
-- ============================================

-- Add phone column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Add email column to profiles (for storing user's email separately)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Update the profile creation trigger to handle phone auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, phone, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            split_part(COALESCE(NEW.email, NEW.phone), '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.phone,
        COALESCE(NEW.email, NEW.raw_user_meta_data->>'email')
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

