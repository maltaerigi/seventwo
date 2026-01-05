import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/constants';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-12 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt={APP_NAME}
              width={100}
              height={56}
              className="h-10 w-auto"
            />
          </div>

          {/* Links */}
          <nav className="flex gap-6 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Login
            </Link>
            <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              How It Works
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}

