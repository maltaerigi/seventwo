'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Step = 'phone' | 'otp';

// Wrapper component to handle Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 px-4 py-12">
      <div className="h-[114px] w-[200px] animate-pulse rounded bg-slate-700/50" />
      <div className="mt-8 h-[500px] w-full max-w-sm animate-pulse rounded-xl bg-slate-800/50" />
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/events';
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mockCode, setMockCode] = useState<string | null>(null);

  // Format phone for display
  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+1${phone}` }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      // Store mock code for development display
      if (data.mockCode) {
        setMockCode(data.mockCode);
      }

      setStep('otp');
      toast.success('Verification code sent!');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+1${phone}`, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If user doesn't exist, redirect to signup
        if (data.isNewUser || data.error?.includes('not found')) {
          toast.error('No account found. Please sign up first.');
          router.push(`/signup?phone=${phone}`);
          return;
        }
        throw new Error(data.error || 'Failed to verify code');
      }

      // If redirectUrl is provided, use it (fallback for session creation)
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      toast.success('Welcome back!');
      // Use full page navigation to ensure cookies are read properly
      window.location.href = redirectTo;
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setOtp('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+1${phone}` }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      if (data.mockCode) {
        setMockCode(data.mockCode);
      }

      toast.success('New code sent!');
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend code');
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
        {step === 'phone' ? (
          // Step 1: Enter Phone Number
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="mt-1 text-slate-400">Enter your phone number to sign in</p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                <div className="mt-1.5 flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-600 bg-slate-700 px-3 text-slate-400">
                    +1
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    placeholder="(555) 555-5555"
                    className="rounded-l-none border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {isLoading ? 'Sending...' : 'Send Code'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              We&apos;ll text you a code to verify your number.
            </p>

            {/* Sign up link */}
            <div className="mt-6 border-t border-slate-700 pt-6 text-center">
              <p className="text-sm text-slate-400">
                New to Seventwo?{' '}
                <Link href="/signup" className="text-amber-400 hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </>
        ) : (
          // Step 2: Enter OTP
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Enter verification code</h2>
              <p className="mt-2 text-slate-400">
                Sent to <strong className="text-white">+1 {formatPhoneDisplay(phone)}</strong>
              </p>
              {mockCode && (
                <p className="mt-2 rounded bg-amber-500/20 px-3 py-1 text-sm text-amber-400">
                  Dev mode: Use code <strong>{mockCode}</strong>
                </p>
              )}
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="text-slate-300">6-digit code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="mt-1.5 border-slate-600 bg-slate-700/50 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-500"
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {isLoading ? 'Verifying...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-sm text-slate-400 hover:text-white disabled:opacity-50"
              >
                Didn&apos;t get the code? Resend
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setMockCode(null);
                }}
                className="text-sm text-slate-400 hover:text-white"
              >
                ← Use a different number
              </button>
            </div>
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
