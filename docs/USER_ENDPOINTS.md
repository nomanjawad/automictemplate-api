# User API Endpoints Documentation

Complete reference for all user-related API endpoints.

**Base URL:** `http://localhost:3000/api/user`

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
   - [Register](#1-register-user)
   - [Login](#2-login-user)
   - [Logout](#3-logout)
   - [Check Session](#4-check-session)
2. [User Profile Endpoints](#user-profile-endpoints)
   - [Get Own Profile](#5-get-own-profile)
   - [Update Own Profile](#6-update-own-profile)
   - [Delete Own Account](#7-delete-own-account)
3. [User Management Endpoints](#user-management-endpoints)
   - [Get All Users (Public)](#8-get-all-users-public)
   - [Get All Users (Protected)](#9-get-all-users-protected)
   - [Get User by ID](#10-get-user-by-id)
   - [Update User by ID](#11-update-user-by-id)
   - [Delete User by ID](#12-delete-user-by-id)

---

## Authentication Endpoints

### 1. Register User

Create a new user account.

**Endpoint:** `POST /api/user/register`  
**Authentication:** None (Public)

#### Request

```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePass123",
    "full_name": "John Doe",
    "role": "user"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 6 characters |
| full_name | string | No | User's display name |
| role | string | No | "user", "admin", or "moderator" (default: "user") |

#### Success Response (200)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": null,
    "bio": null,
    "metadata": null,
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session": {
    "access_token": "...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

#### Error Responses

**409 - Email Already Exists**
```json
{
  "error": "User already exists with this email",
  "code": "23505"
}
```

**400 - Invalid Data**
```json
{
  "error": "Invalid email format or password too short"
}
```

---

### 2. Login User

Authenticate and get access token.

**Endpoint:** `POST /api/user/login`  
**Authentication:** None (Public)

#### Request

```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePass123"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email |
| password | string | Yes | User's password |

#### Success Response (200)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": null,
    "bio": null,
    "metadata": null,
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session": {
    "access_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "..."
  }
}
```

#### Error Responses

**401 - Invalid Credentials**
```json
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

---

### 3. Logout

End the current user session.

**Endpoint:** `POST /api/user/logout`  
**Authentication:** Required

#### Request

```bash
curl -X POST http://localhost:3000/api/user/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Success Response (200)

```json
{
  "message": "Logout successful"
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

### 4. Check Session

Verify if the current session is valid.

**Endpoint:** `GET /api/user/session`  
**Authentication:** Required

#### Request

```bash
curl http://localhost:3000/api/user/session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Success Response (200)

```json
{
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "role": "user"
    }
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": null,
    "bio": null,
    "metadata": null,
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T10:30:00Z"
  }
}
```

#### No Session Response (200)

```json
{
  "session": null,
  "user": null
}
```

---

## User Profile Endpoints

### 5. Get Own Profile

Retrieve the authenticated user's profile.

**Endpoint:** `GET /api/user/profile`  
**Authentication:** Required

#### Request

```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Success Response (200)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software engineer and tech enthusiast",
    "metadata": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    },
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T12:15:00Z"
  }
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

### 6. Update Own Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/user/profile`  
**Authentication:** Required

#### Request

```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated Doe",
    "bio": "Senior Software Engineer",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "metadata": {
      "theme": "light",
      "notifications": false
    }
  }'
```

#### Request Body (All fields optional)

| Field | Type | Description |
|-------|------|-------------|
| email | string | New email (must be unique) |
| full_name | string | User's display name |
| bio | string | User biography |
| avatar_url | string | Profile picture URL |
| role | string | User role ("user", "admin", "moderator") |
| metadata | object | Custom JSON metadata |

#### Success Response (200)

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Updated Doe",
    "role": "user",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "bio": "Senior Software Engineer",
    "metadata": {
      "theme": "light",
      "notifications": false
    },
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T14:20:00Z"
  }
}
```

#### Error Responses

**409 - Email Already In Use**
```json
{
  "error": "This email is already in use by another account",
  "code": "23505"
}
```

**400 - Invalid Role**
```json
{
  "error": "Invalid role. Must be: user, admin, or moderator",
  "code": "BAD_REQUEST"
}
```

---

### 7. Delete Own Account

Permanently delete the authenticated user's account.

**Endpoint:** `DELETE /api/user/profile`  
**Authentication:** Required

#### Request

```bash
curl -X DELETE http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Success Response (200)

```json
{
  "message": "Account deleted successfully"
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**500 - Server Error**
```json
{
  "error": "Failed to delete account",
  "code": "INTERNAL_SERVER_ERROR"
}
```

---

## User Management Endpoints

### 8. Get All Users (Public)

Get a list of all users with basic public information. **No authentication required.**

**Endpoint:** `GET /api/user/public/all`  
**Authentication:** None (Public)

#### Request

```bash
curl http://localhost:3000/api/user/public/all
```

#### Success Response (200)

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "created_at": "2026-02-20T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "created_at": "2026-02-19T08:15:00Z"
    }
  ],
  "total": 2
}
```

**Note:** Returns limited public fields only (id, full_name, email, role, created_at).

---

### 9. Get All Users (Protected)

Get complete information for all users. **Requires authentication.**

**Endpoint:** `GET /api/user`  
**Authentication:** Required

#### Request

```bash
curl http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Success Response (200)

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "user",
      "avatar_url": "https://example.com/john-avatar.jpg",
      "bio": "Software engineer",
      "metadata": {
        "theme": "dark"
      },
      "created_at": "2026-02-20T10:30:00Z",
      "updated_at": "2026-02-20T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "jane@example.com",
      "full_name": "Jane Smith",
      "role": "admin",
      "avatar_url": "https://example.com/jane-avatar.jpg",
      "bio": "System administrator",
      "metadata": {
        "department": "management"
      },
      "created_at": "2026-02-19T08:15:00Z",
      "updated_at": "2026-02-19T08:15:00Z"
    }
  ],
  "total": 2
}
```

**Note:** Returns all user fields including avatar_url, bio, and metadata.

---

### 10. Get User by ID

Retrieve a specific user's information by their ID.

**Endpoint:** `GET /api/user/:id`  
**Authentication:** Required

#### Request

```bash
curl http://localhost:3000/api/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's UUID |

#### Success Response (200)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software engineer",
    "metadata": {
      "theme": "dark",
      "notifications": true
    },
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T10:30:00Z"
  }
}
```

#### Error Responses

**404 - User Not Found**
```json
{
  "error": "User not found",
  "code": "PGRST116"
}
```

**401 - Unauthorized**
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

### 11. Update User by ID

Update any user's information by their ID. Typically used by admins.

**Endpoint:** `PUT /api/user/:id`  
**Authentication:** Required

#### Request

```bash
curl -X PUT http://localhost:3000/api/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Modified",
    "role": "moderator",
    "bio": "Promoted to moderator"
  }'
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's UUID to update |

#### Request Body (All fields optional)

| Field | Type | Description |
|-------|------|-------------|
| email | string | New email (must be unique) |
| full_name | string | User's display name |
| bio | string | User biography |
| avatar_url | string | Profile picture URL |
| role | string | User role ("user", "admin", "moderator") |
| metadata | object | Custom JSON metadata |

#### Success Response (200)

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "full_name": "John Modified",
    "role": "moderator",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Promoted to moderator",
    "metadata": {
      "theme": "dark"
    },
    "created_at": "2026-02-20T10:30:00Z",
    "updated_at": "2026-02-20T15:45:00Z"
  }
}
```

#### Error Responses

**404 - User Not Found**
```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
}
```

**409 - Email Already In Use**
```json
{
  "error": "This email is already in use by another account",
  "code": "23505"
}
```

**400 - Invalid Role**
```json
{
  "error": "Invalid role. Must be: user, admin, or moderator",
  "code": "BAD_REQUEST"
}
```

---

### 12. Delete User by ID

Permanently delete a user account by their ID. Typically used by admins.

**Endpoint:** `DELETE /api/user/:id`  
**Authentication:** Required

#### Request

```bash
curl -X DELETE http://localhost:3000/api/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User's UUID to delete |

#### Success Response (200)

```json
{
  "message": "User deleted successfully"
}
```

#### Error Responses

**404 - User Not Found**
```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
}
```

**401 - Unauthorized**
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**500 - Server Error**
```json
{
  "error": "Failed to delete user account",
  "code": "INTERNAL_SERVER_ERROR"
}
```

---

## Quick Reference

### Endpoint Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/user/register` | No | Register new user |
| POST | `/api/user/login` | No | Login user |
| POST | `/api/user/logout` | Yes | Logout user |
| GET | `/api/user/session` | Yes | Check session validity |
| GET | `/api/user/profile` | Yes | Get own profile |
| PUT | `/api/user/profile` | Yes | Update own profile |
| DELETE | `/api/user/profile` | Yes | Delete own account |
| GET | `/api/user/public/all` | No | Get all users (public) |
| GET | `/api/user` | Yes | Get all users (full data) |
| GET | `/api/user/:id` | Yes | Get user by ID |
| PUT | `/api/user/:id` | Yes | Update user by ID |
| DELETE | `/api/user/:id` | Yes | Delete user by ID |

---

## Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 404 | Not Found | User/resource not found |
| 409 | Conflict | Duplicate email or data conflict |
| 500 | Internal Server Error | Server error occurred |

---

## Usage Examples

### Complete Authentication Flow

```javascript
// 1. Register a new user
const registerResponse = await fetch('http://localhost:3000/api/user/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'securePass123',
    full_name: 'New User'
  })
});
const { token, user } = await registerResponse.json();

// 2. Store token for future requests
localStorage.setItem('token', token);

// 3. Get user profile
const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const profileData = await profileResponse.json();

// 4. Update profile
const updateResponse = await fetch('http://localhost:3000/api/user/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bio: 'Updated bio',
    metadata: { theme: 'dark' }
  })
});

// 5. Logout
await fetch('http://localhost:3000/api/user/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
localStorage.removeItem('token');
```

### Admin Operations

```javascript
// Get all users (requires authentication)
const token = localStorage.getItem('token');
const usersResponse = await fetch('http://localhost:3000/api/user', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { users, total } = await usersResponse.json();

// Update another user (admin operation)
await fetch(`http://localhost:3000/api/user/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: 'moderator'
  })
});

// Delete a user (admin operation)
await fetch(`http://localhost:3000/api/user/${userId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Notes

1. **Token Management**: Store tokens securely (preferably in httpOnly cookies for production)
2. **Token Expiry**: Implement token refresh logic for long sessions
3. **Email Updates**: Email changes are synced to both `public.users` and `auth.users` tables
4. **Role Validation**: Valid roles are: "user", "admin", "moderator"
5. **Frontend Authorization**: Frontend should control what users can access based on their role
6. **Metadata Field**: Use for storing custom user preferences, settings, or UI state
7. **Cascading Deletes**: Deleting from `auth.users` automatically removes from `public.users`

---

## Testing with curl

### Complete Test Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'

# 2. Login (copy the token from response)
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Get profile (replace YOUR_TOKEN)
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Update profile
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated bio","full_name":"Test User Updated"}'

# 5. Get all users (public)
curl http://localhost:3000/api/user/public/all

# 6. Get all users (protected)
curl http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Check session
curl http://localhost:3000/api/user/session \
  -H "Authorization: Bearer YOUR_TOKEN"

# 8. Logout
curl -X POST http://localhost:3000/api/user/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

For more details, see the [main API documentation](API.md) or [USER_API.md](USER_API.md).
