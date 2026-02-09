# Pages API Documentation

## Overview

The Pages API provides endpoints for creating, reading, updating, and deleting pages with full version control. All endpoints support automatic history tracking and content versioning.

## Architecture

- **Base URL**: `/api/pages`
- **Authentication**: Required (JWT Bearer token) for all endpoints
- **Authorization**: Frontend-controlled via user role
- **Database**: PostgreSQL (Supabase)
- **Primary Table**: `content_pages`
- **History Table**: `content_history` (auto-populated via triggers)
- **Routing**: Slug-based (URLs use page slug, not ID)

## Page Object Schema

```typescript
{
  id: UUID                    // Unique page identifier
  title: string              // Page title
  slug: string               // URL-friendly slug (unique)
  status: enum               // 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  data: object (JSONB)       // Page content (flexible structure)
  meta_data: object (JSONB)  // Page metadata (SEO, description, etc.)
  version: integer           // Auto-incrementing version number
  author_id: UUID            // Page creator (FK to public.users)
  last_modified_by: UUID     // Last editor (FK to public.users)
  created_at: timestamp      // Creation time
  updated_at: timestamp      // Last update time
}
```

## Page Status Enum

Valid page statuses:

| Status | Description |
|--------|-------------|
| `draft` | Work in progress, not published |
| `review` | Pending review before publication |
| `scheduled` | Scheduled to publish at a future date |
| `published` | Live and visible to users |
| `archived` | No longer active, kept for history |

---

## Endpoints

### 1. Get All Pages (Protected)

Retrieve all pages with basic metadata and author information. No pagination - returns all pages for dashboard filtering/sorting.

**Endpoint**: `GET /api/pages`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**: None

**Response** (200):
```json
{
  "pages": [
    {
      "id": "page-uuid-123",
      "title": "Home Page",
      "slug": "home",
      "status": "published",
      "meta_data": {
        "description": "Welcome to our site",
        "keywords": ["home", "welcome"]
      },
      "created_at": "2026-02-01T10:30:00Z",
      "updated_at": "2026-02-05T14:22:00Z",
      "version": 5,
      "author_id": "user-uuid-123",
      "author_name": "John Doe",
      "author_email": "john@example.com"
    },
    {
      "id": "page-uuid-456",
      "title": "About Us",
      "slug": "about",
      "status": "draft",
      "meta_data": null,
      "created_at": "2026-02-03T09:15:00Z",
      "updated_at": "2026-02-03T09:15:00Z",
      "version": 1,
      "author_id": "user-uuid-456",
      "author_name": "Jane Smith",
      "author_email": "jane@example.com"
    }
  ],
  "total": 2
}
```

**Fields Returned**:
- `id` - Page UUID
- `title` - Page title
- `slug` - URL slug (unique)
- `status` - Current page status
- `meta_data` - Metadata object (SEO, etc.)
- `created_at`, `updated_at` - Timestamps
- `version` - Current version number
- `author_id`, `author_name`, `author_email` - Creator info

**Error** (401):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": { }
}
```

---

### 2. Get Page by Slug (Protected)

Retrieve a specific page with full content and metadata using its slug.

**Endpoint**: `GET /api/pages/:slug`

**Authentication**: Required (Bearer token)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | URL-friendly page slug |

**Headers**:
```
Authorization: Bearer <token>
```

**Example**: `GET /api/pages/home`

**Response** (200):
```json
{
  "page": {
    "id": "page-uuid-123",
    "title": "Home Page",
    "slug": "home",
    "status": "published",
    "data": {
      "sections": [
        {
          "type": "hero",
          "heading": "Welcome",
          "subheading": "To our website",
          "image": "https://cdn.example.com/hero.jpg"
        },
        {
          "type": "features",
          "items": [
            { "title": "Feature 1", "description": "Description" },
            { "title": "Feature 2", "description": "Description" }
          ]
        }
      ]
    },
    "meta_data": {
      "description": "Welcome to our site",
      "keywords": ["home", "welcome"],
      "og_image": "https://cdn.example.com/og-image.jpg",
      "canonical_url": "https://example.com/"
    },
    "version": 5,
    "author_id": "user-uuid-123",
    "author_name": "John Doe",
    "author_email": "john@example.com",
    "last_modified_by": "user-uuid-456",
    "created_at": "2026-02-01T10:30:00Z",
    "updated_at": "2026-02-05T14:22:00Z"
  }
}
```

**Frontend Note**: The `data` field contains flexible JSON structure - your page builder/renderer defines the schema.

**Error** (404):
```json
{
  "error": "Page not found",
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

### 3. Create Page (Protected)

Create a new page. Auto-sets `author_id` to authenticated user and `status` to 'draft'.

**Endpoint**: `POST /api/pages`

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "New Page",
  "slug": "new-page",
  "data": {
    "sections": []
  },
  "meta_data": {
    "description": "Page description",
    "keywords": ["new"]
  }
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Page title |
| slug | string | Yes | URL-friendly slug (must be unique) |
| data | object | No | Page content (JSON) - defaults to empty object |
| meta_data | object | No | Metadata like SEO, description, etc. |

**Response** (201):
```json
{
  "message": "Page created successfully",
  "page": {
    "id": "page-uuid-789",
    "title": "New Page",
    "slug": "new-page",
    "status": "draft",
    "data": {
      "sections": []
    },
    "meta_data": {
      "description": "Page description",
      "keywords": ["new"]
    },
    "version": 1,
    "author_id": "user-uuid-123",
    "last_modified_by": "user-uuid-123",
    "created_at": "2026-02-09T10:30:00Z",
    "updated_at": "2026-02-09T10:30:00Z"
  }
}
```

**Auto-Set Fields**:
- `status` - Always set to 'draft'
- `author_id` - Set to authenticated user's ID
- `last_modified_by` - Set to authenticated user's ID
- `version` - Set to 1
- `created_at`, `updated_at` - Set to current timestamp

**Error** (409):
```json
{
  "error": "A page with this slug already exists. Please use a different slug.",
  "code": "23505",
  "details": { }
}
```

**Error** (400):
```json
{
  "error": "Missing required fields: title and slug are required",
  "code": "BAD_REQUEST",
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

### 4. Update Page (Protected)

Update a page by slug. Auto-tracks changes in version history.

**Endpoint**: `PUT /api/pages/:slug`

**Authentication**: Required (Bearer token)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Current page slug |

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Updated Title",
  "slug": "new-slug",
  "data": {
    "sections": [
      {
        "type": "hero",
        "heading": "New Hero"
      }
    ]
  },
  "meta_data": {
    "description": "Updated description"
  },
  "status": "review"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | No | Page title |
| slug | string | No | New URL slug (must be unique) |
| data | object | No | Page content (complete JSON) |
| meta_data | object | No | Updated metadata |
| status | enum | No | New status: 'draft', 'review', 'scheduled', 'published', 'archived' |

**Response** (200):
```json
{
  "message": "Page updated successfully",
  "page": {
    "id": "page-uuid-123",
    "title": "Updated Title",
    "slug": "new-slug",
    "status": "review",
    "data": {
      "sections": [
        {
          "type": "hero",
          "heading": "New Hero"
        }
      ]
    },
    "meta_data": {
      "description": "Updated description"
    },
    "version": 6,
    "updated_at": "2026-02-09T11:45:00Z",
    "last_modified_by": "user-uuid-123"
  }
}
```

**Auto-Set Fields**:
- `version` - Auto-incremented by database trigger
- `last_modified_by` - Set to authenticated user's ID
- `updated_at` - Set to current timestamp

**History Tracking**: Each update automatically creates a version entry in `content_history` table via database trigger.

**Error** (409):
```json
{
  "error": "A page with this slug already exists. Please use a different slug.",
  "code": "23505",
  "details": { }
}
```

**Error** (400):
```json
{
  "error": "Invalid status. Must be one of: draft, review, scheduled, published, archived",
  "code": "BAD_REQUEST",
  "details": { "validValues": ["draft", "review", "scheduled", "published", "archived"] }
}
```

**Error** (404):
```json
{
  "error": "Page not found",
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

### 5. Delete Page (Protected)

Permanently delete a page by slug. History is preserved in `content_history` table.

**Endpoint**: `DELETE /api/pages/:slug`

**Authentication**: Required (Bearer token)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Page slug to delete |

**Headers**:
```
Authorization: Bearer <token>
```

**Example**: `DELETE /api/pages/old-page`

**Response** (200):
```json
{
  "message": "Page deleted successfully",
  "deleted_page": {
    "id": "page-uuid-123",
    "title": "Deleted Page",
    "slug": "old-page"
  }
}
```

**Frontend Note**: After deletion, any links to this page will return 404. Consider redirecting or showing archive pages instead.

**Error** (404):
```json
{
  "error": "Page not found",
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

### 6. Get Page History (Protected)

Retrieve version history for a specific page. Shows all changes with who made them and when.

**Endpoint**: `GET /api/pages/:slug/history`

**Authentication**: Required (Bearer token)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Page slug |

**Headers**:
```
Authorization: Bearer <token>
```

**Example**: `GET /api/pages/home/history`

**Response** (200):
```json
{
  "page": {
    "id": "page-uuid-123",
    "title": "Home Page",
    "slug": "home"
  },
  "history": [
    {
      "version": 5,
      "title": "Home Page",
      "status": "published",
      "created_at": "2026-02-05T14:22:00Z",
      "change_summary": "Updated hero section",
      "changed_by_name": "Jane Smith",
      "changed_by_email": "jane@example.com"
    },
    {
      "version": 4,
      "title": "Home",
      "status": "published",
      "created_at": "2026-02-04T10:15:00Z",
      "change_summary": "Updated metadata",
      "changed_by_name": "John Doe",
      "changed_by_email": "john@example.com"
    },
    {
      "version": 3,
      "title": "Home",
      "status": "draft",
      "created_at": "2026-02-03T09:30:00Z",
      "change_summary": "Initial version",
      "changed_by_name": "John Doe",
      "changed_by_email": "john@example.com"
    }
  ]
}
```

**History Fields**:
- `version` - Version number
- `title` - Page title at that version
- `status` - Page status at that version
- `created_at` - When this version was created
- `change_summary` - Description of what changed
- `changed_by_name`, `changed_by_email` - Who made the change

**Sorted by**: Version descending (newest first)

**Error** (404):
```json
{
  "error": "Page not found",
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

### 7. Restore Page Version (Protected)

Restore a page to a previous version. The restoration creates a new version entry in history.

**Endpoint**: `POST /api/pages/:slug/restore/:version`

**Authentication**: Required (Bearer token)

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Page slug |
| version | integer | Yes | Version number to restore to |

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**: None

**Example**: `POST /api/pages/home/restore/3`

**Response** (200):
```json
{
  "message": "Page successfully restored to version 3",
  "page": {
    "id": "page-uuid-123",
    "title": "Home Page",
    "slug": "home",
    "status": "draft",
    "data": {
      "sections": [
        {
          "type": "hero",
          "heading": "Original Hero"
        }
      ]
    },
    "meta_data": {
      "description": "Original description"
    },
    "version": 8,
    "updated_at": "2026-02-09T12:00:00Z"
  }
}
```

**After Restoration**:
- Page content, title, status, and metadata are restored from the specified version
- A new version is created (version increments)
- The new version is recorded in history with restored_by user
- `last_modified_by` is set to the authenticated user

**Error** (404):
```json
{
  "error": "Version 10 not found for this page",
  "code": "NOT_FOUND",
  "details": { }
}
```

**Error** (400):
```json
{
  "error": "Version must be a valid number",
  "code": "BAD_REQUEST",
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

## Data Types

### Page Content (data field)

The `data` field is a flexible JSON object. Structure depends on your page builder/renderer:

**Example for Content Page**:
```json
{
  "sections": [
    {
      "type": "hero",
      "heading": "Welcome",
      "subheading": "To our site",
      "background_image": "url",
      "cta_text": "Get Started",
      "cta_link": "/signup"
    },
    {
      "type": "features",
      "title": "Why Choose Us",
      "items": [
        {
          "icon": "star",
          "title": "Feature 1",
          "description": "Description"
        }
      ]
    },
    {
      "type": "testimonials",
      "items": [...]
    }
  ]
}
```

**Example for Blog Post**:
```json
{
  "title": "Blog Post Title",
  "excerpt": "Short excerpt",
  "content": "Full HTML/markdown content",
  "featured_image": "url",
  "tags": ["tag1", "tag2"],
  "author_note": "Optional note"
}
```

### Page Metadata (meta_data field)

Structured metadata for SEO and page configuration:

```json
{
  "description": "Page meta description (SEO)",
  "keywords": ["keyword1", "keyword2"],
  "og_title": "Open Graph title",
  "og_description": "OG description",
  "og_image": "OG image URL",
  "canonical_url": "Canonical URL",
  "robots": "index, follow",
  "author": "Author name",
  "publish_date": "2026-02-01",
  "custom_field": "custom_value"
}
```

---

## Version Control & History

Every page change is automatically tracked:

1. **Automatic Versioning**: Version number increments on each update
2. **History Table**: `content_history` stores all changes (via database trigger)
3. **Restoration**: Can restore to any previous version
4. **Audit Trail**: Each change records who made it and when

---

## Error Codes Reference

| Code | HTTP | Meaning | Action |
|------|------|---------|--------|
| UNAUTHORIZED | 401 | Invalid/missing token | Get new token |
| BAD_REQUEST | 400 | Invalid input | Check request body |
| NOT_FOUND | 404 | Page/version not found | Verify slug/version |
| CONFLICT | 409 | Slug already exists | Use different slug |
| DATABASE_ERROR | 500 | Database error | Retry or contact support |
| 23505 | 409 | Unique constraint (slug) | Use different slug |
| PGRST116 | 404 | PostgREST not found | Page doesn't exist |

---

## Best Practices for Frontend

1. **Slug Generation**: Auto-generate from title, ensure uniqueness
2. **Status Workflow**: draft → review → scheduled → published
3. **Content Validation**: Validate `data` structure before sending
4. **Optimistic Updates**: Show changes immediately, sync in background
5. **History Tracking**: Show version history dropdown when editing
6. **Restoration Confirmation**: Confirm before restoring to old version
7. **Autosave**: Periodically save drafts while editing
8. **Conflict Resolution**: Handle concurrent edits gracefully
9. **URL-friendly**: Slugs should be lowercase, no special chars, use hyphens
10. **Caching**: Cache full page data (slug doesn't change often)

---

## Example Workflows

### Create and Publish a Page

```
1. POST /api/pages
   → Returns page with status: draft

2. PUT /api/pages/:slug
   → Update data, title, metadata
   → Status stays draft initially

3. PUT /api/pages/:slug
   → Change status to review
   → Send for approval

4. PUT /api/pages/:slug
   → Change status to published
   → Page is now live
```

### Edit and Restore

```
1. GET /api/pages/:slug
   → Edit content

2. PUT /api/pages/:slug
   → Save changes
   → Version increments (2 → 3)

3. PUT /api/pages/:slug
   → More changes
   → Version increments (3 → 4)

4. GET /api/pages/:slug/history
   → User sees version 4 is broken

5. POST /api/pages/:slug/restore/3
   → Restores to version 3
   → Creates version 5 with restored content
```

### Draft to Scheduled to Published

```
1. Create page (status: draft)

2. Schedule publication:
   - PUT /api/pages/:slug { status: scheduled }
   - Add publish_date to meta_data

3. On scheduled date:
   - PUT /api/pages/:slug { status: published }
   - Frontend could do this automatically
```

---

## Rate Limiting

No rate limiting currently. Add middleware as needed.

---

## CORS

CORS enabled for all origins. Tighten in production.

---

## Questions?

Contact backend team for API support or feature requests.
