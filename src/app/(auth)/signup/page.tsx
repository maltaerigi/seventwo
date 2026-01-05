'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/events';
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'otp'>('info');

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  // Get E.164 format for Supabase
  const getE164Phone = () => {
    const digits = phone.replace(/\D/g, '');
    return `+1${digits}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Sign up with phone - Supabase will send OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: getE164Phone(),
        options: {
          data: {
            display_name: displayName.trim(),
            email: email.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      setStep('otp');
      toast.success('Verification code sent!');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: getE164Phone(),
        token: otp,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      // Update user metadata with email and display name
      if (data.user) {
        await supabase.auth.updateUser({
          email: email.trim(),
          data: {
            display_name: displayName.trim(),
          },
        });

        // Update profile
        await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
          })
          .eq('id', data.user.id);
      }

      toast.success('Account created! Welcome to Seventwo!');
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Invalid code. Please try again.');
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
        {step === 'info' ? (
          // Step 1: Enter info
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">Create Account</h1>
              <p className="mt-1 text-slate-400">Join the poker community</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="text-slate-300">Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
                  disabled={isLoading}
                  required
                />
              </div>

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
                <p className="mt-1 text-xs text-slate-500">For receipts and important updates</p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                <div className="mt-1.5 flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-600 bg-slate-700 px-3 text-sm text-slate-400">
                    +1
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    className="rounded-l-none border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
                    disabled={isLoading}
                    maxLength={14}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Used for quick sign-in</p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {isLoading ? 'Sending...' : 'Continue'}
              </Button>
            </form>

            {/* Login link */}
            <div className="mt-6 border-t border-slate-700 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-amber-400 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </>
        ) : (
          // Step 2: Enter OTP
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">Verify Phone</h1>
              <p className="mt-1 text-slate-400">
                Enter the code sent to {phone}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="text-slate-300">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="mt-1.5 text-center text-2xl tracking-widest border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
                  disabled={isLoading}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 flex justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('info');
                  setOtp('');
                }}
                className="text-slate-400 hover:text-white"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="text-amber-400 hover:underline disabled:opacity-50"
              >
                Resend code
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

