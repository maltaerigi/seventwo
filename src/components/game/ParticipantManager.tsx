'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ParticipantCard } from './ParticipantCard';
import { BuyInModal } from './BuyInModal';
import { CashOutModal } from './CashOutModal';
import { EventLedger } from './EventLedger';
import { SettlementView } from './SettlementView';
import { GameControls } from './GameControls';
import type { ParticipantWithLedger, EventStatus } from '@/types';

interface ParticipantManagerProps {
  eventId: string;
  eventStatus: EventStatus;
  isHost: boolean;
  participants: ParticipantWithLedger[];
  defaultBuyIn?: number;
}

export function ParticipantManager({
  eventId,
  eventStatus,
  isHost,
  participants: initialParticipants,
  defaultBuyIn = 100,
}: ParticipantManagerProps) {
  const router = useRouter();
  const [participants] = useState(initialParticipants);
  
  // Modal state
  const [buyInModalOpen, setBuyInModalOpen] = useState(false);
  const [cashOutModalOpen, setCashOutModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithLedger | null>(null);

  const handleBuyIn = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      setSelectedParticipant(participant);
      setBuyInModalOpen(true);
    }
  }, [participants]);

  const handleCashOut = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      setSelectedParticipant(participant);
      setCashOutModalOpen(true);
    }
  }, [participants]);

  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Game Controls (Start/End) */}
      <GameControls
        eventId={eventId}
        eventStatus={eventStatus}
        isHost={isHost}
        onStatusChange={refreshData}
      />

      {/* Event Ledger */}
      <EventLedger
        participants={participants}
        eventStatus={eventStatus}
      />

      {/* Participants List */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
          👥 Players ({participants.length})
        </h3>
        
        {participants.length > 0 ? (
          <div className="space-y-3">
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                isHost={isHost}
                eventStatus={eventStatus}
                onBuyIn={handleBuyIn}
                onCashOut={handleCashOut}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No players have joined yet.
          </p>
        )}
      </div>

      {/* Settlement View */}
      <SettlementView
        eventId={eventId}
        isHost={isHost}
        eventStatus={eventStatus}
        onSettled={refreshData}
      />

      {/* Modals */}
      <BuyInModal
        open={buyInModalOpen}
        onOpenChange={setBuyInModalOpen}
        participant={selectedParticipant}
        eventId={eventId}
        defaultAmount={defaultBuyIn}
        onSuccess={refreshData}
      />

      <CashOutModal
        open={cashOutModalOpen}
        onOpenChange={setCashOutModalOpen}
        participant={selectedParticipant}
        eventId={eventId}
        onSuccess={refreshData}
      />
    </div>
  );
}

