# Blog Pages API Documentation

## Overview

The Blog Pages API provides endpoints for creating, reading, updating, and deleting blog posts with full version control. All endpoints support automatic history tracking and content versioning.

## Architecture

- **Base URL**: `/api/blog-pages`
- **Authentication**: Required (JWT Bearer token) for all endpoints
- **Authorization**: Frontend-controlled via user role
- **Database**: PostgreSQL (Supabase)
- **Primary Table**: `blog_posts`
- **History Table**: `content_history` (auto-populated via triggers)
- **Routing**: Slug-based (URLs use blog slug, not ID)

## Blog Post Object Schema

```typescript
{
  id: UUID                      // Unique blog post identifier
  title: string                // Post title
  slug: string                 // URL-friendly slug (unique)
  status: enum                 // 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  content: object (JSONB)      // Rich content (blocks, paragraphs, etc.)
  excerpt?: string             // Short description/preview
  featured_image?: string      // Image URL
  tags?: string[]              // Tags for filtering
  category?: string            // Primary category
  meta_data?: object (JSONB)   // SEO metadata
  published: boolean           // Back-compat published flag
  published_at?: timestamp     // When it was published
  scheduled_at?: timestamp     // When it is scheduled to publish
  version: integer             // Auto-incrementing version number
  author_id: UUID              // Post creator (FK to public.users)
  last_modified_by: UUID       // Last editor (FK to public.users)
  view_count: integer          // View counter
  reading_time_minutes?: int   // Estimated reading time
  created_at: timestamp        // Creation time
  updated_at: timestamp        // Last update time
}
```

## Blog Post Status Enum

Valid blog post statuses:

| Status | Description |
|--------|-------------|
| `draft` | Work in progress, not published |
| `review` | Pending review before publication |
| `scheduled` | Scheduled to publish at a future date |
| `published` | Live and visible to users |
| `archived` | No longer active, kept for history |

---

## Endpoints

### 1. Get All Blog Posts (Protected)

Retrieve all blog posts with basic metadata and author information. No pagination - returns all posts for dashboard filtering/sorting.

**Endpoint**: `GET /api/blog-pages`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "posts": [
    {
      "id": "post-uuid-123",
      "title": "Welcome to the Blog",
      "slug": "welcome-to-the-blog",
      "status": "published",
      "excerpt": "Our first post introducing the blog.",
      "featured_image": "https://cdn.example.com/hero.jpg",
      "tags": ["announcement"],
      "category": "News",
      "meta_data": {
        "description": "An introduction post"
      },
      "published": true,
      "published_at": "2026-02-05T14:22:00Z",
      "scheduled_at": null,
      "view_count": 120,
      "reading_time_minutes": 4,
      "created_at": "2026-02-01T10:30:00Z",
      "updated_at": "2026-02-05T14:22:00Z",
      "version": 3,
      "author_id": "user-uuid-123",
      "last_modified_by": "user-uuid-123",
      "author_name": "John Doe",
      "author_email": "john@example.com"
    }
  ],
  "total": 1
}
```

---

### 2. Get Blog Post by Slug (Protected)

Retrieve a blog post by slug with the full dataset.

**Endpoint**: `GET /api/blog-pages/:slug`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "post": {
    "id": "post-uuid-123",
    "title": "Welcome to the Blog",
    "slug": "welcome-to-the-blog",
    "status": "published",
    "content": {
      "blocks": [
        { "type": "paragraph", "content": "Hello world" }
      ]
    },
    "excerpt": "Our first post introducing the blog.",
    "featured_image": "https://cdn.example.com/hero.jpg",
    "tags": ["announcement"],
    "category": "News",
    "meta_data": {
      "description": "An introduction post"
    },
    "published": true,
    "published_at": "2026-02-05T14:22:00Z",
    "scheduled_at": null,
    "version": 3,
    "author_id": "user-uuid-123",
    "last_modified_by": "user-uuid-123",
    "author_name": "John Doe",
    "author_email": "john@example.com",
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-05T14:22:00Z"
  }
}
```

---

### 3. Get Blog Post History (Protected)

Retrieve the version history for a blog post by slug.

**Endpoint**: `GET /api/blog-pages/:slug/history`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "post": {
    "id": "post-uuid-123",
    "title": "Welcome to the Blog",
    "slug": "welcome-to-the-blog"
  },
  "history": [
    {
      "version": 3,
      "title": "Welcome to the Blog",
      "status": "published",
      "created_at": "2026-02-05T14:22:00Z",
      "change_summary": null,
      "changed_by_name": "John Doe",
      "changed_by_email": "john@example.com"
    }
  ]
}
```

---

### 4. Create Blog Post (Protected)

Create a new blog post. Status defaults to `draft`.

**Endpoint**: `POST /api/blog-pages`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Welcome to the Blog",
  "slug": "welcome-to-the-blog",
  "content": {
    "blocks": [
      { "type": "paragraph", "content": "Hello world" }
    ]
  },
  "excerpt": "Our first post introducing the blog.",
  "featured_image": "https://cdn.example.com/hero.jpg",
  "tags": ["announcement"],
  "category": "News",
  "meta_data": {
    "description": "An introduction post"
  },
  "status": "draft"
}
```

**Response** (201):
```json
{
  "message": "Blog post created successfully",
  "post": {
    "id": "post-uuid-123",
    "title": "Welcome to the Blog",
    "slug": "welcome-to-the-blog",
    "status": "draft",
    "version": 1,
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-01T10:30:00Z"
  }
}
```

---

### 5. Update Blog Post (Protected)

Update a blog post by slug. At least one field is required.

**Endpoint**: `PUT /api/blog-pages/:slug`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Welcome to the Blog (Updated)",
  "content": {
    "blocks": [
      { "type": "paragraph", "content": "Updated content" }
    ]
  },
  "status": "published"
}
```

**Response** (200):
```json
{
  "message": "Blog post updated successfully",
  "post": {
    "id": "post-uuid-123",
    "title": "Welcome to the Blog (Updated)",
    "slug": "welcome-to-the-blog",
    "status": "published",
    "version": 2,
    "updated_at": "2026-02-05T14:22:00Z",
    "last_modified_by": "user-uuid-123"
  }
}
```

---

### 6. Restore Blog Post Version (Protected)

Restore a blog post to a previous version by slug.

**Endpoint**: `POST /api/blog-pages/:slug/restore/:version`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Blog post successfully restored to version 2",
  "post": {
    "id": "post-uuid-123",
    "title": "Welcome to the Blog",
    "slug": "welcome-to-the-blog",
    "status": "draft",
    "version": 3,
    "updated_at": "2026-02-06T10:20:00Z"
  }
}
```

---

### 7. Delete Blog Post (Protected)

Delete a blog post by slug.

**Endpoint**: `DELETE /api/blog-pages/:slug`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Blog post deleted successfully",
  "deleted_post": {
    "id": "post-uuid-123",
    "title": "Welcome to the Blog",
    "slug": "welcome-to-the-blog"
  }
}
```

---

## Error Responses

All endpoints follow the standard error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { }
}
```

Common errors:

- `400 BAD_REQUEST` - Missing or invalid fields
- `401 NOT_AUTHENTICATED` - Missing or invalid token
- `404 NOT_FOUND` - Blog post not found
- `409 CONFLICT` - Duplicate slug
- `500 INTERNAL_ERROR` - Unexpected server error
