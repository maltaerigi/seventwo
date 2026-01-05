-- ============================================
-- Buy-In Ledger Migration
-- ============================================
-- This migration adds a ledger table to track individual
-- buy-ins/rebuys for each participant. This allows:
-- - Multiple buy-ins per player per event
-- - Tracking of initial buy-in vs rebuys
-- - Complete audit trail of money in/out
-- ============================================

-- ============================================
-- Buy-In Ledger Table
-- ============================================
-- Tracks each individual buy-in transaction for a participant
-- A participant can have multiple entries (initial + rebuys)

CREATE TABLE IF NOT EXISTS public.buy_in_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.event_participants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    is_rebuy BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.buy_in_ledger ENABLE ROW LEVEL SECURITY;

-- Ledger policies
CREATE POLICY "Ledger viewable by event participants and hosts"
    ON public.buy_in_ledger FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.event_participants ep
            JOIN public.events e ON e.id = ep.event_id
            WHERE ep.id = participant_id
            AND (
                ep.user_id = auth.uid()
                OR e.host_id = auth.uid()
                OR e.is_private = FALSE
            )
        )
    );

CREATE POLICY "Hosts can add ledger entries"
    ON public.buy_in_ledger FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_participants ep
            JOIN public.events e ON e.id = ep.event_id
            WHERE ep.id = participant_id
            AND e.host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can update ledger entries"
    ON public.buy_in_ledger FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.event_participants ep
            JOIN public.events e ON e.id = ep.event_id
            WHERE ep.id = participant_id
            AND e.host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can delete ledger entries"
    ON public.buy_in_ledger FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.event_participants ep
            JOIN public.events e ON e.id = ep.event_id
            WHERE ep.id = participant_id
            AND e.host_id = auth.uid()
        )
    );

-- ============================================
-- Function to sync buy_in_amount on participant
-- ============================================
-- Automatically updates event_participants.buy_in_amount
-- when ledger entries change

CREATE OR REPLACE FUNCTION sync_participant_buy_in()
RETURNS TRIGGER AS $$
DECLARE
    total_buy_in DECIMAL(10, 2);
    target_participant_id UUID;
BEGIN
    -- Get the participant ID based on operation
    IF TG_OP = 'DELETE' THEN
        target_participant_id := OLD.participant_id;
    ELSE
        target_participant_id := NEW.participant_id;
    END IF;
    
    -- Calculate total buy-in from all ledger entries
    SELECT COALESCE(SUM(amount), 0) INTO total_buy_in
    FROM public.buy_in_ledger
    WHERE participant_id = target_participant_id;
    
    -- Update participant's total buy-in
    UPDATE public.event_participants
    SET buy_in_amount = total_buy_in
    WHERE id = target_participant_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync on insert, update, delete
CREATE TRIGGER sync_buy_in_on_ledger_change
    AFTER INSERT OR UPDATE OR DELETE ON public.buy_in_ledger
    FOR EACH ROW EXECUTE FUNCTION sync_participant_buy_in();

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_buy_in_ledger_participant ON public.buy_in_ledger(participant_id);
CREATE INDEX idx_buy_in_ledger_created ON public.buy_in_ledger(created_at);

-- ============================================
-- Add cashed_out_at timestamp to participants
-- ============================================
-- Helpful for tracking when players left the game

ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS cashed_out_at TIMESTAMPTZ;


