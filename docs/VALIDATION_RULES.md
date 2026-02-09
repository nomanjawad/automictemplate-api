# API Validation Rules

## Authentication

### Register User (`POST /api/auth/register`)

#### Email Validation
- ✅ **Required** - Cannot be empty
- ✅ **Format** - Must be valid email format (`user@example.com`)
- ✅ **Unique** - Email must not already exist in the system
- ✅ **Case-insensitive** - `User@Example.com` and `user@example.com` are treated as the same

**Error Responses:**
```json
// Missing email
{ "error": "Email and password are required" }

// Invalid format
{ "error": "Invalid email format" }

// Already exists
{ "error": "Email already registered. Please login instead." }
```

**HTTP Status Codes:**
- `400` - Invalid format or missing
- `409` - Email already exists

#### Password Validation
- ✅ **Required** - Cannot be empty
- ✅ **Minimum length** - At least 6 characters
- ✅ **Supabase enforced** - Additional rules may apply from Supabase settings

**Error Responses:**
```json
// Missing password
{ "error": "Email and password are required" }

// Too short
{ "error": "Password must be at least 6 characters long" }
```

**HTTP Status Code:** `400`

#### Full Name Validation
- ℹ️ **Optional** - Can be null or empty
- ℹ️ **No format restrictions** - Any string accepted

---

## Content Pages

### Create/Update Page (`PUT /api/content/pages/:slug`)

#### Slug Validation
- ✅ **URL path parameter** - Must be provided in URL
- ✅ **Used as unique identifier** - Same slug updates existing page
- ℹ️ **Recommended format** - kebab-case (e.g., `home`, `about-us`, `contact`)

#### Title Validation
- ℹ️ **Optional** - Can be omitted
- ℹ️ **Type** - String

#### Data Validation
- ✅ **Required** - Must include page data object
- ✅ **Schema validation** - Validated against page-specific schemas
- ✅ **HomePageSchema** - For slug "home", must include banner with title

**Example Error:**
```json
{
  "error": "Validation error",
  "details": "banner.title is required"
}
```

#### Meta Data Validation
- ℹ️ **Optional** - Can be omitted
- ℹ️ **Recommended** - Include for SEO purposes
- Fields: `metaTitle`, `metaDescription`, `keywords`, etc.

#### Published Status
- ℹ️ **Optional** - Defaults to false if omitted
- ✅ **Type** - Boolean (`true` or `false`)
- ℹ️ **Behavior** - Unpublished pages require authentication to view

---

## Common Content

### Create/Update Common Content (`PUT /api/content/common/:key`)

#### Key Validation
- ✅ **URL path parameter** - Must be provided in URL
- ✅ **Used as unique identifier** - Same key updates existing content
- ℹ️ **Recommended format** - kebab-case (e.g., `site-settings`, `footer-links`)

#### Title Validation
- ℹ️ **Optional** - Can be omitted
- ℹ️ **Type** - String

#### Data Validation
- ✅ **Required** - Must include data object
- ℹ️ **No schema enforcement** - Any valid JSON object accepted
- ℹ️ **Flexible structure** - Define your own data structure

---

## Blog Posts

### Create Blog Post (`POST /api/blog`)

#### Slug Validation
- ✅ **Required** - Must be provided
- ✅ **Unique** - Must not already exist
- ℹ️ **Recommended format** - kebab-case (e.g., `my-first-post`)

**Error Response:**
```json
{ "error": "Blog post with this slug already exists" }
```

**HTTP Status Code:** `409`

#### Title Validation
- ✅ **Required** - Cannot be empty
- ℹ️ **Type** - String

#### Content Validation
- ✅ **Required** - Cannot be empty
- ℹ️ **Type** - String (supports markdown/HTML)

#### Excerpt Validation
- ℹ️ **Optional** - Can be omitted
- ℹ️ **Recommended** - Brief summary for previews

#### Author ID Validation
- ✅ **Auto-assigned** - Uses authenticated user's ID
- ✅ **Cannot be overridden** - Security measure

#### Published Status
- ℹ️ **Optional** - Defaults to false
- ✅ **Type** - Boolean

#### Categories & Tags
- ℹ️ **Optional** - Can be empty arrays
- ℹ️ **Type** - Array of strings
- Example: `["technology", "news"]`

### Update Blog Post (`PUT /api/blog/:slug`)

#### Authorization
- ✅ **Owner check** - Can only update your own posts
- ✅ **Admin override** - Admins can update any post

**Error Response:**
```json
{ "error": "You can only update your own blog posts" }
```

**HTTP Status Code:** `403`

---

## General Validation Rules

### JWT Authentication

All protected endpoints require:
- ✅ **Authorization header** - `Bearer <token>`
- ✅ **Valid token** - Not expired, valid signature
- ✅ **User exists** - User still exists in Supabase

**Error Responses:**
```json
// Missing token
{ "error": "Authorization token required" }

// Invalid/expired token
{ "error": "Invalid or expired token" }
```

**HTTP Status Code:** `401`

### Rate Limiting

All endpoints are rate limited:
- ✅ **Limit** - 100 requests per 15 minutes per IP
- ✅ **Applied globally** - Across all endpoints

**Error Response:**
```json
{ "error": "Too many requests from this IP, please try again later." }
```

**HTTP Status Code:** `429`

### Request Body Size

- ✅ **JSON limit** - Default Express limit
- ℹ️ **File uploads** - Handled separately by multer

---

## Supabase Enforced Rules

### Email Uniqueness
- ✅ **Database constraint** - Enforced at database level
- ✅ **Case-insensitive** - Handled by Supabase Auth
- ✅ **Cannot be bypassed** - System-level enforcement

### Password Requirements
- ✅ **Minimum 6 characters** - Enforced by Supabase
- ℹ️ **Additional rules** - Can be configured in Supabase dashboard
- ℹ️ **Recommendations** - Use strong passwords with mix of characters

### User ID Format
- ✅ **UUID format** - Automatically generated
- ✅ **Immutable** - Cannot be changed after creation

---

## Testing Validation

### Using Postman

Test validation by sending invalid data:

```json
// Test duplicate email
POST /api/auth/register
{
  "email": "existing@example.com",
  "password": "Test123!",
  "full_name": "Test"
}
// Expected: 409 Conflict

// Test invalid email
POST /api/auth/register
{
  "email": "not-an-email",
  "password": "Test123!",
  "full_name": "Test"
}
// Expected: 400 Bad Request

// Test short password
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "12345",
  "full_name": "Test"
}
// Expected: 400 Bad Request
```

### Using curl

```bash
# Test duplicate email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com","password":"Test123!"}'

# Test invalid format
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"Test123!"}'

# Test short password
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"12345"}'
```

---

## Best Practices

1. **Always validate client-side** - Before sending to API
2. **Handle all error codes** - Don't assume success
3. **Show user-friendly messages** - Transform technical errors
4. **Use proper status codes** - Check HTTP status in responses
5. **Log validation errors** - For debugging and monitoring

## Summary Table

| Field | Required | Unique | Min Length | Format | Default |
|-------|----------|--------|------------|--------|---------|
| email | ✅ | ✅ | - | Valid email | - |
| password | ✅ | ❌ | 6 chars | Any | - |
| full_name | ❌ | ❌ | - | Any | null |
| page.slug | ✅ | ✅ | - | kebab-case | - |
| blog.slug | ✅ | ✅ | - | kebab-case | - |
| blog.title | ✅ | ❌ | - | Any | - |
| blog.content | ✅ | ❌ | - | Any | - |
| published | ❌ | ❌ | - | Boolean | false |
