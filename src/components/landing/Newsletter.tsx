'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Newsletter({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong');
    }
  };

  return (
    <section className={`px-4 py-24 ${isDark ? 'bg-emerald-950' : 'bg-slate-100 dark:bg-slate-800'}`}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          Stay in the Loop
        </h2>
        <p className={`mt-4 text-lg ${isDark ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
          Get updates on new features and poker tips. No spam, ever.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`h-12 flex-1 ${isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'}`}
            disabled={status === 'loading'}
          />
          <Button 
            type="submit"
            size="lg"
            className="h-12 bg-amber-500 text-slate-900 hover:bg-amber-400"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}

        <p className={`mt-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}

