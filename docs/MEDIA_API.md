# Media API Documentation

Complete reference for all media and image management endpoints.

**Base URL:** `http://localhost:3000/api/media`

---

## Table of Contents

1. [Folder Management](#folder-management)
   - [Get All Folders](#1-get-all-folders)
   - [Create Folder](#2-create-folder)
   - [Delete Folder](#3-delete-folder)
   - [Get Media by Folder](#4-get-media-by-folder)
2. [Media Upload](#media-upload)
   - [Upload Media](#5-upload-media)
3. [Media Retrieval](#media-retrieval)
   - [Get All Media](#6-get-all-media)
   - [Get Media by ID](#7-get-media-by-id)
4. [Media Management](#media-management)
   - [Update Media Metadata](#8-update-media-metadata)
   - [Move Media to Different Folder](#9-move-media-to-different-folder)
   - [Delete Media](#10-delete-media)
   - [Bulk Delete Media](#11-bulk-delete-media)

---

## Overview

The Media API provides endpoints for:
- **Folder Management**: Organize media into folders/categories
- **Image Upload**: Upload images with metadata to Supabase Storage
- **Media Library**: Browse, filter, and search media items
- **Metadata Management**: Update titles, descriptions, and alt text
- **Media Organization**: Move items between folders
- **Bulk Operations**: Delete multiple items at once

**Storage Backend:** Supabase Storage  
**Bucket:** `images` (configurable via `SUPABASE_STORAGE_BUCKET`)  
**Max File Size:** 2 MB  
**Allowed Types:** JPEG, PNG, GIF, WebP, SVG

---

## Folder Management

### 1. Get All Folders

Retrieve a list of all media folders.

**Endpoint:** `GET /api/media/folders`  
**Authentication:** None (Public)

#### Request

```bash
curl http://localhost:3000/api/media/folders
```

#### Success Response (200)

```json
{
  "folders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "blog",
      "created_at": "2026-02-20T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "products",
      "created_at": "2026-02-19T08:15:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "banners",
      "created_at": "2026-02-18T14:20:00Z"
    }
  ],
  "total": 3
}
```

---

### 2. Create Folder

Create a new media folder.

**Endpoint:** `POST /api/media/folders`  
**Authentication:** Required

#### Request

```bash
curl -X POST http://localhost:3000/api/media/folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "portfolio"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Folder name (lowercase, alphanumeric, dash, underscore) |

**Folder Name Rules:**
- Must be lowercase
- Can contain: letters (a-z), numbers (0-9), dash (-), underscore (_)
- Must start with a letter or number
- Examples: `blog`, `product-images`, `team_photos`, `banner2024`

#### Success Response (201)

```json
{
  "message": "Folder created successfully",
  "folder": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "portfolio",
    "created_at": "2026-02-20T15:45:00Z"
  }
}
```

#### Error Responses

**400 - Invalid Folder Name**
```json
{
  "error": "Folder name must be lowercase and URL-safe (letters, numbers, dash, underscore)"
}
```

**401 - Unauthorized**
```json
{
  "error": "User not authenticated"
}
```

---

### 3. Delete Folder

Delete a folder and all its media contents.

**Endpoint:** `DELETE /api/media/folders/:name`  
**Authentication:** Required

#### Request

```bash
curl -X DELETE http://localhost:3000/api/media/folders/portfolio \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Folder name to delete |

#### Success Response (200)

```json
{
  "message": "Folder deleted successfully",
  "deleted_folder": "portfolio",
  "deleted_items": 15
}
```

**⚠️ Warning:** This action is irreversible and will delete:
- The folder record
- All media records in the folder
- All files in Supabase Storage for this folder

#### Error Responses

**400 - Invalid Folder**
```json
{
  "error": "Invalid type. Folder does not exist."
}
```

**401 - Unauthorized**
```json
{
  "error": "User not authenticated"
}
```

---

### 4. Get Media by Folder

Get all media items within a specific folder.

**Endpoint:** `GET /api/media/folders/:name/images`  
**Authentication:** None (Public)

#### Request

```bash
curl http://localhost:3000/api/media/folders/blog/images
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Folder name |

#### Success Response (200)

```json
{
  "folder": "blog",
  "media": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "title": "Blog Header Image",
      "description": "Header image for summer blog post",
      "alt_text": "Beach sunset with palm trees",
      "type": "blog",
      "author_name": "John Doe",
      "upload_date": "2026-02-20T10:30:00Z",
      "path": "blog/1708428000-xk9p2j.jpg",
      "url": "https://your-project.supabase.co/storage/v1/object/public/images/blog/1708428000-xk9p2j.jpg",
      "size": 245678,
      "mime_type": "image/jpeg"
    }
  ],
  "total": 1
}
```

---

## Media Upload

### 5. Upload Media

Upload an image file with metadata.

**Endpoint:** `POST /api/media/upload`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

#### Request

```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "title=Product Photo" \
  -F "description=Main product image" \
  -F "alt_text=Red running shoes on white background" \
  -F "type=products"
```

#### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Image file (JPEG, PNG, GIF, WebP, SVG) |
| title | string | Yes | Image title |
| type | string | Yes | Folder/category name (must exist) |
| description | string | No | Detailed description |
| alt_text | string | No | Alt text for accessibility |

**File Constraints:**
- **Max size:** 2 MB
- **Allowed types:** `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

#### Success Response (201)

```json
{
  "message": "Media uploaded successfully",
  "media": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "title": "Product Photo",
    "description": "Main product image",
    "alt_text": "Red running shoes on white background",
    "type": "products",
    "author_name": "John Doe",
    "upload_date": "2026-02-20T16:20:00Z",
    "path": "products/1708434000-abc123.jpg",
    "url": "https://your-project.supabase.co/storage/v1/object/public/images/products/1708434000-abc123.jpg",
    "size": 156789,
    "mime_type": "image/jpeg"
  }
}
```

#### Error Responses

**400 - No File Uploaded**
```json
{
  "error": "No file uploaded"
}
```

**400 - Missing Required Fields**
```json
{
  "error": "Missing required fields: title and type are required"
}
```

**400 - Invalid Folder**
```json
{
  "error": "Invalid type. Folder does not exist."
}
```

**400 - Invalid File Type**
```json
{
  "error": "Invalid file type. Only images are allowed."
}
```

**413 - File Too Large**
```json
{
  "error": "File too large. Maximum size is 2MB"
}
```

---

## Media Retrieval

### 6. Get All Media

Retrieve media items with optional filters.

**Endpoint:** `GET /api/media`  
**Authentication:** None (Public)

#### Request

```bash
# Get all media
curl http://localhost:3000/api/media

# Filter by folder
curl http://localhost:3000/api/media?type=blog

# Filter by author
curl http://localhost:3000/api/media?author=john

# Filter by date range
curl http://localhost:3000/api/media?date_from=2026-02-01&date_to=2026-02-28

# Combine filters
curl http://localhost:3000/api/media?type=products&author=jane
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by folder name |
| author | string | Filter by author name (partial match) |
| date_from | string | Filter from date (ISO 8601: YYYY-MM-DD) |
| date_to | string | Filter to date (ISO 8601: YYYY-MM-DD) |
| mode | string | `multi` (default) or `single` (only one filter allowed) |

**Mode:**
- `multi` - Combine multiple filters
- `single` - Only one filter parameter allowed at a time

#### Success Response (200)

```json
{
  "media": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "title": "Summer Blog Banner",
      "description": "Header for summer article",
      "alt_text": "Sunny beach scene",
      "type": "blog",
      "author_name": "Jane Smith",
      "upload_date": "2026-02-20T11:15:00Z",
      "path": "blog/1708428900-def456.jpg",
      "url": "https://your-project.supabase.co/storage/v1/object/public/images/blog/1708428900-def456.jpg",
      "size": 198765,
      "mime_type": "image/jpeg"
    }
  ],
  "total": 1
}
```

#### Error Responses

**400 - Too Many Filters (mode=single)**
```json
{
  "error": "Only one filter is allowed when mode=single"
}
```

---

### 7. Get Media by ID

Retrieve a specific media item by its ID.

**Endpoint:** `GET /api/media/:id`  
**Authentication:** None (Public)

#### Request

```bash
curl http://localhost:3000/api/media/bb0e8400-e29b-41d4-a716-446655440006
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Media item UUID |

#### Success Response (200)

```json
{
  "media": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "title": "Summer Blog Banner",
    "description": "Header for summer article",
    "alt_text": "Sunny beach scene",
    "type": "blog",
    "author_name": "Jane Smith",
    "upload_date": "2026-02-20T11:15:00Z",
    "path": "blog/1708428900-def456.jpg",
    "url": "https://your-project.supabase.co/storage/v1/object/public/images/blog/1708428900-def456.jpg",
    "size": 198765,
    "mime_type": "image/jpeg"
  }
}
```

#### Error Responses

**404 - Not Found**
```json
{
  "error": "Media item not found"
}
```

---

## Media Management

### 8. Update Media Metadata

Update title, description, and alt text for a media item.

**Endpoint:** `PUT /api/media/:id`  
**Authentication:** Required

#### Request

```bash
curl -X PUT http://localhost:3000/api/media/bb0e8400-e29b-41d4-a716-446655440006 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "alt_text": "Updated alt text"
  }'
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Media item UUID |

#### Request Body (All fields optional)

| Field | Type | Description |
|-------|------|-------------|
| title | string | New title |
| description | string | New description |
| alt_text | string | New alt text |

**Note:** At least one field must be provided. Cannot update `type` via this endpoint (use move endpoint instead).

#### Success Response (200)

```json
{
  "message": "Media updated successfully",
  "media": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "title": "Updated Title",
    "description": "Updated description",
    "alt_text": "Updated alt text",
    "type": "blog",
    "author_name": "Jane Smith",
    "upload_date": "2026-02-20T11:15:00Z",
    "path": "blog/1708428900-def456.jpg",
    "url": "https://your-project.supabase.co/storage/v1/object/public/images/blog/1708428900-def456.jpg",
    "size": 198765,
    "mime_type": "image/jpeg"
  }
}
```

#### Error Responses

**400 - No Fields Provided**
```json
{
  "error": "At least one field must be provided for update"
}
```

**400 - Cannot Update Type**
```json
{
  "error": "Use the move endpoint to change the media folder type"
}
```

**404 - Not Found**
```json
{
  "error": "Media item not found"
}
```

---

### 9. Move Media to Different Folder

Move a media item from one folder to another.

**Endpoint:** `PATCH /api/media/:id/move`  
**Authentication:** Required

#### Request

```bash
curl -X PATCH http://localhost:3000/api/media/bb0e8400-e29b-41d4-a716-446655440006/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "featured"
  }'
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Media item UUID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Destination folder name (must exist) |

#### Success Response (200)

```json
{
  "message": "Media moved successfully",
  "media": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "title": "Summer Blog Banner",
    "description": "Header for summer article",
    "alt_text": "Sunny beach scene",
    "type": "featured",
    "author_name": "Jane Smith",
    "upload_date": "2026-02-20T11:15:00Z",
    "path": "featured/1708428900-def456.jpg",
    "url": "https://your-project.supabase.co/storage/v1/object/public/images/featured/1708428900-def456.jpg",
    "size": 198765,
    "mime_type": "image/jpeg"
  }
}
```

**What Happens:**
1. File is physically moved in Supabase Storage
2. Database record is updated with new path and URL
3. Type/folder is changed to destination

#### Error Responses

**400 - Invalid Destination**
```json
{
  "error": "Invalid destination type"
}
```

**400 - Folder Does Not Exist**
```json
{
  "error": "Invalid type. Folder does not exist."
}
```

**404 - Not Found**
```json
{
  "error": "Media item not found"
}
```

---

### 10. Delete Media

Delete a single media item.

**Endpoint:** `DELETE /api/media/:id`  
**Authentication:** Required

#### Request

```bash
curl -X DELETE http://localhost:3000/api/media/bb0e8400-e29b-41d4-a716-446655440006 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Media item UUID to delete |

#### Success Response (200)

```json
{
  "message": "Media deleted successfully",
  "deleted_id": "bb0e8400-e29b-41d4-a716-446655440006"
}
```

**What Gets Deleted:**
- File from Supabase Storage
- Database record

#### Error Responses

**404 - Not Found**
```json
{
  "error": "Media item not found"
}
```

**401 - Unauthorized**
```json
{
  "error": "User not authenticated"
}
```

---

### 11. Bulk Delete Media

Delete multiple media items at once.

**Endpoint:** `DELETE /api/media`  
**Authentication:** Required

#### Request

```bash
curl -X DELETE http://localhost:3000/api/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "bb0e8400-e29b-41d4-a716-446655440006",
      "cc0e8400-e29b-41d4-a716-446655440007",
      "dd0e8400-e29b-41d4-a716-446655440008"
    ]
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ids | array | Yes | Array of media item UUIDs to delete |

#### Success Response (200)

```json
{
  "message": "Media deleted successfully",
  "deleted_count": 3
}
```

**What Gets Deleted:**
- All files from Supabase Storage
- All database records for the provided IDs

#### Error Responses

**400 - No IDs Provided**
```json
{
  "error": "Media IDs are required for bulk delete"
}
```

**404 - None Found**
```json
{
  "error": "No media items found for the provided IDs"
}
```

---

## Quick Reference

### Endpoint Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/media/folders` | No | Get all folders |
| POST | `/api/media/folders` | Yes | Create folder |
| DELETE | `/api/media/folders/:name` | Yes | Delete folder & contents |
| GET | `/api/media/folders/:name/images` | No | Get media in folder |
| POST | `/api/media/upload` | Yes | Upload media file |
| GET | `/api/media` | No | Get all media (with filters) |
| GET | `/api/media/:id` | No | Get media by ID |
| PUT | `/api/media/:id` | Yes | Update media metadata |
| PATCH | `/api/media/:id/move` | Yes | Move media to folder |
| DELETE | `/api/media/:id` | Yes | Delete media |
| DELETE | `/api/media` | Yes | Bulk delete media |

---

## Usage Examples

### Complete Media Workflow

```javascript
// 1. Create a folder
const createFolderResponse = await fetch('http://localhost:3000/api/media/folders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'portfolio' })
});

// 2. Upload an image
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'My Portfolio Image');
formData.append('description', 'Project screenshot');
formData.append('alt_text', 'Website homepage design');
formData.append('type', 'portfolio');

const uploadResponse = await fetch('http://localhost:3000/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
const { media } = await uploadResponse.json();

// 3. Get all images in folder
const folderMediaResponse = await fetch('http://localhost:3000/api/media/folders/portfolio/images');
const { media: images } = await folderMediaResponse.json();

// 4. Update metadata
await fetch(`http://localhost:3000/api/media/${media.id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated Title',
    description: 'Better description'
  })
});

// 5. Move to different folder
await fetch(`http://localhost:3000/api/media/${media.id}/move`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'featured' })
});

// 6. Delete media
await fetch(`http://localhost:3000/api/media/${media.id}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Filter Media Examples

```javascript
// Get all blog images
const blogImages = await fetch('http://localhost:3000/api/media?type=blog')
  .then(r => r.json());

// Get images by author
const authorImages = await fetch('http://localhost:3000/api/media?author=john')
  .then(r => r.json());

// Get images from date range
const dateRangeImages = await fetch('http://localhost:3000/api/media?date_from=2026-02-01&date_to=2026-02-28')
  .then(r => r.json());

// Single filter mode (only one parameter allowed)
const singleFilter = await fetch('http://localhost:3000/api/media?type=blog&mode=single')
  .then(r => r.json());
```

---

## Best Practices

### 1. Folder Organization
- Create folders for different content types: `blog`, `products`, `team`, `banners`
- Use lowercase, URL-safe names
- Pre-create folders before uploading

### 2. Image Optimization
- Compress images before upload (2MB limit)
- Use appropriate formats: JPEG for photos, PNG for graphics, WebP for modern browsers
- Resize images to appropriate dimensions before upload

### 3. Metadata
- Always provide descriptive `title` and `alt_text` for accessibility
- Use `description` for internal notes or context
- Consistent naming conventions help with searching

### 4. File Management
- Regularly delete unused media
- Use bulk delete for cleanup operations
- Move related images to appropriate folders

### 5. Error Handling
```javascript
try {
  const response = await fetch('http://localhost:3000/api/media/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Upload failed:', error.error);
    // Handle specific errors (413 for file too large, 400 for invalid type, etc.)
  }
  
  const data = await response.json();
  console.log('Uploaded:', data.media.url);
} catch (err) {
  console.error('Network error:', err);
}
```

---

## Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data or missing fields |
| 401 | Unauthorized | Missing or invalid authentication |
| 404 | Not Found | Media item or folder not found |
| 413 | Payload Too Large | File exceeds 2MB limit |
| 500 | Internal Server Error | Server error occurred |

---

## Database Schema

### media_folders Table
```sql
CREATE TABLE media_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### media Table
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  alt_text TEXT,
  type TEXT NOT NULL REFERENCES media_folders(name),
  author_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Tips

1. **Folder Names**: Cannot be changed after creation - plan your folder structure carefully
2. **File URLs**: Public URLs are generated automatically and cached for 1 hour
3. **Author Name**: Automatically populated from authenticated user's profile
4. **File Names**: Automatically generated with timestamp and random string to avoid conflicts
5. **Bulk Operations**: Use bulk delete for better performance when removing multiple items
6. **Filtering**: Combine multiple filters to find exactly what you need
7. **Moving Files**: Move operation updates both storage and database atomically

---

For more API documentation, see:
- [User API](USER_ENDPOINTS.md)
- [Blog API](BLOG_PAGES_API.md)
- [Pages API](PAGES_API.md)
