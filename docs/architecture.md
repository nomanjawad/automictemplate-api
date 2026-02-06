# Architecture

## Project Structure

```
src/
├── app.ts                # Express app configuration
├── server.ts             # Server entry point
├── index.d.ts            # Express Request type extensions
├── config/               # Configuration with validation
│   └── index.ts
├── controllers/          # Request handlers
│   ├── index.ts          # Barrel exports
│   ├── admin.controller.ts
│   ├── auth.controller.ts
│   ├── blog.controller.ts
│   ├── content.controller.ts
│   ├── session.controller.ts
│   └── upload.controller.ts
├── db/                   # Database layer
│   ├── index.ts          # Health checks & exports
│   └── supabaseClient.ts
├── middleware/           # Express middleware
│   ├── index.ts          # Barrel exports
│   ├── auth.ts           # JWT verification
│   ├── error.ts          # Error handler
│   └── validate.ts       # Zod validation
├── repositories/         # Data access layer
│   ├── index.ts          # Barrel exports
│   ├── base.repository.ts
│   ├── blog.repository.ts
│   └── content.repository.ts
├── routes/               # Route definitions
│   ├── index.ts          # Main router
│   ├── admin/
│   ├── auth/
│   ├── blog/
│   ├── content/
│   └── upload/
├── types/                # TypeScript type definitions
│   ├── index.ts
│   ├── blog.ts
│   └── content.ts
├── utils/                # Utilities
│   ├── index.ts
│   ├── errors.ts         # Custom error classes
│   └── logger.ts         # Winston logger
└── validators/           # Zod validation schemas
    ├── index.ts
    ├── blog.validator.ts
    └── content.validator.ts
```

## Path Aliases

Import using aliases instead of relative paths:

```typescript
import { register, login } from '@controllers'
import { supabase } from '@db'
import { requireAuth } from '@middleware'
import { BlogRepository } from '@repositories'
import { NotFoundError } from '@utils'
import { CreateBlogPostValidator } from '@validators'
import { config } from '@config'
```

| Alias | Maps to |
|-------|---------|
| `@controllers` | `src/controllers/index.ts` |
| `@db` | `src/db/index.ts` |
| `@middleware` | `src/middleware/index.ts` |
| `@repositories` | `src/repositories/index.ts` |
| `@types` | `src/types/index.ts` |
| `@utils` | `src/utils/index.ts` |
| `@validators` | `src/validators/index.ts` |
| `@config` | `src/config/index.ts` |
| `@routes/*` | `src/routes/*` |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Validation | Zod + @atomictemplate/validations |
| Logging | Winston + Morgan |
| File Upload | Multer |
| Dev Runner | tsx |

## Security

- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - 100 requests per 15 minutes
- **JWT Authentication** - Supabase Auth tokens
- **RLS** - Row Level Security on database

## Data Flow

```
Request → Express → Middleware → Controller → Repository → Supabase → Response
                       ↓
               [auth, validate, error]
```

## Repository Pattern

Controllers use repositories for data access:

```typescript
// Controller calls repository
const blogRepo = new BlogRepository()
const posts = await blogRepo.findPublished()
```
