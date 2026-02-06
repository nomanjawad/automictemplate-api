# API Reference

Base URL: `http://localhost:3000/api`

---

## Health Check

### GET /health
Check service health status.

**Response:**
```json
{
  "ok": true,
  "status": {
    "healthy": true,
    "timestamp": "2025-12-10T09:00:00.000Z",
    "services": {
      "supabaseAPI": { "ok": true },
      "supabaseAuth": { "ok": true, "sessionActive": false },
      "supabaseStorage": { "ok": true, "bucketsCount": 0 }
    }
  }
}
```

---

## Authentication

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`

---

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK` with access_token, refresh_token

---

### POST /auth/logout
Logout current user.

---

### GET /auth/me 🔒
Get current user profile. Requires `Authorization: Bearer <token>` header.

---

## Content Management

### Common Content (header, footer, CTA, etc.)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content/common` | List all common content |
| GET | `/content/common/:key` | Get by key |
| PUT | `/content/common/:key` | Create/update by key 🔒 |
| DELETE | `/content/common/:key` | Delete by key 🔒 |

**PUT Request:**
```json
{
  "data": { "title": "...", "description": "..." }
}
```

---

### Page Content (home, about, contact, etc.)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content/pages` | List all pages |
| GET | `/content/pages/:slug` | Get page by slug |
| PUT | `/content/pages/:slug` | Create/update page 🔒 |
| DELETE | `/content/pages/:slug` | Delete page 🔒 |

**PUT Request:**
```json
{
  "title": "About Us",
  "data": { "banner": {...}, "sections": [...] },
  "meta_data": { "metaTitle": "...", "metaDescription": "..." },
  "published": true
}
```

---

## Blog Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/blog` | List posts (?published=true&limit=10&offset=0) |
| GET | `/blog/:slug` | Get post by slug |
| POST | `/blog` | Create post 🔒 |
| PUT | `/blog/:slug` | Update post 🔒 |
| DELETE | `/blog/:slug` | Delete post 🔒 |
| POST | `/blog/:slug/publish` | Publish post 🔒 |
| POST | `/blog/:slug/unpublish` | Unpublish post 🔒 |

**POST/PUT Request:**
```json
{
  "slug": "my-post",
  "title": "My Post Title",
  "excerpt": "Short description",
  "content": { "blocks": [...] },
  "featured_image": "https://...",
  "tags": ["news", "update"],
  "published": false
}
```

---

## File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload single image |
| POST | `/upload/images` | Upload multiple images |
| GET | `/upload/images/:folder?` | List images in folder |
| DELETE | `/upload/image` | Delete image |

**Upload Request:** `multipart/form-data` with `file` field  
**Query param:** `?folder=blog` to organize by folder

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "blog/123456-abc.jpg",
    "url": "https://...supabase.co/storage/v1/object/public/images/...",
    "size": 12345,
    "mimetype": "image/jpeg"
  }
}
```

---

## Admin

### GET /admin/status
Get system configuration status.

---

🔒 = Requires authentication (`Authorization: Bearer <token>`)
