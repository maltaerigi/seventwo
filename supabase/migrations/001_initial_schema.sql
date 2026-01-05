-- ============================================
-- Seventwo Initial Database Schema
-- ============================================
-- This migration creates the MVP tables needed for:
-- - User profiles
-- - Events
-- - Participants
-- - Transactions (debts)
-- - Newsletter subscribers
--
-- Run with: supabase db push
-- Or apply manually in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Profiles Table
-- ============================================
-- Extends the Supabase auth.users table with profile data
-- Aggregate stats are stored here; individual game results in event_participants

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    total_games_played INTEGER DEFAULT 0,
    total_profit_loss DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- Events Table
-- ============================================
-- Poker events/game nights

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_photo_url TEXT,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    is_private BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    slug TEXT UNIQUE NOT NULL,
    share_token UUID UNIQUE DEFAULT uuid_generate_v4(),
    small_blind DECIMAL(10, 2) DEFAULT 0.25,
    big_blind DECIMAL(10, 2) DEFAULT 0.50,
    max_seats INTEGER DEFAULT 9 CHECK (max_seats >= 2 AND max_seats <= 100),
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Public events are viewable by everyone"
    ON public.events FOR SELECT
    USING (is_private = FALSE OR host_id = auth.uid());

CREATE POLICY "Users can create events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their events"
    ON public.events FOR UPDATE
    USING (auth.uid() = host_id)
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their events"
    ON public.events FOR DELETE
    USING (auth.uid() = host_id);

-- ============================================
-- Event Participants Table
-- ============================================
-- Tracks individual game results/transactions per user

CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ,
    buy_in_amount DECIMAL(10, 2) DEFAULT 0,
    cash_out_amount DECIMAL(10, 2),
    net_profit_loss DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'checked_in')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Participants are viewable by event members"
    ON public.event_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id 
            AND (is_private = FALSE OR host_id = auth.uid())
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can join events"
    ON public.event_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
    ON public.event_participants FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can update participants"
    ON public.event_participants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id AND host_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their participation"
    ON public.event_participants FOR DELETE
    USING (auth.uid() = user_id);

-- Additional events policy (needs event_participants table to exist)
CREATE POLICY "Private events viewable by participants"
    ON public.events FOR SELECT
    USING (
        is_private = TRUE 
        AND EXISTS (
            SELECT 1 FROM public.event_participants 
            WHERE event_id = events.id AND user_id = auth.uid()
        )
    );

-- ============================================
-- Event Transactions Table
-- ============================================
-- Tracks debts between users after a game

CREATE TABLE IF NOT EXISTS public.event_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    payment_method TEXT CHECK (payment_method IN ('venmo', 'cashapp', 'cash', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Transactions viewable by involved parties"
    ON public.event_transactions FOR SELECT
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Hosts can create transactions"
    ON public.event_transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id AND host_id = auth.uid()
        )
    );

CREATE POLICY "Involved parties can update transactions"
    ON public.event_transactions FOR UPDATE
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- ============================================
-- Newsletter Subscribers Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Newsletter policies (admin only for now)
CREATE POLICY "Admins can view subscribers"
    ON public.newsletter_subscribers FOR SELECT
    USING (false); -- Modify this for admin access

CREATE POLICY "Anyone can subscribe"
    ON public.newsletter_subscribers FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_transactions_updated_at
    BEFORE UPDATE ON public.event_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate net profit/loss when cash_out is updated
CREATE OR REPLACE FUNCTION calculate_net_profit_loss()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cash_out_amount IS NOT NULL THEN
        NEW.net_profit_loss = NEW.cash_out_amount - NEW.buy_in_amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_participant_profit_loss
    BEFORE INSERT OR UPDATE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION calculate_net_profit_loss();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_events_host_id ON public.events(host_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_slug ON public.events(slug);

CREATE INDEX idx_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_participants_user_id ON public.event_participants(user_id);
CREATE INDEX idx_participants_status ON public.event_participants(status);

CREATE INDEX idx_transactions_event_id ON public.event_transactions(event_id);
CREATE INDEX idx_transactions_from_user ON public.event_transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON public.event_transactions(to_user_id);

