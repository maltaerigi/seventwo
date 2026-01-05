# Development Workflow

This document outlines the workflow for parallel development on Seventwo.

## Branching Strategy

We use a **feature branch workflow** for parallel development:

```
main (production-ready)
  ├── feature/event-creation
  ├── feature/auth-flow
  ├── feature/participant-management
  └── feature/payment-integration
```

## Branch Naming Convention

- `feature/description` - New features (e.g., `feature/event-creation`)
- `fix/description` - Bug fixes (e.g., `fix/login-redirect`)
- `refactor/description` - Code improvements (e.g., `refactor/debt-calculation`)

## Workflow Steps

### 1. Starting a New Feature

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create a new feature branch
git checkout -b feature/your-feature-name

# Start working...
```

### 2. Working in Parallel

**Important:** Before starting work each day:

```bash
# Pull latest changes from main
git checkout main
git pull origin main

# Rebase your feature branch on top of main
git checkout feature/your-feature-name
git rebase main
```

This ensures your branch has the latest code and reduces merge conflicts.

### 3. Committing Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat(events): add event creation form"

# Push to remote
git push origin feature/your-feature-name
```

### 4. Handling Conflicts

If you encounter conflicts during rebase:

```bash
# Resolve conflicts in your editor
# Then continue the rebase
git add .
git rebase --continue
```

### 5. Merging to Main

When your feature is complete:

```bash
# Make sure your branch is up to date
git checkout feature/your-feature-name
git rebase main

# Switch to main
git checkout main

# Merge your feature
git merge feature/your-feature-name

# Push to remote
git push origin main
```

## Working on Different Features Simultaneously

### Example: Two developers working in parallel

**Developer A** (working on event creation):
```bash
git checkout -b feature/event-creation
# Work on event creation...
git commit -m "feat(events): add event form"
```

**Developer B** (working on auth):
```bash
git checkout -b feature/auth-flow
# Work on auth...
git commit -m "feat(auth): implement magic link"
```

Both can work independently without conflicts!

## File Ownership Guidelines

To minimize conflicts, try to work on different files/folders:

- **Frontend components**: `src/components/`
- **API routes**: `src/app/api/`
- **Database**: `supabase/migrations/`
- **Types**: `src/types/`
- **Utilities**: `src/lib/`

## Communication

Before starting a major feature:
1. Check if someone else is working on related code
2. Coordinate on shared files (like `types/database.ts`)
3. Update documentation if you change architecture

## Best Practices

1. **Keep branches small** - One feature per branch
2. **Commit often** - Small, logical commits
3. **Pull before push** - Always rebase on main first
4. **Test before merge** - Make sure your code works
5. **Update docs** - If you change how things work

## Quick Reference

```bash
# Create feature branch
git checkout -b feature/name

# Update with latest main
git checkout main && git pull && git checkout feature/name && git rebase main

# Commit changes
git add . && git commit -m "feat: description"

# Push branch
git push origin feature/name

# Merge to main (when ready)
git checkout main && git merge feature/name && git push
```

