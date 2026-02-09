# AtomicTemplate API

This repository contains the backend API for AtomicTemplate - a modern Node.js/Express API built with TypeScript, featuring a clean architecture with repositories, validators, and comprehensive error handling.

## Features

- **Clean Architecture**: Separation of concerns with controllers, repositories, and services
- **Type Safety**: Full TypeScript support with strict mode enabled
- **Validation**: Zod-based request validation with custom validators
- **Error Handling**: Structured error handling with custom error classes
- **Logging**: Winston-based logging with file rotation
- **Testing**: Jest-based testing with ESM support
- **Authentication**: Supabase-based auth with JWT tokens
- **Database**: Supabase PostgreSQL with type-safe queries
- **Path Aliases**: Clean imports using `@` aliases (`@controllers`, `@utils`, etc.)

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm (or npm/yarn)
- Supabase account and project

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd skytech_node_bacckend
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only, for admin operations)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)

4. **Run database migrations**

```bash
# Set up your Postgres connection variables in .env
# Then run migrations from the supabase/migrations directory
```

5. **Start development server**

```bash
pnpm dev
```

The API will be available at `http://localhost:3000` (or your configured PORT).

The dev server uses **nodemon** for automatic restarts when you save files. Type `rs` to manually restart.

**For more development details, see [DEVELOPMENT.md](DEVELOPMENT.md)**

## Project Structure

```
src/
├── __tests__/          # Test utilities and setup
│   ├── helpers.ts      # Test helper functions
│   └── setup.ts        # Jest test setup
├── config/             # Configuration management
│   └── index.ts        # Environment config with Zod validation
├── controllers/        # Request handlers
│   ├── admin.controller.ts
│   ├── auth.controller.ts
│   ├── blog.controller.ts
│   ├── content.controller.ts
│   ├── session.controller.ts
│   └── upload.controller.ts
├── db/                 # Database clients and utilities
│   ├── index.ts        # Health checks and utilities
│   └── supabaseClient.ts
├── middleware/         # Express middleware
│   ├── auth.ts         # Authentication (requireAuth, optionalAuth)
│   ├── error.ts        # Error handling middleware
│   └── validate.ts     # Request validation middleware
├── repositories/       # Data access layer
│   ├── base.repository.ts
│   ├── blog.repository.ts
│   └── content.repository.ts
├── routes/             # API route definitions
│   ├── admin/
│   ├── auth/
│   ├── blog/
│   ├── content/
│   └── upload/
├── types/              # TypeScript type definitions
│   ├── blog.ts
│   └── content.ts
├── utils/              # Utility functions
│   ├── errors.ts       # Custom error classes
│   └── logger.ts       # Winston logger setup
├── validators/         # Zod validation schemas
│   ├── blog.validator.ts
│   └── content.validator.ts
├── app.ts             # Express app configuration
├── server.ts          # Server entry point
└── index.d.ts         # Global type declarations
```

## Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload

# Building
pnpm build            # Build for production (TypeScript + path alias resolution)

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
pnpm test:unit        # Run only unit tests
pnpm test:integration # Run only integration tests

# Code Quality
pnpm lint             # Run ESLint

# Production
pnpm start            # Start production server (requires build first)
```

## API Documentation

Comprehensive API documentation is available in [docs/API.md](docs/API.md).

### Main Endpoints

- **Authentication**: `/api/auth/*` - Login, register, logout
- **Blog Posts**: `/api/blog/*` - CRUD operations for blog posts
- **Content**: `/api/content/*` - Manage common content and pages
- **Admin**: `/api/admin/*` - Admin operations (user management)
- **Upload**: `/api/upload/*` - File upload to Supabase storage

## Architecture

This project follows a clean architecture pattern with clear separation of concerns:

1. **Routes** → Handle HTTP requests and delegate to controllers
2. **Controllers** → Contain business logic and orchestrate services
3. **Repositories** → Abstract data access layer (database operations)
4. **Validators** → Zod schemas for request validation
5. **Middleware** → Cross-cutting concerns (auth, error handling, validation)
6. **Utils** → Shared utilities (logging, custom errors)

See [docs/ARCHITECTURE_IMPROVEMENTS.md](docs/ARCHITECTURE_IMPROVEMENTS.md) for detailed architectural improvements.

## Environment Variables

### Required Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (for migrations)
PGHOST=your-db-host
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your-password
```

### Important Notes

- **Never commit** `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY` publicly
- `SUPABASE_ANON_KEY` is safe for client-side use
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - use only server-side
- Store secrets in your hosting provider's secret manager in production

## Testing

The project uses Jest with TypeScript and ESM support.

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Test Structure

- Unit tests are located alongside the code they test in `__tests__/` directories
- Integration tests have `.integration.test.ts` suffix
- Test helpers and mocks are in `src/__tests__/helpers.ts`
- Jest configuration is in `jest.config.js`

Current test coverage focuses on the repository layer with plans to expand to controllers and routes.

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of: import { logger } from '../../../utils/logger'
import { logger } from '@utils'

// Available aliases:
import { ... } from '@controllers'
import { ... } from '@db'
import { ... } from '@middleware'
import { ... } from '@repositories'
import { ... } from '@routes'
import { ... } from '@types'
import { ... } from '@utils'
import { ... } from '@validators'
import { ... } from '@config'
```

## Error Handling

The project uses custom error classes for structured error handling:

```typescript
import { ValidationError, NotFoundError, UnauthorizedError } from '@utils'

// Throw custom errors in your code
throw new NotFoundError('User not found')
throw new ValidationError('Invalid email format')
throw new UnauthorizedError('Invalid credentials')

// They're automatically handled by the error middleware
```

Available error classes:
- `AppError` (base class)
- `ValidationError` (422)
- `NotFoundError` (404)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `ConflictError` (409)
- `UnprocessableEntityError` (422)
- `ServiceUnavailableError` (503)
- `DatabaseError` (500)

## Logging

Winston logger is configured with:
- Console output for development
- File rotation for production
- Different log levels (error, warn, info, debug)
- Structured JSON logging

```typescript
import { logger } from '@utils'

logger.info('User logged in', { userId: user.id })
logger.error('Database error', { error: err.message })
logger.warn('Rate limit approaching', { ip: req.ip })
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript with strict mode
- Follow existing patterns (repositories, controllers, validators)
- Add tests for new features
- Use the configured ESLint rules
- Use barrel imports (`@utils`) instead of relative paths

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features and improvements.

## License

[Add your license here]

## Support

For questions or issues, please open an issue on GitHub.
