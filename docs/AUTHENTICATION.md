# Authentication System

## Overview

This backend implements JWT-based authentication using **Supabase Auth** with a 3-day session expiration.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Browser)                                 │
│  - Stores JWT in sessionStorage                     │
│  - 3-day client-side expiration tracking            │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTP + JWT Token
                  │
┌─────────────────▼───────────────────────────────────┐
│  Backend API (Express + Supabase)                   │
│  - Verifies JWT using Supabase auth.getUser()       │
│  - Protected endpoints use requireAuth middleware   │
└─────────────────┬───────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────┐
│  Supabase Authentication                            │
│  - Native JWT verification                          │
│  - User management                                  │
└─────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. Login
```javascript
// Frontend
const result = await auth.login(email, password);

// What happens:
// 1. POST /api/auth/login
// 2. Backend calls Supabase signInWithPassword()
// 3. Supabase returns JWT token + user data
// 4. Frontend stores in sessionStorage:
//    - jwt_token: JWT access token
//    - jwt_expiry: Current date + 3 days
//    - user_data: User information
```

### 2. Client-Side Auth Check
```javascript
// Frontend
if (auth.isAuthenticated()) {
  // User has valid token (not expired)
}

// What it checks:
// 1. Token exists in sessionStorage
// 2. Expiry date exists
// 3. Current date < expiry date
// Note: Does NOT verify with Supabase
```

### 3. Server-Side Verification
```javascript
// Frontend
const result = await auth.verifyWithServer();
if (result.authenticated) {
  console.log('Valid user:', result.user);
}

// What happens:
// 1. GET /api/auth/verify (with Authorization header)
// 2. requireAuth middleware extracts token
// 3. Backend calls supabaseClient.auth.getUser(token)
// 4. Supabase verifies JWT signature and validity
// 5. Returns { authenticated: true, user: {...} }
```

## API Endpoints

### Public Endpoints (No Auth Required)

#### POST /api/auth/register
Register new user
```javascript
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

#### POST /api/auth/login
Login user
```javascript
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Protected Endpoints (Require JWT)

#### GET /api/auth/verify
Verify JWT token with Supabase
```http
Authorization: Bearer <jwt_token>
```
Returns:
```javascript
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2025-12-11T..."
  }
}
```

#### GET /api/auth/profile
Get user profile
```http
Authorization: Bearer <jwt_token>
```

#### POST /api/auth/logout
Logout user
```http
Authorization: Bearer <jwt_token>
```

## Frontend Authentication Methods

### auth.js (Authentication Manager)

```javascript
// Login
const result = await auth.login(email, password);
if (result.success) {
  // Token stored in sessionStorage
}

// Client-side check (fast, no API call)
if (auth.isAuthenticated()) {
  // Token exists and not expired locally
}

// Server-side verification (secure, uses Supabase)
const result = await auth.verifyWithServer();
if (result.authenticated) {
  // Token verified by Supabase
}

// Get token for API calls
const token = auth.getToken();

// Get user data
const user = auth.getUser();

// Logout
await auth.logout();

// Clear session
auth.clearSession();
```

### api.js (API Client)

```javascript
// Verify authentication
const result = await api.verifyAuth();
if (result.success && result.data.authenticated) {
  console.log('User:', result.data.user);
}

// All API methods automatically include JWT token
const pageData = await api.getPage('home');
```

## Backend Implementation

### Middleware (src/middleware/auth.ts)

```typescript
// requireAuth - Protects endpoints
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  // Verify with Supabase
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}
```

### Controller (src/controllers/auth.controller.ts)

```typescript
// Verify token endpoint
export async function verifyToken(req, res) {
  const user = req.user; // Set by requireAuth middleware

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      created_at: user.created_at
    }
  });
}
```

## Session Storage Keys

- `jwt_token` - JWT access token from Supabase
- `jwt_expiry` - Expiration timestamp (current date + 3 days)
- `user_data` - Serialized user object
- `auth_redirect` - URL to redirect to after login

## Security Features

1. **JWT Signature Verification**: Supabase verifies token signatures
2. **Expiration Tracking**: 3-day client-side expiration
3. **Server-Side Validation**: All protected endpoints verify tokens
4. **Secure Token Storage**: sessionStorage (cleared on browser close)
5. **HTTPS Ready**: Works with secure connections

## When to Use Each Method

### Use `auth.isAuthenticated()` (Client-Side) when:
- ✅ Checking if user is logged in for UI state
- ✅ Deciding whether to show login/logout buttons
- ✅ Redirecting to login page
- ✅ Quick checks without network overhead

### Use `auth.verifyWithServer()` (Server-Side) when:
- ✅ Before performing sensitive operations
- ✅ Validating token hasn't been revoked
- ✅ Ensuring user still exists in Supabase
- ✅ Getting fresh user data from database
- ✅ Security-critical authentication checks

### Use Protected API Endpoints when:
- ✅ All data operations (CRUD)
- ✅ File uploads
- ✅ Content management
- ✅ Blog operations
- ✅ Any operation requiring authentication

## Testing

### Test Pages Available:

1. **Login**: http://localhost:3000/login.html
   - Login with credentials
   - Token stored in sessionStorage

2. **Auth Test**: http://localhost:3000/test-auth.html
   - View session status
   - Test login/logout
   - Inspect stored tokens

3. **Verification Test**: http://localhost:3000/test-verify.html
   - Compare client-side vs server-side checks
   - See Supabase verification in action
   - Understand the difference

4. **Home Editor**: http://localhost:3000/test-home-editor.html
   - Example of protected page
   - Uses client-side auth check
   - API calls include JWT token automatically

### Manual Testing with curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Verify token
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# Get protected resource
curl http://localhost:3000/api/content/pages/home \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling

### Common Error Responses:

**401 Unauthorized** - Missing or invalid token
```json
{
  "error": "Authorization token required"
}
```

**401 Invalid Token** - Token expired or invalid
```json
{
  "error": "Invalid or expired token"
}
```

**Verification Failed** - Server verification
```json
{
  "authenticated": false,
  "message": "No valid token provided"
}
```

## Best Practices

1. **Always use HTTPS in production**
2. **Never store tokens in localStorage** (use sessionStorage)
3. **Verify server-side for sensitive operations**
4. **Include token in all API requests** (handled automatically by api.js)
5. **Handle 401 responses** by redirecting to login
6. **Clear session on logout**
7. **Set appropriate token expiration** (currently 3 days)

## Environment Variables

Required in `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## Migration Notes

If migrating from the old localStorage-based system:
1. Old sessions stored in `auth_session` will be ignored
2. Users need to login again
3. New system uses `jwt_token`, `jwt_expiry`, `user_data` keys
4. Sessions persist for 3 days (client-side tracking)

## Troubleshooting

### Token exists but server verification fails
- Token may be expired in Supabase (despite client expiry)
- User may have been deleted
- Supabase URL/key may be incorrect

### Infinite redirect loops
- Check browser console for auth logs
- Verify sessionStorage has all required keys
- Ensure `auth.isAuthenticated()` returns correct value
- Check for race conditions in page load

### 401 errors on API calls
- Verify token in sessionStorage
- Check Authorization header format: `Bearer <token>`
- Test with `/api/auth/verify` endpoint first
- Check Supabase dashboard for user status
