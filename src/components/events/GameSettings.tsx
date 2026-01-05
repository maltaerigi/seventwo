'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GameSettingsProps {
  smallBlind: number;
  bigBlind: number;
  maxSeats: number;
  onSmallBlindChange: (value: number) => void;
  onBigBlindChange: (value: number) => void;
  onMaxSeatsChange: (value: number) => void;
}

// Common blind structures for quick selection
const BLIND_PRESETS = [
  { small: 0.25, big: 0.50, label: '$0.25/$0.50' },
  { small: 0.50, big: 1.00, label: '$0.50/$1' },
  { small: 1.00, big: 2.00, label: '$1/$2' },
  { small: 2.00, big: 5.00, label: '$2/$5' },
];

const SEAT_OPTIONS = [6, 8, 9, 10];

export function GameSettings({
  smallBlind,
  bigBlind,
  maxSeats,
  onSmallBlindChange,
  onBigBlindChange,
  onMaxSeatsChange,
}: GameSettingsProps) {
  const handlePresetClick = (small: number, big: number) => {
    onSmallBlindChange(small);
    onBigBlindChange(big);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Game Settings
        </h3>

        {/* Blind Structure */}
        <div className="space-y-3">
          <Label className="text-slate-600 dark:text-slate-400">Blinds</Label>
          
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {BLIND_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetClick(preset.small, preset.big)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  smallBlind === preset.small && bigBlind === preset.big
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="smallBlind" className="sr-only">Small Blind</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="smallBlind"
                  type="number"
                  step="0.25"
                  min="0"
                  value={smallBlind}
                  onChange={(e) => onSmallBlindChange(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  placeholder="Small"
                />
              </div>
            </div>
            <span className="text-slate-400">/</span>
            <div className="flex-1">
              <Label htmlFor="bigBlind" className="sr-only">Big Blind</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="bigBlind"
                  type="number"
                  step="0.50"
                  min="0"
                  value={bigBlind}
                  onChange={(e) => onBigBlindChange(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  placeholder="Big"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Max Seats */}
      <div className="space-y-3">
        <Label className="text-slate-600 dark:text-slate-400">Max Players</Label>
        <div className="flex gap-2">
          {SEAT_OPTIONS.map((seats) => (
            <button
              key={seats}
              type="button"
              onClick={() => onMaxSeatsChange(seats)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                maxSeats === seats
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {seats}
            </button>
          ))}
          <div className="flex-1">
            <Input
              type="number"
              min="2"
              max="100"
              value={maxSeats}
              onChange={(e) => onMaxSeatsChange(parseInt(e.target.value) || 9)}
              className="h-10"
              placeholder="Custom"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

