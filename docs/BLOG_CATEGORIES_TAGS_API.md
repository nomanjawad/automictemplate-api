# Blog Categories & Tags API Documentation

This document describes the self-sustaining Categories and Tags API endpoints that can be used across the entire website, plus blog-specific filtering endpoints.

## Overview

The Categories and Tags system is designed to be:
- **Self-Sustaining**: Categories and tags are managed independently at `/api/categories` and `/api/tags`
- **Reusable**: Can be used for blogs, pages, products, or any other content type across the website
- **Categories**: One-to-many relationship (each post has one category)
- **Tags**: Many-to-many relationship (each post can have multiple tags)
- **Public Read**: All users can read categories and tags
- **Authenticated Write**: Only authenticated users can create/update/delete categories and tags

## Database Schema

### Tables
- `blog_categories`: Stores category information
- `blog_tags`: Stores tag information
- `blog_post_tags`: Junction table for many-to-many relationship

## API Structure

### Self-Sustaining Endpoints
- `/api/categories` - Manage categories (usable for any content type)
- `/api/tags` - Manage tags (usable for any content type)

### Blog-Specific Filtering Endpoints
- `/api/blog-pages/category/:slug` - Get blog posts filtered by category
- `/api/blog-pages/tag/:slug` - Get blog posts filtered by tag

---

## Categories API (Self-Sustaining)

### Get All Categories

Lists all available categories across the entire website.

**Endpoint:** `GET /api/categories`

**Authentication:** Not required (Public)

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology and programming articles",
      "created_at": "2025-02-10T10:30:00.000Z",
      "updated_at": "2025-02-10T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Business",
      "slug": "business",
      "description": "Business insights and strategies",
      "created_at": "2025-02-10T10:30:00.000Z",
      "updated_at": "2025-02-10T10:30:00.000Z"
    }
  ],
  "total": 2
}
```

### Get Category by Slug

Retrieves a specific category by its slug.

**Endpoint:** `GET /api/categories/:slug`

**Authentication:** Not required (Public)

**Parameters:**
- `slug` (string, path) - The category slug (e.g., "technology")

**Response (200 OK):**
```json
{
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and programming articles",
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Category does not exist

### Create Category

Creates a new category.

**Endpoint:** `POST /api/categories`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "Technology",
  "slug": "technology",
  "description": "Technology and programming articles"
}
```

**Required Fields:**
- `name` (string) - Category name
- `slug` (string) - URL-friendly identifier (unique)

**Optional Fields:**
- `description` (string) - Category description

**Response (201 Created):**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and programming articles",
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Category with this name or slug already exists

### Update Category

Updates an existing category.

**Endpoint:** `PUT /api/blog/categories/:slug`

**Authentication:** Required (Bearer token)

**Parameters:**
- `slug` (string, path) - The current category slug

**Request Body:**
```json
{
  "name": "Tech & Programming",
  "slug": "tech-programming",
  "description": "Updated description"
}
```

**Optional Fields:**
- `name` (string) - New category name
- `slug` (string) - New URL-friendly identifier
- `description` (string) - New description

**Response (200 OK):**
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech & Programming",
    "slug": "tech-programming",
    "description": "Updated description",
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - At least one field must be provided for update
- `404 Not Found` - Category does not exist
- `409 Conflict` - New name or slug already exists

### Delete Category

Deletes a category.

**Endpoint:** `DELETE /api/categories/:slug`

**Authentication:** Required (Bearer token)

**Parameters:**
- `slug` (string, path) - The category slug to delete

**Response (200 OK):**
```json
{
  "message": "Category deleted successfully",
  "deleted_category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Technology",
    "slug": "technology"
  }
}
```

**Error Responses:**
- `404 Not Found` - Category does not exist

## Tags API (Self-Sustaining)

### Get All Tags

Lists all available tags across the entire website.

**Endpoint:** `GET /api/tags`

**Authentication:** Not required (Public)

**Response (200 OK):**
```json
{
  "tags": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "javascript",
      "slug": "javascript",
      "created_at": "2025-02-10T10:30:00.000Z",
      "updated_at": "2025-02-10T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "name": "nodejs",
      "slug": "nodejs",
      "created_at": "2025-02-10T10:30:00.000Z",
      "updated_at": "2025-02-10T10:30:00.000Z"
    }
  ],
  "total": 2
}
```

### Get Tag by Slug

Retrieves a specific tag by its slug.

**Endpoint:** `GET /api/tags/:slug`

**Authentication:** Not required (Public)

**Parameters:**
- `slug` (string, path) - The tag slug (e.g., "javascript")

**Response (200 OK):**
```json
{
  "tag": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "javascript",
    "slug": "javascript",
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Tag does not exist

### Create Tag

Creates a new tag.

**Endpoint:** `POST /api/tags`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "name": "javascript",
  "slug": "javascript"
}
```

**Required Fields:**
- `name` (string) - Tag name
- `slug` (string) - URL-friendly identifier (unique)

**Response (201 Created):**
```json
{
  "message": "Tag created successfully",
  "tag": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "javascript",
    "slug": "javascript",
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Tag with this name or slug already exists

### Update Tag

Updates an existing tag.

**Endpoint:** `PUT /api/tags/:slug`

**Authentication:** Required (Bearer token)

**Parameters:**
- `slug` (string, path) - The current tag slug

**Request Body:**
```json
{
  "name": "JavaScript",
  "slug": "js"
}
```

**Optional Fields:**
- `name` (string) - New tag name
- `slug` (string) - New URL-friendly identifier

**Response (200 OK):**
```json
{
  "message": "Tag updated successfully",
  "tag": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "JavaScript",
    "slug": "js",
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - At least one field must be provided for update
- `404 Not Found` - Tag does not exist
- `409 Conflict` - New name or slug already exists

### Delete Tag

Deletes a tag.

**Endpoint:** `DELETE /api/tags/:slug`

**Authentication:** Required (Bearer token)

**Parameters:**
- `slug` (string, path) - The tag slug to delete

**Response (200 OK):**
```json
{
  "message": "Tag deleted successfully",
  "deleted_tag": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "javascript",
    "slug": "javascript"
  }
}
```

**Error Responses:**
- `404 Not Found` - Tag does not exist

## Blog Post Integration

### Blog-Specific Filtering Endpoints

These endpoints are specifically for filtering blog posts by category or tag slug. They provide a clean, SEO-friendly URL structure.

#### Get Blog Posts by Category Slug

Get all blog posts in a specific category using the category's slug.

**Endpoint:** `GET /api/blog-pages/category/:slug`

**Authentication:** Not required (Public)

**Parameters:**
- `slug` (string, path) - The category slug (e.g., "technology")

**Response (200 OK):**
```json
{
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and programming articles"
  },
  "posts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "title": "Getting Started with Node.js",
      "slug": "getting-started-nodejs",
      "status": "published",
      "excerpt": "Learn the basics of Node.js",
      "category_id": "550e8400-e29b-41d4-a716-446655440000",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Technology",
        "slug": "technology"
      },
      "tag_ids": ["..."],
      "author_name": "John Doe",
      "author_email": "john@example.com"
    }
  ],
  "total": 1
}
```

**Error Responses:**
- `404 Not Found` - Category does not exist

**Example Usage:**
```bash
# Get all technology blog posts
curl http://localhost:5000/api/blog-pages/category/technology

# Get all business blog posts
curl http://localhost:5000/api/blog-pages/category/business
```

#### Get Blog Posts by Tag Slug

Get all blog posts with a specific tag using the tag's slug.

**Endpoint:** `GET /api/blog-pages/tag/:slug`

**Authentication:** Not required (Public)

**Parameters:**
- `slug` (string, path) - The tag slug (e.g., "javascript")

**Response (200 OK):**
```json
{
  "tag": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "javascript",
    "slug": "javascript"
  },
  "posts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "title": "Getting Started with Node.js",
      "slug": "getting-started-nodejs",
      "status": "published",
      "excerpt": "Learn the basics of Node.js",
      "category_id": "550e8400-e29b-41d4-a716-446655440000",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Technology",
        "slug": "technology"
      },
      "tag_ids": ["550e8400-e29b-41d4-a716-446655440010", "..."],
      "author_name": "John Doe",
      "author_email": "john@example.com"
    }
  ],
  "total": 1
}
```

**Error Responses:**
- `404 Not Found` - Tag does not exist

**Example Usage:**
```bash
# Get all posts with javascript tag
curl http://localhost:5000/api/blog-pages/tag/javascript

# Get all posts with nodejs tag
curl http://localhost:5000/api/blog-pages/tag/nodejs
```

---

### Creating a Blog Post with Categories and Tags

When creating a blog post, you can now specify a category and multiple tags **using their slugs** (not UUIDs):

**Endpoint:** `POST /api/blog-pages`

**Request Body:**
```json
{
  "title": "Getting Started with Node.js",
  "slug": "getting-started-nodejs",
  "content": "Node.js is a JavaScript runtime...",
  "excerpt": "Learn the basics of Node.js",
  "category": "technology",
  "tags": ["javascript", "nodejs"],
  "status": "published"
}
```

**Fields:**
- `category` (string, optional) - Category slug (e.g., "technology", "business")
  - The backend automatically resolves the slug to the category ID
  - Returns error if category doesn't exist
- `tags` (array of strings, optional) - Array of tag slugs (e.g., ["javascript", "nodejs"])
  - The backend automatically resolves slugs to tag IDs
  - Returns error if any tag doesn't exist

### Updating a Blog Post with Categories and Tags

**Endpoint:** `PUT /api/blog-pages/:slug`

**Request Body:**
```json
{
  "title": "Getting Started with Node.js - Updated",
  "category": "tutorials",
  "tags": ["javascript", "nodejs", "beginner"]
}
```

**Note:** 
- To remove category: set `"category": null` or `"category": ""`
- To remove all tags: set `"tags": []`
- Tags and category are optional; only send them if you want to update them

### Filtering Blog Posts by Category and Tags

**Endpoint:** `GET /api/blog-pages`

**Query Parameters:**
- `category_id` (string, optional) - Filter by category UUID
- `tag_ids` (string, optional) - Filter by tags (comma-separated UUIDs)

**Examples:**

Filter by category only:
```
GET /api/blog-pages?category_id=550e8400-e29b-41d4-a716-446655440000
```

Filter by single tag:
```
GET /api/blog-pages?tag_ids=550e8400-e29b-41d4-a716-446655440010
```

Filter by multiple tags (returns posts with ANY of the specified tags):
```
GET /api/blog-pages?tag_ids=550e8400-e29b-41d4-a716-446655440010,550e8400-e29b-41d4-a716-446655440011
```

Filter by both category and tags:
```
GET /api/blog-pages?category_id=550e8400-e29b-41d4-a716-446655440000&tag_ids=550e8400-e29b-41d4-a716-446655440010
```

**Response (200 OK):**
```json
{
  "posts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "title": "Getting Started with Node.js",
      "slug": "getting-started-nodejs",
      "status": "published",
      "excerpt": "Learn the basics of Node.js",
      "featured_image": null,
      "meta_data": null,
      "published": true,
      "published_at": "2025-02-10T10:30:00.000Z",
      "view_count": 150,
      "reading_time_minutes": 8,
      "created_at": "2025-02-10T10:30:00.000Z",
      "updated_at": "2025-02-10T11:00:00.000Z",
      "version": 1,
      "author_id": "user-123",
      "category_id": "550e8400-e29b-41d4-a716-446655440000",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Technology",
        "slug": "technology"
      },
      "tag_ids": [
        "550e8400-e29b-41d4-a716-446655440010",
        "550e8400-e29b-41d4-a716-446655440011"
      ],
      "author_name": "John Doe",
      "author_email": "john@example.com"
    }
  ],
  "total": 1
}
```

### Getting Blog Post Details with Category and Tags

**Endpoint:** `GET /api/blog-pages/:slug`

**Response (200 OK):**
```json
{
  "post": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "title": "Getting Started with Node.js",
    "slug": "getting-started-nodejs",
    "content": "Node.js is a JavaScript runtime...",
    "status": "published",
    "excerpt": "Learn the basics of Node.js",
    "featured_image": null,
    "meta_data": null,
    "published": true,
    "published_at": "2025-02-10T10:30:00.000Z",
    "view_count": 150,
    "reading_time_minutes": 8,
    "created_at": "2025-02-10T10:30:00.000Z",
    "updated_at": "2025-02-10T11:00:00.000Z",
    "version": 1,
    "author_id": "user-123",
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "category": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology and programming articles"
    },
    "tag_ids": [
      "550e8400-e29b-41d4-a716-446655440010",
      "550e8400-e29b-41d4-a716-446655440011"
    ],
    "tags": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "javascript",
        "slug": "javascript"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "name": "nodejs",
        "slug": "nodejs"
      }
    ],
    "author_name": "John Doe",
    "author_email": "john@example.com"
  }
}
```

## Common Use Cases

### Frontend: Display Category Dropdown on Post Creation Form

```javascript
// Fetch all categories for dropdown
async function loadCategories() {
  const response = await fetch('/api/categories')
  const data = await response.json()
  // Populate dropdown with data.categories
}
```

### Frontend: Display Tag List on Post Creation Form

```javascript
// Fetch all tags for selection
async function loadTags() {
  const response = await fetch('/api/tags')
  const data = await response.json()
  // Populate tag selection with data.tags
}
```

### Frontend: Filter Blog Posts by Category (Using Slug)

```javascript
// Get blogs by category slug (SEO-friendly URLs)
async function filterByCategory(categorySlug) {
  const response = await fetch(`/api/blog-pages/category/${categorySlug}`)
  const data = await response.json()
  // Display data.posts and data.category information
}
```

### Frontend: Filter Blog Posts by Tag (Using Slug)

```javascript
// Get blogs by tag slug (SEO-friendly URLs)
async function filterByTag(tagSlug) {
  const response = await fetch(`/api/blog-pages/tag/${tagSlug}`)
  const data = await response.json()
  // Display data.posts and data.tag information
}
```

### Frontend: Filter Blog Posts by Category ID (Alternative Method)

```javascript
// If you have the category object, you can filter by ID directly
async function filterByCategoryId(categoryId) {
  const response = await fetch(`/api/blog-pages?category_id=${categoryId}`)
  const data = await response.json()
  // Display data.posts
}
```

**Note:** The primary/recommended method is to use category slug (`/api/blog-pages/category/:slug`) for SEO-friendly URLs.

### Frontend: Filter Blog Posts by Multiple Tags (Alternative Method)

```javascript
// Get tag IDs from user selection
async function filterByTagIds(tagIds) {
  const response = await fetch(`/api/blog-pages?tag_ids=${tagIds.join(',')}`)
  const data = await response.json()
  // Display data.posts
}
```

## Error Handling

All endpoints follow standard HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success (GET, PUT) |
| 201 | Resource created (POST) |
| 400 | Bad request (validation errors) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Resource not found |
| 409 | Conflict (duplicate name/slug) |
| 500 | Internal server error |

Error responses include a message explaining the issue:
```json
{
  "error": "Category not found",
  "status": 404,
  "timestamp": "2025-02-10T11:00:00.000Z"
}
```

## Authentication

Protected endpoints require:
- Authorization header: `Authorization: Bearer <token>`
- Valid JWT token from authentication system

Example curl request:
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "slug": "technology",
    "description": "Tech articles"
  }'
```

## Rate Limiting

Currently unlimited. Consider implementing rate limiting in production.

## Future Enhancements

- Pagination for large category/tag lists
- Search functionality for categories and tags
- Soft delete for categories and tags
- Category hierarchy (parent/child categories)
- Tag suggestions based on post content
- Bulk operations (bulk tag assignment)
