# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

---

## Authentication Endpoints

### Register User
Create a new user account. **Emails must be unique.**

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

**Validation Rules:**
- `email` - Required, must be valid email format, **must be unique**
- `password` - Required, minimum 6 characters
- `full_name` - Optional

**Response (Success):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2025-12-11T..."
  },
  "session": {
    "access_token": "jwt_token...",
    "refresh_token": "refresh_token...",
    "expires_at": "2025-12-11T..."
  }
}
```

**Error Responses:**

*Invalid email format (400):*
```json
{
  "error": "Invalid email format"
}
```

*Password too short (400):*
```json
{
  "error": "Password must be at least 6 characters long"
}
```

*Email already exists (409):*
```json
{
  "error": "Email already registered. Please login instead."
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Validation error (invalid format, missing fields)
- `409` - Conflict (email already registered)
- `500` - Server error

---

### Login
Authenticate and get access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "jwt_token...",
    "refresh_token": "refresh_token...",
    "expires_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `500` - Server error

---

### Get Profile
Get current user profile.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

---

### Logout
Logout current session.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### Verify Token
Verify if JWT token is valid using Supabase's native authentication.

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (Authenticated):**
```json
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

**Response (Not Authenticated):**
```json
{
  "authenticated": false,
  "message": "No valid token provided"
}
```

**Status Codes:**
- `200` - Always returns 200 (check `authenticated` field in response)

**Usage:**
```javascript
// Using auth.js
const result = await auth.verifyWithServer();
if (result.authenticated) {
  console.log('User is authenticated:', result.user);
}

// Using api.js
const result = await api.verifyAuth();
if (result.success && result.data.authenticated) {
  console.log('User is authenticated:', result.data.user);
}
```

---

## Content Pages

### Get All Pages
List all content pages.

**Endpoint:** `GET /api/content/pages`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "home",
      "title": "Home Page",
      "data": { /* page content */ },
      "meta_data": { /* SEO metadata */ },
      "published": true,
      "created_at": "2025-12-11T...",
      "updated_at": "2025-12-11T..."
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Get Page by Slug
Get a specific page by its slug.

**Endpoint:** `GET /api/content/pages/:slug`

**Parameters:**
- `slug` - Page slug (e.g., "home", "about")

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "slug": "home",
    "title": "Home Page",
    "data": {
      "banner": {
        "title": "Welcome",
        "description": "...",
        "backgroundImageUrl": "https://...",
        "heroImageUrl": "https://...",
        "button": {
          "text": "Get Started",
          "url": "/contact"
        }
      }
    },
    "meta_data": {
      "metaTitle": "Home - SkyTech",
      "metaDescription": "..."
    },
    "published": true,
    "created_at": "2025-12-11T...",
    "updated_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Page not found
- `500` - Server error

---

### Create/Update Page
Create a new page or update an existing one by slug.

**Endpoint:** `PUT /api/content/pages/:slug`

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `slug` - Page slug (e.g., "home", "about")

**Request Body:**
```json
{
  "title": "Home Page",
  "data": {
    "banner": {
      "title": "Welcome to SkyTech",
      "description": "We build amazing things",
      "backgroundImageUrl": "https://example.com/bg.jpg",
      "heroImageUrl": "https://example.com/hero.jpg",
      "button": {
        "text": "Get Started",
        "url": "/contact"
      }
    }
  },
  "meta_data": {
    "metaTitle": "Home - SkyTech",
    "metaDescription": "Welcome to our website"
  },
  "published": true
}
```

**Response:**
```json
{
  "message": "Page created successfully",
  "data": {
    "id": "uuid",
    "slug": "home",
    "title": "Home Page",
    "data": { /* page content */ },
    "meta_data": { /* SEO metadata */ },
    "published": true,
    "created_at": "2025-12-11T...",
    "updated_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Page updated
- `201` - Page created
- `400` - Validation error
- `401` - Unauthorized
- `500` - Server error

---

### Delete Page
Delete a page by slug.

**Endpoint:** `DELETE /api/content/pages/:slug`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Parameters:**
- `slug` - Page slug

**Response:**
```json
{
  "message": "Page deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Page not found
- `500` - Server error

---

## Common Content

### Get All Common Content
List all common content items.

**Endpoint:** `GET /api/content/common`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "key": "site-settings",
      "title": "Site Settings",
      "data": { /* content data */ },
      "created_at": "2025-12-11T...",
      "updated_at": "2025-12-11T..."
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Get Common Content by Key
Get a specific common content item by key.

**Endpoint:** `GET /api/content/common/:key`

**Parameters:**
- `key` - Content key (e.g., "site-settings", "footer-links")

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "key": "site-settings",
    "title": "Site Settings",
    "data": {
      "siteName": "SkyTech",
      "tagline": "Building the Future",
      "contactEmail": "info@skytech.com"
    },
    "created_at": "2025-12-11T...",
    "updated_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Content not found
- `500` - Server error

---

### Create/Update Common Content
Create or update common content by key.

**Endpoint:** `PUT /api/content/common/:key`

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `key` - Content key

**Request Body:**
```json
{
  "title": "Site Settings",
  "data": {
    "siteName": "SkyTech",
    "tagline": "Building the Future",
    "contactEmail": "info@skytech.com"
  }
}
```

**Response:**
```json
{
  "message": "Common content created successfully",
  "data": {
    "id": "uuid",
    "key": "site-settings",
    "title": "Site Settings",
    "data": { /* content data */ },
    "created_at": "2025-12-11T...",
    "updated_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Updated
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `500` - Server error

---

### Delete Common Content
Delete common content by key.

**Endpoint:** `DELETE /api/content/common/:key`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Parameters:**
- `key` - Content key

**Response:**
```json
{
  "message": "Common content deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Content not found
- `500` - Server error

---

## Blog Posts

### Get All Blog Posts
List all blog posts with optional filtering and pagination.

**Endpoint:** `GET /api/blog`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in title and content
- `category` - Filter by category
- `tag` - Filter by tag

**Example:**
```
GET /api/blog?page=1&limit=10&search=technology&category=news
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "my-first-post",
      "title": "My First Post",
      "excerpt": "This is a short excerpt...",
      "content": "Full content here...",
      "featured_image": "https://example.com/image.jpg",
      "author": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "categories": ["technology", "news"],
      "tags": ["javascript", "web"],
      "published": true,
      "published_at": "2025-12-11T...",
      "created_at": "2025-12-11T...",
      "updated_at": "2025-12-11T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Get Blog Post by Slug
Get a specific blog post.

**Endpoint:** `GET /api/blog/:slug`

**Parameters:**
- `slug` - Blog post slug

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "slug": "my-first-post",
    "title": "My First Post",
    "excerpt": "This is a short excerpt...",
    "content": "Full content here...",
    "featured_image": "https://example.com/image.jpg",
    "author": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "categories": ["technology", "news"],
    "tags": ["javascript", "web"],
    "published": true,
    "published_at": "2025-12-11T...",
    "created_at": "2025-12-11T...",
    "updated_at": "2025-12-11T..."
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Post not found
- `500` - Server error

---

### Create Blog Post
Create a new blog post.

**Endpoint:** `POST /api/blog`

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "slug": "my-new-post",
  "title": "My New Post",
  "excerpt": "A short excerpt",
  "content": "Full content of the post...",
  "featured_image": "https://example.com/image.jpg",
  "categories": ["technology"],
  "tags": ["javascript", "web"],
  "published": true,
  "published_at": "2025-12-11T10:00:00Z"
}
```

**Response:**
```json
{
  "message": "Blog post created successfully",
  "data": {
    "id": "uuid",
    "slug": "my-new-post",
    "title": "My New Post",
    "author_id": "uuid",
    /* ... other fields */
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Validation error or slug already exists
- `401` - Unauthorized
- `500` - Server error

---

### Update Blog Post
Update an existing blog post.

**Endpoint:** `PUT /api/blog/:slug`

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `slug` - Blog post slug

**Request Body:**
```json
{
  "title": "Updated Title",
  "excerpt": "Updated excerpt",
  "content": "Updated content...",
  "featured_image": "https://example.com/new-image.jpg",
  "categories": ["technology", "news"],
  "tags": ["javascript", "react"],
  "published": true
}
```

**Response:**
```json
{
  "message": "Blog post updated successfully",
  "data": {
    "id": "uuid",
    "slug": "my-post",
    /* ... updated fields */
  }
}
```

**Status Codes:**
- `200` - Updated
- `400` - Validation error
- `401` - Unauthorized
- `404` - Post not found
- `500` - Server error

---

### Delete Blog Post
Delete a blog post.

**Endpoint:** `DELETE /api/blog/:slug`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Parameters:**
- `slug` - Blog post slug

**Response:**
```json
{
  "message": "Blog post deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Post not found
- `500` - Server error

---

## File Upload

### Upload File
Upload a file to the server.

**Endpoint:** `POST /api/upload`

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - The file to upload (required)
- `folder` - Target folder path (optional, default: root)

**Example using JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'blog-images');

const result = await api.uploadFile(fileInput.files[0], 'blog-images');
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "url": "https://storage.example.com/uploads/blog-images/image.jpg",
    "path": "blog-images/image.jpg",
    "filename": "image.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - No file provided or invalid file
- `401` - Unauthorized
- `500` - Server error

---

## Health Check

### Check API Health
Check API and database connectivity.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "ok": true,
  "status": {
    "supabase": "connected",
    "timestamp": "2025-12-11T10:00:00Z"
  }
}
```

**Status Codes:**
- `200` - All systems operational
- `500` - System error

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

### Common Error Status Codes

- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource, e.g., slug already exists)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate limited to **100 requests per 15 minutes** per IP address.

When rate limit is exceeded:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**Status Code:** `429`

---

## CORS

Cross-Origin Resource Sharing (CORS) is enabled. Configure allowed origins in `.env`:

```env
CORS_ALLOWED_ORIGIN=*
```

---

## Using the API Client (JavaScript)

A ready-to-use API client is available at `/js/api.js`:

```javascript
// Load current page
const result = await api.getPage('home');
if (result.success) {
  console.log(result.data);
}

// Update page
const updateResult = await api.upsertPage('home', {
  title: 'Home Page',
  data: { /* content */ },
  published: true
});

// Create blog post
const blogResult = await api.createBlogPost({
  slug: 'my-post',
  title: 'My Post',
  content: 'Content here...',
  published: true
});

// Upload file
const uploadResult = await api.uploadFile(file, 'images');
```

All methods return:
```javascript
{
  success: boolean,
  data: object | null,
  error: string | null,
  status: number
}
```

---

## Schema Validations

Content schemas are defined in the `@atomictemplate/validations` package:

- **HomePageSchema** - Home page content structure
- **CommonContentSchema** - Common/shared content
- **BlogPostSchema** - Blog post structure

Refer to the validation package documentation for complete schema definitions.
