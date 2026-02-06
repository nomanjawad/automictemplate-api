# Getting Started

## Prerequisites

- Node.js >= 20
- pnpm (recommended) or npm
- Supabase account and project

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✓ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✓ | Public anon key from Supabase |
| `PORT` | | Server port (default: 3000) |
| `SUPABASE_STORAGE_BUCKET` | | Storage bucket name (default: images) |
| `CORS_ALLOWED_ORIGIN` | | CORS origin (default: *) |

## Running the Server

```bash
# Development (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start

# Run tests
pnpm test
pnpm test:coverage
```

## Verify Setup

```bash
curl http://localhost:3000/api/health
```

## Database Migrations

Apply migrations using Supabase CLI:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Next Steps

1. Read [API Reference](./api-reference.md) for endpoints
2. Check [Architecture](./architecture.md) for project structure
3. See [Roadmap](./roadmap.md) for planned features
