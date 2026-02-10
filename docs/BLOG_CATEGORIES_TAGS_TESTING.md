# Blog Categories & Tags Testing Guide

This guide provides step-by-step instructions for testing the Blog Categories and Tags system.

## Prerequisites

- Running Node.js server
- Valid authentication token
- Postman or curl installed
- Database migration applied to Supabase

## Database Migration

Before testing, apply the migration to create the new tables:

```bash
# The migration file is located at:
# supabase/migrations/20260210000001_create_blog_categories_tags.sql

# This migration creates:
# - blog_categories table
# - blog_tags table  
# - blog_post_tags junction table
# - Updates blog_posts to add category_id FK
# - Adds RLS policies for public read, authenticated write
```

## Testing Steps

### 1. Create Categories

Create a few test categories:

**Request 1: Create Technology Category**
```bash
curl -X POST http://localhost:5000/api/blog/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and programming articles"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "... generated uuid ...",
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and programming articles",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Request 2: Create Business Category**
```bash
curl -X POST http://localhost:5000/api/blog/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Business",
    "slug": "business",
    "description": "Business insights and strategies"
  }'
```

**Request 3: Create Lifestyle Category**
```bash
curl -X POST http://localhost:5000/api/blog/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lifestyle",
    "slug": "lifestyle",
    "description": "Lifestyle tips and tricks"
  }'
```

Save the `id` values returned for these categories - you'll need them for creating posts.

### 2. Create Tags

Create several test tags:

**Request 1: Create JavaScript Tag**
```bash
curl -X POST http://localhost:5000/api/blog/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "javascript",
    "slug": "javascript"
  }'
```

**Request 2: Create Node.js Tag**
```bash
curl -X POST http://localhost:5000/api/blog/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nodejs",
    "slug": "nodejs"
  }'
```

**Request 3: Create API Tag**
```bash
curl -X POST http://localhost:5000/api/blog/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api",
    "slug": "api"
  }'
```

**Request 4: Create Database Tag**
```bash
curl -X POST http://localhost:5000/api/blog/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "database",
    "slug": "database"
  }'
```

**Request 5: Create Testing Tag**
```bash
curl -X POST http://localhost:5000/api/blog/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "testing",
    "slug": "testing"
  }'
```

Save the `id` values returned for these tags.

### 3. Get All Categories (Public)

Test the public read endpoint:

```bash
curl -X GET http://localhost:5000/api/blog/categories
```

**Expected Response (200):**
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology and programming articles",
      "created_at": "...",
      "updated_at": "..."
    },
    // ... more categories
  ],
  "total": 3
}
```

### 4. Get All Tags (Public)

```bash
curl -X GET http://localhost:5000/api/blog/tags
```

**Expected Response (200):**
```json
{
  "tags": [
    {
      "id": "...",
      "name": "javascript",
      "slug": "javascript",
      "created_at": "...",
      "updated_at": "..."
    },
    // ... more tags
  ],
  "total": 5
}
```

### 5. Create Blog Posts with Categories and Tags

Now create blog posts with category and tag relationships:

**Request 1: Create Post with Category and Multiple Tags**

Use the UUIDs from the categories and tags created above:

```bash
curl -X POST http://localhost:5000/api/blog-pages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Node.js",
    "slug": "getting-started-nodejs",
    "content": "Node.js is a JavaScript runtime built on Chromes V8 JavaScript engine...",
    "excerpt": "Learn the basics of Node.js development",
    "category_id": "TECHNOLOGY_CATEGORY_UUID",
    "tag_ids": ["JAVASCRIPT_TAG_UUID", "NODEJS_TAG_UUID", "TESTING_TAG_UUID"],
    "status": "published"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Blog post created successfully",
  "post": {
    "id": "...",
    "title": "Getting Started with Node.js",
    "slug": "getting-started-nodejs",
    "status": "published",
    "excerpt": "Learn the basics of Node.js development",
    "category_id": "TECHNOLOGY_CATEGORY_UUID",
    "tag_ids": ["JAVASCRIPT_TAG_UUID", "NODEJS_TAG_UUID", "TESTING_TAG_UUID"],
    // ... other fields
  }
}
```

**Request 2: Create Another Post**

```bash
curl -X POST http://localhost:5000/api/blog-pages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Building RESTful APIs with Express",
    "slug": "building-restful-apis-express",
    "content": "Express is a minimal and flexible Node.js web application framework...",
    "excerpt": "Learn how to build REST APIs with Express.js",
    "category_id": "TECHNOLOGY_CATEGORY_UUID",
    "tag_ids": ["API_TAG_UUID", "NODEJS_TAG_UUID"],
    "status": "published"
  }'
```

**Request 3: Create Business Post**

```bash
curl -X POST http://localhost:5000/api/blog-pages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scaling Your Startup",
    "slug": "scaling-your-startup",
    "content": "Scaling a startup requires careful planning...",
    "excerpt": "Business strategies for startup growth",
    "category_id": "BUSINESS_CATEGORY_UUID",
    "tag_ids": [],
    "status": "published"
  }'
```

### 6. Test Filtering by Category

Retrieve posts filtered by the Technology category:

```bash
curl -X GET "http://localhost:5000/api/blog-pages?category_id=TECHNOLOGY_CATEGORY_UUID"
```

**Expected Response (200):**
```json
{
  "posts": [
    {
      "id": "...",
      "title": "Getting Started with Node.js",
      "slug": "getting-started-nodejs",
      "category_id": "TECHNOLOGY_CATEGORY_UUID",
      "category": {
        "id": "TECHNOLOGY_CATEGORY_UUID",
        "name": "Technology",
        "slug": "technology"
      },
      "tag_ids": ["...", "...", "..."],
      // ... other fields
    },
    {
      "id": "...",
      "title": "Building RESTful APIs with Express",
      "slug": "building-restful-apis-express",
      "category_id": "TECHNOLOGY_CATEGORY_UUID",
      "category": {
        "id": "TECHNOLOGY_CATEGORY_UUID",
        "name": "Technology",
        "slug": "technology"
      },
      "tag_ids": ["...", "..."],
      // ... other fields
    }
  ],
  "total": 2
}
```

### 7. Test Filtering by Single Tag

Retrieve posts with a specific tag:

```bash
curl -X GET "http://localhost:5000/api/blog-pages?tag_ids=NODEJS_TAG_UUID"
```

**Expected Response (200):**
```json
{
  "posts": [
    {
      "title": "Getting Started with Node.js",
      // ... includes this post because it has nodejs tag
    },
    {
      "title": "Building RESTful APIs with Express",
      // ... includes this post because it has nodejs tag
    }
  ],
  "total": 2
}
```

### 8. Test Filtering by Multiple Tags

Retrieve posts with any of the specified tags:

```bash
curl -X GET "http://localhost:5000/api/blog-pages?tag_ids=NODEJS_TAG_UUID,DATABASE_TAG_UUID"
```

This returns posts that have EITHER nodejs OR database tag.

### 9. Test Filtering by Category and Tags

Combine category and tag filters:

```bash
curl -X GET "http://localhost:5000/api/blog-pages?category_id=TECHNOLOGY_CATEGORY_UUID&tag_ids=API_TAG_UUID"
```

This returns posts in the Technology category that also have the API tag.

### 10. Get Post Details with Full Relationships

Retrieve a single post with complete category and tag information:

```bash
curl -X GET http://localhost:5000/api/blog-pages/getting-started-nodejs
```

**Expected Response (200):**
```json
{
  "post": {
    "id": "...",
    "title": "Getting Started with Node.js",
    "slug": "getting-started-nodejs",
    "content": "...",
    "category_id": "TECHNOLOGY_CATEGORY_UUID",
    "category": {
      "id": "TECHNOLOGY_CATEGORY_UUID",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology and programming articles"
    },
    "tag_ids": ["JAVASCRIPT_TAG_UUID", "NODEJS_TAG_UUID", "TESTING_TAG_UUID"],
    "tags": [
      {
        "id": "JAVASCRIPT_TAG_UUID",
        "name": "javascript",
        "slug": "javascript"
      },
      {
        "id": "NODEJS_TAG_UUID",
        "name": "nodejs",
        "slug": "nodejs"
      },
      {
        "id": "TESTING_TAG_UUID",
        "name": "testing",
        "slug": "testing"
      }
    ],
    // ... other fields
  }
}
```

### 11. Update Category

Test updating a category:

```bash
curl -X PUT http://localhost:5000/api/blog/categories/technology \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech & Programming",
    "description": "Updated description"
  }'
```

### 12. Update Blog Post Tags

Update a post to change its tags:

```bash
curl -X PUT http://localhost:5000/api/blog-pages/getting-started-nodejs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_ids": ["JAVASCRIPT_TAG_UUID", "NODEJS_TAG_UUID"]
  }'
```

### 13. Update Blog Post Category

Change a post's category:

```bash
curl -X PUT http://localhost:5000/api/blog-pages/scaling-your-startup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "TECHNOLOGY_CATEGORY_UUID"
  }'
```

### 14. Delete Operations

**Delete a tag:**
```bash
curl -X DELETE http://localhost:5000/api/blog/tags/testing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note:** Deleting a tag removes it from all posts due to CASCADE delete on the junction table.

**Delete a category:**
```bash
curl -X DELETE http://localhost:5000/api/blog/categories/lifestyle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note:** When a category is deleted, posts with that category will have `category_id` set to NULL.

## Error Testing

### Test Missing Authorization

```bash
curl -X POST http://localhost:5000/api/blog/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "slug": "test"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

### Test Duplicate Slug

Create two categories with the same slug:

```bash
curl -X POST http://localhost:5000/api/blog/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech",
    "slug": "technology"
  }'
```

**Expected Response (409):**
```json
{
  "error": "A category with this name or slug already exists",
  "status": 409
}
```

### Test Invalid Category

Try to get a non-existent category:

```bash
curl -X GET http://localhost:5000/api/blog/categories/nonexistent
```

**Expected Response (404):**
```json
{
  "error": "Category not found",
  "status": 404
}
```

## Summary

After completing all tests:

- ✅ Categories CRUD operations work
- ✅ Tags CRUD operations work
- ✅ Posts can be created with categories and tags
- ✅ Filtering by category works
- ✅ Filtering by tags works
- ✅ Filtering by category + tags works
- ✅ Post details include full category and tag relationships
- ✅ Authorization is properly enforced
- ✅ Validation and error handling work correctly

## Cleanup

To reset and retest:

1. Delete all blog posts
2. Delete all tags
3. Delete all categories
4. Repeat the testing steps

Or run a fresh migration to reset all tables to empty state.
