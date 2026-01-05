# Seventwo 🃏

The ultimate poker night companion. Create events, track buy-ins, and settle debts with ease.

## Overview

Seventwo is a webapp for managing poker nights, allowing users to host events, check in, track buy-ins/cash-outs, and automatically calculate who owes whom. Inspired by Partiful's event management approach.

## Features (MVP)

- 🎯 **Landing Page** - Marketing-focused homepage with "How it works" and newsletter signup
- 🔐 **Magic Link Auth** - Passwordless authentication via email
- 🎲 **Event Management** - Create poker nights with rules (blinds, seats)
- 🔗 **Shareable Links** - Each event gets a unique URL for easy sharing
- ✅ **Check-in System** - Track who's at the game
- 💰 **Buy-in/Cash-out Tracking** - Record financial transactions
- 📊 **Debt Calculation** - Automatically calculate who owes whom
- 👤 **User Profiles** - Track your performance over time

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: Supabase Auth (Magic Link)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/seventwo.git
cd seventwo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to Project Settings → API to get your credentials
3. Run the database migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
seventwo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, callback)
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── events/        # Event management
│   │   │   └── profile/       # User profile
│   │   ├── api/               # API routes
│   │   └── e/[slug]/          # Public event pages
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── common/            # Shared components
│   │   ├── landing/           # Landing page components
│   │   └── events/            # Event components
│   ├── lib/                   # Utilities
│   │   ├── supabase/          # Supabase client
│   │   ├── calculations/      # Debt calculation
│   │   ├── validations/       # Zod schemas
│   │   └── utils/             # General utilities
│   ├── types/                 # TypeScript types
│   ├── hooks/                 # Custom React hooks
│   └── constants/             # App constants
├── supabase/
│   └── migrations/            # Database migrations
└── docs/                      # Documentation
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details.

## License

MIT
