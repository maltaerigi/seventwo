# Contributing to Seventwo

Thank you for your interest in contributing to Seventwo! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Start development server
npm run dev
```

## Code Style

### TypeScript

- Use TypeScript strict mode (already configured)
- Always provide explicit types for function parameters
- Use type inference for local variables when obvious
- Prefer interfaces over types for object shapes
- Export types that might be reused

```typescript
// Good
export interface Event {
  id: string;
  title: string;
}

function createEvent(data: CreateEventInput): Promise<Event> {
  const result = validateInput(data); // Type inferred
  return supabase.from('events').insert(data);
}

// Avoid
function createEvent(data: any) { ... }
```

### React Components

- Use functional components with hooks
- Use named exports for components
- Keep components focused and small
- Extract reusable logic into hooks
- Co-locate related files

```typescript
// Good
export function EventCard({ event, onSelect }: EventCardProps) {
  return (
    <Card>
      <CardHeader>{event.title}</CardHeader>
    </Card>
  );
}

// Avoid
export default function(props) { ... }
```

### File Organization

```
components/events/
├── EventCard.tsx          # Component
├── EventCard.test.tsx     # Tests (if any)
├── useEventActions.ts     # Related hook
└── index.ts               # Re-exports
```

### Imports

Order imports as follows:
1. React/Next.js
2. External libraries
3. Internal aliases (@/...)
4. Relative imports
5. Types (at the end)

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { z } from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

import { EventCard } from './EventCard';

import type { Event } from '@/types';
```

## Commit Messages

Follow the conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(events): add event creation form
fix(auth): handle expired magic links
docs: update setup instructions
refactor(calculations): simplify debt algorithm
```

## Pull Request Process

1. **Before submitting:**
   - Run `npm run lint` and fix any errors
   - Run `npm run build` to ensure it builds
   - Test your changes manually
   - Update documentation if needed

2. **PR Description:**
   - Describe what changes you made
   - Explain why the changes are needed
   - Include screenshots for UI changes
   - Reference related issues

3. **Review process:**
   - PRs require at least one approval
   - Address review comments
   - Keep PRs focused and small when possible

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring

Examples:
```
feature/event-creation
fix/login-redirect
docs/setup-guide
refactor/debt-calculation
```

## Testing

Currently, the project doesn't have extensive test coverage. When adding tests:

```typescript
// Component tests: ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  it('renders event title', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Poker Night')).toBeInTheDocument();
  });
});

// Utility tests: utilityName.test.ts
import { calculateDebts } from './debt';

describe('calculateDebts', () => {
  it('returns empty array when no participants', () => {
    const result = calculateDebts([]);
    expect(result.debts).toEqual([]);
  });
});
```

## Working on Features

### Adding a New Feature

1. Check if an issue exists, or create one
2. Create a feature branch
3. Implement the feature
4. Add any necessary types to `src/types/`
5. Add validation schemas if needed
6. Update documentation
7. Submit PR

### Working on Different Areas

**UI Components:**
- Add to appropriate folder in `components/`
- Use shadcn/ui as base when possible
- Follow existing component patterns

**API Routes:**
- Add to `app/api/`
- Always validate input with Zod
- Return consistent response format
- Handle errors gracefully

**Database Changes:**
- Add new migration file in `supabase/migrations/`
- Update TypeScript types in `src/types/database.ts`
- Update RLS policies if needed

## Questions?

If you have questions about contributing, feel free to:
- Open an issue for discussion
- Ask in pull request comments

Thank you for contributing!

