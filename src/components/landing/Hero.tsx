'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 py-20">
      {/* Background gradient inspired by poker felt */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 -z-10 opacity-30" 
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} 
      />

      <div className="mx-auto max-w-4xl text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Seventwo - 7 of Spades and 2 of Hearts"
            width={280}
            height={160}
            className="mx-auto"
            priority
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Your Poker Night,
          <br />
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Simplified
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Create events, track buy-ins, and settle debts automatically. 
          No more spreadsheets, no more Venmo confusion.
        </p>
        
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button 
            asChild 
            size="lg" 
            className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400 sm:w-auto"
          >
            <Link href="/events/create">Create Event</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="w-full border-slate-600 bg-transparent text-white hover:bg-slate-800 sm:w-auto"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
        
        <p className="mt-6 text-sm text-slate-400">
          Free forever • No credit card required
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
