# User API Documentation

## Overview

The User API provides endpoints for user authentication, profile management, and user listing. The API follows a **frontend-driven authorization model** where the backend acts as a data layer without enforcing permissions. The frontend is responsible for controlling what data users can see and modify based on their role.

## Architecture

- **Base URL**: `/api/user`
- **Authentication**: JWT tokens via Supabase
- **Authorization**: Frontend-controlled via user role
- **Database**: PostgreSQL (Supabase)
- **User Table**: `public.users`

## User Object Schema

```typescript
{
  id: string                    // UUID
  email: string                 // User email
  full_name?: string           // User's full name
  role: 'user' | 'admin' | 'moderator'  // User role
  bio?: string                 // User bio/description
  avatar_url?: string          // Profile picture URL
  metadata?: object            // Custom metadata (JSON)
  created_at: string          // Timestamp
  updated_at: string          // Timestamp
}
```

---

## Endpoints

### 1. Register User (Public)

Register a new user account.

**Endpoint**: `POST /api/user/register`

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "role": "user"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 6 characters |
| full_name | string | No | User's full name |
| role | string | No | Default: "user". Options: "user", "admin", "moderator" |

**Response** (200):
```json
{
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": null,
    "created_at": "2026-02-09T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "session": { }
}
```

**Error** (409):
```json
{
  "error": "User already exists with this email",
  "code": "23505",
  "details": { }
}
```

---

### 2. Login User (Public)

Authenticate user with email and password.

**Endpoint**: `POST /api/user/login`

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User email |
| password | string | Yes | User password |

**Response** (200):
```json
{
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": null,
    "bio": null,
    "created_at": "2026-02-09T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "session": { }
}
```

**Error** (401):
```json
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "details": { }
}
```

---

### 3. Get All Users - Public (No Auth)

Get a list of all users with limited public fields. **No authentication required**.

**Endpoint**: `GET /api/user/public/all`

**Authentication**: None (Public)

**Query Parameters**: None

**Response** (200):
```json
{
  "users": [
    {
      "id": "user-uuid-123",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "created_at": "2026-02-09T10:30:00Z"
    },
    {
      "id": "user-uuid-456",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "created_at": "2026-02-08T15:22:00Z"
    }
  ],
  "total": 2
}
```

**Fields Returned**:
- `id` - User UUID
- `full_name` - Display name
- `email` - Email address
- `role` - User role
- `created_at` - Account creation date

**Error** (500):
```json
{
  "error": "Failed to fetch users",
  "code": "DATABASE_ERROR",
  "details": { }
}
```

---

### 4. Get Current User Profile (Protected)

Get the authenticated user's own profile.

**Endpoint**: `GET /api/user/profile`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**: None

**Response** (200):
```json
{
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software engineer",
    "metadata": { "theme": "dark", "notifications": true },
    "created_at": "2026-02-09T10:30:00Z",
    "updated_at": "2026-02-09T11:45:00Z"
  }
}
```

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

---

### 5. Get User by ID (Protected)

Retrieve any user's information by their ID.

**Endpoint**: `GET /api/user/:id`

**Authentication**: Required (Bearer token)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User UUID |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "user": {
    "id": "user-uuid-456",
    "email": "jane@example.com",
    "full_name": "Jane Smith",
    "role": "admin",
    "avatar_url": "https://example.com/jane-avatar.jpg",
    "bio": "Administrator",
    "metadata": { "department": "management" },
    "created_at": "2026-02-08T15:22:00Z",
    "updated_at": "2026-02-08T16:10:00Z"
  }
}
```

**Frontend Note**: The API returns complete user data. Your frontend should validate the requesting user's role and decide whether to display sensitive information.

**Error** (404):
```json
{
  "error": "User not found",
  "code": "PGRST116",
  "details": { }
}
```

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

---

### 6. Get All Users (Protected)

Get complete data for all users. **Internal use - for authenticated users only**.

**Endpoint**: `GET /api/user`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**: None

**Response** (200):
```json
{
  "users": [
    {
      "id": "user-uuid-123",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "avatar_url": null,
      "bio": null,
      "metadata": null,
      "created_at": "2026-02-09T10:30:00Z",
      "updated_at": "2026-02-09T10:30:00Z"
    },
    {
      "id": "user-uuid-456",
      "email": "jane@example.com",
      "full_name": "Jane Smith",
      "role": "admin",
      "avatar_url": "https://example.com/jane-avatar.jpg",
      "bio": "Administrator",
      "metadata": { "department": "management" },
      "created_at": "2026-02-08T15:22:00Z",
      "updated_at": "2026-02-08T16:10:00Z"
    }
  ],
  "total": 2
}
```

**Frontend Note**: Contains ALL user data. Frontend should enforce role-based filtering to show only appropriate information to each user.

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

---

### 7. Update Own Profile (Protected)

Update the authenticated user's own profile. Users can only update their own profile, not others.

**Endpoint**: `PUT /api/user/profile`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "full_name": "John Updated",
  "bio": "Updated bio",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "metadata": { "theme": "light", "notifications": false }
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| full_name | string | No | User's full name |
| bio | string | No | User bio/description |
| avatar_url | string | No | Profile picture URL |
| metadata | object | No | Custom metadata (JSON) |

**Note**: Users **cannot** update: email, password, or role through this endpoint.

**Response** (200):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "full_name": "John Updated",
    "role": "user",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "bio": "Updated bio",
    "metadata": { "theme": "light", "notifications": false },
    "created_at": "2026-02-09T10:30:00Z",
    "updated_at": "2026-02-09T12:00:00Z"
  }
}
```

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

**Error** (400):
```json
{
  "error": "At least one field must be provided for update",
  "code": "BAD_REQUEST",
  "details": { }
}
```

---

### 8. Delete Own Account (Protected)

Permanently delete the authenticated user's account. This will delete the user from `auth.users` which cascades to `public.users`.

**Endpoint**: `DELETE /api/user/profile`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**: None

**Response** (200):
```json
{
  "message": "Account deleted successfully"
}
```

**Frontend Note**: After deletion, user's session will be invalid. Redirect to login page.

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

**Error** (500):
```json
{
  "error": "Failed to delete account",
  "code": "INTERNAL_SERVER_ERROR",
  "details": { }
}
```

---

### 9. Check Session (Protected)

Verify if the current session is valid.

**Endpoint**: `GET /api/user/session`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "...",
    "user": {
      "id": "user-uuid-123",
      "email": "user@example.com",
      "role": "user"
    }
  },
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": null,
    "bio": null,
    "metadata": null,
    "created_at": "2026-02-09T10:30:00Z",
    "updated_at": "2026-02-09T10:30:00Z"
  }
}
```

**Error** (200 - No Session):
```json
{
  "session": null,
  "user": null
}
```

---

### 10. Logout (Protected)

Logout the current user and invalidate their session.

**Endpoint**: `POST /api/user/logout`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**: None

**Response** (200):
```json
{
  "message": "Logout successful"
}
```

**Frontend Note**: Clear stored token from local storage/cookies after logout.

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

---

## Authentication Flow

### 1. Register / Login

```
POST /api/user/register  (or POST /api/user/login)
    ↓
Returns: { user, token, session }
    ↓
Store token in localStorage / sessionStorage / cookies
    ↓
Use token in Authorization header: "Bearer <token>"
```

### 2. Make Authenticated Requests

```
GET /api/user/profile
Headers: {
  "Authorization": "Bearer <stored_token>"
}
    ↓
Backend verifies token with Supabase
    ↓
Returns user data
```

### 3. Handle Token Expiration

```
If request returns 401 Unauthorized
    ↓
Redirect to login page
    ↓
Clear stored token
```

---

## Error Codes Reference

| Code | HTTP Status | Meaning | Action |
|------|------------|---------|--------|
| UNAUTHORIZED | 401 | Invalid/missing token | Redirect to login |
| BAD_REQUEST | 400 | Invalid request data | Check request body |
| CONFLICT | 409 | Email already exists | Try different email |
| NOT_FOUND | 404 | User/resource not found | Verify ID |
| DATABASE_ERROR | 500 | Database error | Retry or contact support |
| INTERNAL_SERVER_ERROR | 500 | Server error | Retry or contact support |

---

## Frontend Authorization Model

This API uses a **frontend-driven authorization** approach:

1. **Backend Role**: Acts as a data layer - returns all requested data without permission checks
2. **Frontend Role**: Controls what users can see and do based on their role
3. **Trust Model**: System trusts frontend to enforce permissions
4. **Benefits**:
   - More flexible permission system
   - Easier to add features without backend changes
   - Simpler API endpoints

### Example: Role Hierarchy

```
User Permissions:
  - View own profile
  - Update own profile
  - View public user list
  - View any user by ID (but frontend hides sensitive data)

Moderator Permissions:
  - All user permissions
  - View full user details
  - Manage content (pages, blog posts)

Admin Permissions:
  - All permissions
  - Manage all users
  - System settings
```

**Important**: Always validate permission on frontend before showing sensitive data or allowing actions!

---

## Response Format

All responses follow this structure:

**Success** (2xx):
```json
{
  "user": { ... },        // Single user object
  "users": [ ... ],       // Array of users
  "message": "...",       // Success message
  "session": { ... },     // Session data
  "token": "...",         // JWT token
}
```

**Error** (4xx, 5xx):
```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error context
  }
}
```

---

## Rate Limiting

Currently no rate limiting is configured. Add rate limiting middleware if needed.

---

## CORS

CORS is enabled for all origins. Configure in production for security.

---

## Tips for Frontend

1. **Token Storage**: Store JWT token in secure location (not public localStorage for sensitive apps)
2. **Token Refresh**: Implement refresh token logic if tokens expire
3. **User Role**: Always cache user role after login to make authorization checks faster
4. **Public Endpoint**: Use `GET /api/user/public/all` for public user listings without auth
5. **Private Data**: Fetch `GET /api/user/:id` for full user data, but only display what their role allows
6. **Session Check**: Call `GET /api/user/session` on app load to verify session validity
7. **Error Handling**: Check error codes to provide user-friendly error messages
8. **Metadata**: Use metadata field to store user preferences, settings, etc.

---

## Database Schema

The user data is stored in `public.users` table with the following structure:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  bio TEXT,
  avatar_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

---

## Questions?

Contact backend team for API support or feature requests.
