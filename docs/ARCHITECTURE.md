# Architecture Overview

This document describes the technical architecture of Seventwo.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │    Future: React    │ │
│  │  (Next.js)  │  │    (PWA)    │  │    Native App       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          └────────────────┼────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Next.js App Router                     │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────┐  │   │
│  │  │ Server        │ │ API Routes    │ │ Middleware│  │   │
│  │  │ Components    │ │ /api/*        │ │ (Auth)    │  │   │
│  │  └───────────────┘ └───────────────┘ └───────────┘  │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Supabase                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │   │
│  │  │PostgreSQL│ │   Auth   │ │ Storage  │ │Realtime│  │   │
│  │  │ Database │ │ (Magic   │ │ (Photos) │ │(Future)│  │   │
│  │  │          │ │  Link)   │ │          │ │        │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                         Server                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Next.js App Router

We use Next.js 14+ with the App Router for:
- Server Components by default (better performance)
- Built-in API routes
- File-based routing
- Middleware for auth protection
- Easy deployment to Vercel

### 2. Supabase

Chosen for:
- PostgreSQL database with full SQL support
- Built-in authentication (magic links)
- Row Level Security (RLS) for data protection
- File storage for event photos
- Real-time subscriptions (future)
- Generous free tier

### 3. TypeScript Strict Mode

Enabled strict TypeScript for:
- Catch bugs at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

### 4. Component Architecture

```
components/
├── ui/           # shadcn/ui base components
├── common/       # Shared, reusable components
├── landing/      # Landing page specific
├── events/       # Event feature components
├── auth/         # Auth related components
└── profile/      # Profile feature components
```

**Guidelines:**
- Components in `ui/` are from shadcn/ui (don't modify directly)
- Components in `common/` should be generic and reusable
- Feature folders (`events/`, `profile/`) contain domain-specific components

### 5. Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Client    │────▶│  API Route   │────▶│   Supabase    │
│  Component  │◀────│  (Validate)  │◀────│   (RLS)       │
└─────────────┘     └──────────────┘     └───────────────┘
```

1. **Client Component** makes request to API route
2. **API Route** validates input with Zod
3. **Supabase** handles data with RLS policies
4. Response flows back through the chain

### 6. Authentication Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  Login   │───▶│ Supabase     │───▶│    Email     │
│  Page    │    │ Auth (OTP)   │    │  (Magic Link)│
└──────────┘    └──────────────┘    └──────────────┘
                      │
                      ▼
┌──────────┐    ┌──────────────┐
│  Logged  │◀───│  Callback    │
│  In      │    │  Handler     │
└──────────┘    └──────────────┘
```

### 7. Database Schema

See `supabase/migrations/001_initial_schema.sql` for the full schema.

**Core Tables:**
- `profiles` - User profiles (extends Supabase auth)
- `events` - Poker events/game nights
- `event_participants` - Who played in which event, with results
- `event_transactions` - Debts between users
- `newsletter_subscribers` - Email list

**Key Relationships:**
```
profiles ──┬── events (host)
           │
           └── event_participants ──── events
                     │
                     └── event_transactions (from_user, to_user)
```

### 8. Validation Strategy

Two-layer validation:
1. **Client-side**: Zod schemas in forms (instant feedback)
2. **Server-side**: Same Zod schemas in API routes (security)

```typescript
// Shared schema
const createEventSchema = z.object({...});

// Client: Form validation
const form = useForm({ resolver: zodResolver(createEventSchema) });

// Server: API validation
const result = createEventSchema.safeParse(body);
```

### 9. Security

**Row Level Security (RLS):**
- All tables have RLS enabled
- Policies enforce who can read/write data
- Users can only modify their own data
- Hosts can manage their events

**Middleware:**
- Protects dashboard routes
- Refreshes auth sessions
- Redirects unauthenticated users

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EventCard.tsx` |
| Utilities | camelCase | `formatCurrency.ts` |
| Constants | UPPER_SNAKE | `MAX_SEATS` |
| Types | PascalCase | `Event`, `EventInsert` |
| API Routes | lowercase | `route.ts` |
| Pages | lowercase | `page.tsx` |

## Future Considerations

### Mobile App
- React Native with Expo
- Share logic via API routes
- Progressive Web App as interim

### Physical Product Integration
- API endpoints for hardware communication
- WebSocket for real-time updates
- Separate data pipeline for card/chip tracking

### Scaling
- Edge functions for global performance
- Redis for caching (if needed)
- Database indexing optimized for queries

