'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { APP_URL } from '@/constants';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/events';
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${APP_URL}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast.success('Check your email for the magic link!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image
          src="/logo.png"
          alt="Seventwo"
          width={200}
          height={114}
          priority
        />
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur">
        {emailSent ? (
          // Success state
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Check your email</h2>
            <p className="mt-2 text-slate-400">
              We sent a magic link to <strong className="text-white">{email}</strong>
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Click the link in the email to sign in. You can close this page.
            </p>
            <Button
              variant="ghost"
              className="mt-6 text-slate-400 hover:text-white"
              onClick={() => setEmailSent(false)}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          // Login form
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">Welcome</h1>
              <p className="mt-1 text-slate-400">Sign in with your email</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {isLoading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              No password needed. We&apos;ll email you a secure link.
            </p>
          </>
        )}
      </div>

      {/* Back to home */}
      <Link 
        href="/" 
        className="mt-8 text-sm text-slate-400 hover:text-white"
      >
        ← Back to home
      </Link>
    </div>
  );
}

