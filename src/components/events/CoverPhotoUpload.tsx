'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface CoverPhotoUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  onFileSelect?: (file: File) => void;
}

// Predefined cover options for poker events
const PRESET_COVERS = [
  { id: 'felt-green', color: 'from-emerald-800 to-emerald-950', label: 'Classic Green' },
  { id: 'felt-blue', color: 'from-blue-800 to-blue-950', label: 'Blue Velvet' },
  { id: 'felt-red', color: 'from-red-800 to-red-950', label: 'Casino Red' },
  { id: 'dark', color: 'from-slate-800 to-slate-950', label: 'Dark Mode' },
  { id: 'gold', color: 'from-amber-700 to-amber-900', label: 'Gold Rush' },
];

export function CoverPhotoUpload({ value, onChange, onFileSelect }: CoverPhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    value?.startsWith('preset:') ? value.replace('preset:', '') : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedPreset(null);
    
    // Notify parent
    onFileSelect?.(file);
    onChange(url); // Temporary URL, will be replaced after upload
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setPreviewUrl(null);
    onChange(`preset:${presetId}`);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedPreset(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Cover Photo
      </label>

      {/* Preview Area */}
      <div 
        className={`relative aspect-[2/1] w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          previewUrl || selectedPreset 
            ? 'border-transparent' 
            : 'border-slate-300 dark:border-slate-600 hover:border-amber-500'
        }`}
      >
        {previewUrl ? (
          // Custom uploaded image
          <Image
            src={previewUrl}
            alt="Event cover"
            fill
            className="object-cover"
          />
        ) : selectedPreset ? (
          // Preset gradient
          <div className={`h-full w-full bg-gradient-to-br ${PRESET_COVERS.find(p => p.id === selectedPreset)?.color}`}>
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl">🃏</span>
            </div>
          </div>
        ) : (
          // Empty state
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Upload a cover photo</span>
          </button>
        )}

        {/* Remove button */}
        {(previewUrl || selectedPreset) && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Image
        </Button>
        <span className="text-sm text-slate-500">or choose a preset:</span>
      </div>

      {/* Preset options */}
      <div className="flex gap-2">
        {PRESET_COVERS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetSelect(preset.id)}
            className={`h-10 w-10 rounded-lg bg-gradient-to-br ${preset.color} ring-2 ring-offset-2 transition-all ${
              selectedPreset === preset.id 
                ? 'ring-amber-500' 
                : 'ring-transparent hover:ring-slate-300'
            }`}
            title={preset.label}
          />
        ))}
      </div>
    </div>
  );
}

