/**
 * Supabase Client Exports
 * 
 * Re-exports the appropriate client based on the environment.
 * 
 * In Client Components (browser):
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * ```
 * 
 * In Server Components, Route Handlers, Server Actions:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server';
 * ```
 * 
 * In Middleware:
 * ```ts
 * import { updateSession } from '@/lib/supabase/middleware';
 * ```
 */

// Export browser client for use in client components
export { createClient as createBrowserClient } from './client';

// Export server client for use in server components
export { createClient as createServerClient } from './server';

// Export middleware helper
export { updateSession } from './middleware';

