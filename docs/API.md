# SkyTech CMS API Documentation

Complete API reference for the SkyTech JSON-based Content Management System.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most CMS endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Get your JWT token by logging in via `/api/auth/login`.

---

## Content Management

### Common Content (Reusable Components)

Common content includes reusable components like headers, footers, CTAs, banners, etc.

#### List All Common Content
```http
GET /api/content/common
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "key": "header",
      "data": { /* JSON content */ },
      "created_at": "2025-12-09T...",
      "updated_at": "2025-12-09T..."
    }
  ]
}
```

#### Get Common Content by Key
```http
GET /api/content/common/:key
```

**Parameters:**
- `key` (path) - Component key (e.g., "header", "footer", "globalCta")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "header",
    "data": {
      "logo": "/logo.png",
      "navigation": [
        { "text": "Home", "url": "/" },
        { "text": "About", "url": "/about" }
      ]
    },
    "created_at": "2025-12-09T...",
    "updated_at": "2025-12-09T..."
  }
}
```

#### Create or Update Common Content
```http
PUT /api/content/common/:key
```

**Auth Required:** ✅
**Parameters:**
- `key` (path) - Component key

**Request Body:**
```json
{
  "data": {
    "logo": "/logo.png",
    "navigation": [
      { "text": "Home", "url": "/" }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Common content saved successfully",
  "data": { /* created/updated content */ }
}
```

#### Delete Common Content
```http
DELETE /api/content/common/:key
```

**Auth Required:** ✅
**Parameters:**
- `key` (path) - Component key

---

### Page Content

Page content includes page-specific data for home, about, contact, gallery, etc.

#### List All Pages
```http
GET /api/content/pages?published=true
```

**Query Parameters:**
- `published` (optional) - Filter by published status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "home",
      "title": "Home Page",
      "data": { /* JSON content */ },
      "meta_data": { /* SEO metadata */ },
      "published": true,
      "created_at": "2025-12-09T...",
      "updated_at": "2025-12-09T..."
    }
  ]
}
```

#### Get Page by Slug
```http
GET /api/content/pages/:slug
```

**Parameters:**
- `slug` (path) - Page slug (e.g., "home", "about", "contact")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "home",
    "title": "Home Page",
    "data": {
      "hero": {
        "title": "Welcome",
        "description": "...",
        "backgroundImageUrl": "/hero.jpg"
      },
      "features": []
    },
    "meta_data": {
      "metaTitle": "Home - SkyTech",
      "metaDescription": "..."
    },
    "published": true
  }
}
```

#### Create or Update Page
```http
PUT /api/content/pages/:slug
```

**Auth Required:** ✅
**Parameters:**
- `slug` (path) - Page slug

**Request Body:**
```json
{
  "title": "Home Page",
  "data": {
    "hero": {
      "title": "Welcome to SkyTech",
      "description": "Building the future",
      "backgroundImageUrl": "/hero.jpg"
    }
  },
  "meta_data": {
    "metaTitle": "Home - SkyTech",
    "metaDescription": "Welcome page"
  },
  "published": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Page saved successfully",
  "data": { /* created/updated page */ }
}
```

#### Delete Page
```http
DELETE /api/content/pages/:slug
```

**Auth Required:** ✅

---

## Blog Posts

### List All Blog Posts
```http
GET /api/blog?published=true&limit=10&offset=0
```

**Query Parameters:**
- `published` (optional) - Filter by published status
- `limit` (optional) - Number of posts to return
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": "uuid",
      "slug": "welcome-post",
      "title": "Welcome to Our Blog",
      "excerpt": "First blog post...",
      "content": { /* JSONB content */ },
      "featured_image": "https://...",
      "author_id": "uuid",
      "tags": ["announcement", "welcome"],
      "meta_data": {},
      "published": true,
      "published_at": "2025-12-09T...",
      "created_at": "2025-12-09T...",
      "updated_at": "2025-12-09T..."
    }
  ]
}
```

### Get Blog Post by Slug
```http
GET /api/blog/:slug
```

**Parameters:**
- `slug` (path) - Blog post slug

**Response:**
```json
{
  "success": true,
  "data": { /* Blog post object */ }
}
```

### Create Blog Post
```http
POST /api/blog
```

**Auth Required:** ✅

**Request Body:**
```json
{
  "slug": "my-first-post",
  "title": "My First Post",
  "excerpt": "A short description",
  "content": {
    "blocks": [
      {
        "type": "paragraph",
        "content": "Hello world!"
      }
    ]
  },
  "featured_image": "https://...",
  "tags": ["tech", "blog"],
  "meta_data": {
    "metaTitle": "My First Post",
    "metaDescription": "..."
  },
  "published": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": { /* created post */ }
}
```

### Update Blog Post
```http
PUT /api/blog/:slug
```

**Auth Required:** ✅

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": { /* updated content */ },
  "published": true
}
```

### Delete Blog Post
```http
DELETE /api/blog/:slug
```

**Auth Required:** ✅

---

## File Uploads

### Upload Single Image
```http
POST /api/upload/image?folder=blog
```

**Auth Required:** ✅
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - Image file (max 10MB)

**Query Parameters:**
- `folder` (optional) - Folder to organize files (default: "general")

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "path": "blog/1733745600-a1b2c3.jpg",
    "url": "https://gruchcqaalpaavcirtwt.supabase.co/storage/v1/object/public/images/blog/1733745600-a1b2c3.jpg",
    "size": 245678,
    "mimetype": "image/jpeg"
  }
}
```

### Upload Multiple Images
```http
POST /api/upload/images?folder=gallery
```

**Auth Required:** ✅
**Content-Type:** `multipart/form-data`

**Form Data:**
- `files` - Multiple image files (max 10 files, 10MB each)

**Response:**
```json
{
  "success": true,
  "message": "Uploaded 3 of 3 files",
  "data": {
    "uploaded": [
      {
        "originalName": "photo1.jpg",
        "path": "gallery/...",
        "url": "https://...",
        "size": 123456,
        "mimetype": "image/jpeg"
      }
    ],
    "errors": []
  }
}
```

### Delete Image
```http
DELETE /api/upload/image
```

**Auth Required:** ✅

**Request Body:**
```json
{
  "path": "blog/1733745600-a1b2c3.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### List Images in Folder
```http
GET /api/upload/list
GET /api/upload/list/:folder
```

**Auth Required:** ✅

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "1733745600-a1b2c3.jpg",
      "url": "https://...",
      "size": 245678,
      "contentType": "image/jpeg",
      "createdAt": "2025-12-09T...",
      "updatedAt": "2025-12-09T..."
    }
  ]
}
```

---

## Authentication

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { /* user object */ },
  "session": {
    "access_token": "eyJhbGci...",
    "refresh_token": "..."
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { /* user object */ },
  "session": {
    "access_token": "eyJhbGci...",
    "refresh_token": "..."
  }
}
```

### Get Current User Profile
```http
GET /api/auth/me
```

**Auth Required:** ✅

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": null,
    "created_at": "...",
    "email_confirmed_at": "..."
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Auth Required:** ✅

---

## Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "ok": true,
  "status": {
    "healthy": true,
    "timestamp": "2025-12-09T...",
    "services": {
      "supabaseAPI": { "ok": true },
      "supabaseAuth": { "ok": true, "sessionActive": false },
      "supabaseStorage": { "ok": true, "bucketsCount": 0 }
    }
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## Database Schema

### content_common
- `id` (UUID) - Primary key
- `key` (TEXT) - Unique component key
- `data` (JSONB) - JSON content
- `created_at`, `updated_at` (TIMESTAMPTZ)

### content_pages
- `id` (UUID) - Primary key
- `slug` (TEXT) - Unique page identifier
- `title` (TEXT) - Page title
- `data` (JSONB) - Page content
- `meta_data` (JSONB) - SEO metadata
- `published` (BOOLEAN) - Draft/published status
- `created_at`, `updated_at` (TIMESTAMPTZ)

### blog_posts
- `id` (UUID) - Primary key
- `slug` (TEXT) - Unique post identifier
- `title` (TEXT) - Post title
- `excerpt` (TEXT) - Short description
- `content` (JSONB) - Rich content
- `featured_image` (TEXT) - Image URL
- `author_id` (UUID) - Foreign key to users
- `tags` (TEXT[]) - Array of tags
- `meta_data` (JSONB) - SEO metadata
- `published` (BOOLEAN) - Draft/published status
- `published_at` (TIMESTAMPTZ) - Publication timestamp
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## Validation

All content is validated using `@atomictemplate/validations` package schemas:

- **Common content:** BannerSchema, CtaSchema, FAQSchema, GallerySchema, etc.
- **Page content:** HomePageSchema, ContactPageSchema, GalleryPageSchema, etc.
- **Blog posts:** BlogPostSchema

Import schemas:
```typescript
import { BannerSchema, HomePageSchema, BlogPostSchema } from '@atomictemplate/validations'
```

---

## Getting Started

1. **Start the server:**
   ```bash
   pnpm dev
   ```

2. **Register a user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password123","full_name":"Admin"}'
   ```

3. **Get your access token from the response and use it for authenticated requests.**

4. **Create your first page:**
   ```bash
   curl -X PUT http://localhost:3000/api/content/pages/home \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Home Page",
       "data": {"hero": {"title": "Welcome"}},
       "published": true
     }'
   ```

---

**For questions or issues, check the [GitHub repository](https://github.com/yourusername/skytech_node_backend)**
