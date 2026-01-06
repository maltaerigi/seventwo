'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CopyLinkButtonProps {
  url: string;
}

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Button
      variant="outline"
      className="mt-3 w-full"
      onClick={handleCopy}
    >
      {copied ? '✓ Copied!' : '📋 Copy Link'}
    </Button>
  );
}

