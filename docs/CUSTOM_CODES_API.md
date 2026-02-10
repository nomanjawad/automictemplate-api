# Custom Codes API Documentation

## Overview

The Custom Codes API provides comprehensive endpoints for managing analytics scripts, meta tags, tracking codes, and other custom HTML code snippets that need to be injected into your website.

**Base URL:** `/api/custom-codes`

## Key Features

- **Multiple Code Types**: Analytics, Meta Tags, Tracking Codes, Verification Codes, and Custom HTML
- **Flexible Placement**: Inject code into `<head>`, start of `<body>`, or end of `<body>`
- **Status Management**: Activate/deactivate codes without deleting them
- **Public Access**: Retrieve active codes for frontend injection
- **Full CRUD**: Complete create, read, update, delete operations
- **Type Filtering**: Filter codes by type for better management

## Database Schema

```sql
CREATE TABLE custom_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('analytics', 'meta', 'tracking', 'verification', 'custom')),
  position TEXT NOT NULL CHECK (position IN ('head', 'body_start', 'body_end')),
  author_name TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### 1. Get All Custom Codes

**Route:** `GET /api/custom-codes`
**Authentication:** Public
**Description:** Retrieve all custom codes with pagination support

**Response:**
```json
{
  "codes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Google Analytics",
      "code": "<!-- Google Analytics -->\n<script>...</script>",
      "type": "analytics",
      "position": "head",
      "author_name": "admin@example.com",
      "status": true,
      "created_at": "2025-02-10T12:00:00Z",
      "updated_at": "2025-02-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 2. Get Active Custom Codes (Public API)

**Route:** `GET /api/custom-codes/active`
**Authentication:** Public
**Description:** Get all active codes grouped by position (optimized for frontend injection)

**Response:**
```json
{
  "codes": {
    "head": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Google Analytics",
        "code": "<!-- Google Analytics -->\n<script>...</script>",
        "type": "analytics",
        "position": "head",
        "author_name": "admin@example.com",
        "status": true,
        "created_at": "2025-02-10T12:00:00Z",
        "updated_at": "2025-02-10T12:00:00Z"
      }
    ],
    "body_start": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "name": "Facebook Pixel",
        "code": "<!-- Facebook Pixel -->\n<img height=\"1\" width=\"1\" ... />",
        "type": "tracking",
        "position": "body_start",
        "author_name": "admin@example.com",
        "status": true,
        "created_at": "2025-02-10T12:00:00Z",
        "updated_at": "2025-02-10T12:00:00Z"
      }
    ],
    "body_end": []
  },
  "total": 2
}
```

---

### 3. Get Custom Codes by Type

**Route:** `GET /api/custom-codes/type/:type`
**Authentication:** Public
**Description:** Filter codes by type
**Parameters:**
- `type` (string, required): One of `analytics`, `meta`, `tracking`, `verification`, `custom`

**Example Request:**
```bash
curl http://localhost:3000/api/custom-codes/type/analytics
```

**Response:**
```json
{
  "type": "analytics",
  "codes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Google Analytics",
      "code": "<!-- Google Analytics -->\n<script>...</script>",
      "type": "analytics",
      "position": "head",
      "author_name": "admin@example.com",
      "status": true,
      "created_at": "2025-02-10T12:00:00Z",
      "updated_at": "2025-02-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 4. Get Custom Code by ID

**Route:** `GET /api/custom-codes/:id`
**Authentication:** Public
**Description:** Retrieve a specific custom code by ID
**Parameters:**
- `id` (string, required): The UUID of the custom code

**Example Request:**
```bash
curl http://localhost:3000/api/custom-codes/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "code": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Google Analytics",
    "code": "<!-- Google Analytics -->\n<script>...</script>",
    "type": "analytics",
    "position": "head",
    "author_name": "admin@example.com",
    "status": true,
    "created_at": "2025-02-10T12:00:00Z",
    "updated_at": "2025-02-10T12:00:00Z"
  }
}
```

---

### 5. Create Custom Code

**Route:** `POST /api/custom-codes`
**Authentication:** Required (Bearer token)
**Description:** Create a new custom code
**Request Body:**
```json
{
  "name": "Google Analytics",
  "code": "<!-- Google Analytics -->\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=GA_ID\"></script>\n<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'GA_ID');</script>",
  "type": "analytics",
  "position": "head",
  "author_name": "John Doe",
  "status": true
}
```

**Field Descriptions:**
- `name` (string, required): Descriptive name for the code
- `code` (string, required): The actual HTML/JavaScript code to inject
- `type` (string, required): One of `analytics`, `meta`, `tracking`, `verification`, `custom`
- `position` (string, required): One of `head`, `body_start`, `body_end`
- `author_name` (string, optional): Name of the person adding the code (defaults to current user)
- `status` (boolean, optional): Whether code is active (defaults to `true`)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/custom-codes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Analytics",
    "code": "<script async src=\"https://www.googletagmanager.com/gtag/js?id=GA_ID\"></script>",
    "type": "analytics",
    "position": "head"
  }'
```

**Response:** (201 Created)
```json
{
  "message": "Custom code created successfully",
  "code": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Google Analytics",
    "code": "<script async src=\"https://www.googletagmanager.com/gtag/js?id=GA_ID\"></script>",
    "type": "analytics",
    "position": "head",
    "author_name": "user@example.com",
    "status": true,
    "created_at": "2025-02-10T12:00:00Z",
    "updated_at": "2025-02-10T12:00:00Z"
  }
}
```

---

### 6. Update Custom Code

**Route:** `PUT /api/custom-codes/:id`
**Authentication:** Required (Bearer token)
**Description:** Update an existing custom code
**Parameters:**
- `id` (string, required): The UUID of the custom code

**Request Body:** (at least one field required)
```json
{
  "name": "Updated Name",
  "code": "<!-- Updated code -->",
  "type": "analytics",
  "position": "head",
  "author_name": "Jane Doe",
  "status": true
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/custom-codes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": false,
    "code": "<!-- Updated Google Analytics code -->"
  }'
```

**Response:**
```json
{
  "message": "Custom code updated successfully",
  "code": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Google Analytics",
    "code": "<!-- Updated Google Analytics code -->",
    "type": "analytics",
    "position": "head",
    "author_name": "admin@example.com",
    "status": false,
    "created_at": "2025-02-10T12:00:00Z",
    "updated_at": "2025-02-10T14:00:00Z"
  }
}
```

---

### 7. Toggle Custom Code Status

**Route:** `PATCH /api/custom-codes/:id/toggle`
**Authentication:** Required (Bearer token)
**Description:** Toggle the status of a custom code (active/inactive)
**Parameters:**
- `id` (string, required): The UUID of the custom code

**Example Request:**
```bash
curl -X PATCH http://localhost:3000/api/custom-codes/550e8400-e29b-41d4-a716-446655440000/toggle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Custom code disabled successfully",
  "code": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Google Analytics",
    "code": "<script async src=\"https://www.googletagmanager.com/gtag/js?id=GA_ID\"></script>",
    "type": "analytics",
    "position": "head",
    "author_name": "admin@example.com",
    "status": false,
    "created_at": "2025-02-10T12:00:00Z",
    "updated_at": "2025-02-10T14:05:00Z"
  }
}
```

---

### 8. Delete Custom Code

**Route:** `DELETE /api/custom-codes/:id`
**Authentication:** Required (Bearer token)
**Description:** Permanently delete a custom code
**Parameters:**
- `id` (string, required): The UUID of the custom code

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/custom-codes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Custom code deleted successfully",
  "deleted_code": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Google Analytics"
  }
}
```

---

## Common Use Cases

### Adding Google Analytics

```json
{
  "name": "Google Analytics",
  "code": "<!-- Google Analytics -->\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX\"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXXXXXXX');\n</script>",
  "type": "analytics",
  "position": "head"
}
```

### Adding Facebook Pixel

```json
{
  "name": "Facebook Pixel",
  "code": "<!-- Facebook Pixel -->\n<img height=\"1\" width=\"1\" style=\"display:none\" src=\"https://www.facebook.com/tr?id=XXXXXXXXX&ev=PageView&noscript=1\" />",
  "type": "tracking",
  "position": "body_start"
}
```

### Adding Meta Tags

```json
{
  "name": "Open Graph Meta Tags",
  "code": "<meta property=\"og:type\" content=\"website\" />\n<meta property=\"og:url\" content=\"https://example.com\" />\n<meta property=\"og:title\" content=\"My Website\" />\n<meta property=\"og:description\" content=\"Website Description\" />",
  "type": "meta",
  "position": "head"
}
```

### Adding Site Verification

```json
{
  "name": "Google Search Console Verification",
  "code": "<meta name=\"google-site-verification\" content=\"xxxxxxxxxxxxxxxxxxxxxxxxxxxxx\" />",
  "type": "verification",
  "position": "head"
}
```

### Adding Custom Scripts

```json
{
  "name": "Mixpanel Analytics",
  "code": "<script type=\"text/javascript\">\n(function(e,b){if(!b.__SV){var a,f,i,g;window.mixpanel=b;b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(\".\");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}...</script>",
  "type": "custom",
  "position": "body_start"
}
```

---

## Frontend Integration Example

### HTML Template Approach

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Head codes will be injected here -->
  <script id=\"head-codes\"></script>
</head>
<body>
  <!-- Body start codes will be injected here -->
  <script id=\"body-start-codes\"></script>

  <h1>Welcome to My Website</h1>

  <!-- Body end codes will be injected here -->
  <script id=\"body-end-codes\"></script>
</body>
</html>
```

### JavaScript Fetch & Injection

```javascript
// Fetch active custom codes from API
async function injectCustomCodes() {
  try {
    const response = await fetch('/api/custom-codes/active')
    const data = await response.json()

    // Inject head codes
    const headCodes = document.getElementById('head-codes')
    data.codes.head.forEach(code => {
      const div = document.createElement('div')
      div.innerHTML = code.code
      headCodes.appendChild(div)
    })

    // Inject body_start codes
    const bodyStartCodes = document.getElementById('body-start-codes')
    data.codes.body_start.forEach(code => {
      const div = document.createElement('div')
      div.innerHTML = code.code
      bodyStartCodes.appendChild(div)
    })

    // Inject body_end codes
    const bodyEndCodes = document.getElementById('body-end-codes')
    data.codes.body_end.forEach(code => {
      const div = document.createElement('div')
      div.innerHTML = code.code
      bodyEndCodes.appendChild(div)
    })
  } catch (error) {
    console.error('Failed to inject custom codes:', error)
  }
}

// Call when page loads
document.addEventListener('DOMContentLoaded', injectCustomCodes)
```

### React Component Example

```jsx
import { useEffect, useState } from 'react'

function CustomCodesInjector() {
  const [codes, setCodes] = useState(null)

  useEffect(() => {
    fetch('/api/custom-codes/active')
      .then(res => res.json())
      .then(data => setCodes(data.codes))
      .catch(err => console.error('Failed to load custom codes:', err))
  }, [])

  const injectCode = (code) => {
    // For analytics and tracking
    const script = document.createElement('script')
    script.innerHTML = code
    document.head.appendChild(script)
  }

  if (!codes) return null

  return (
    <>
      {codes.head?.map(code => (
        <div key={code.id} dangerouslySetInnerHTML={{ __html: code.code }} />
      ))}
      {codes.body_start?.map(code => (
        <div key={code.id} dangerouslySetInnerHTML={{ __html: code.code }} />
      ))}
      {codes.body_end?.map(code => (
        <div key={code.id} dangerouslySetInnerHTML={{ __html: code.code }} />
      ))}
    </>
  )
}

export default CustomCodesInjector
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: name, code, type, and position are required"
}
```

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 404 Not Found
```json
{
  "error": "Custom code not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database service unavailable"
}
```

---

## Type Reference

### CodeType
```typescript
type CodeType = 'analytics' | 'meta' | 'tracking' | 'verification' | 'custom'
```

**Valid Values:**
- `analytics`: Google Analytics, Mixpanel, Segment, etc.
- `meta`: Meta tags, Open Graph, Twitter Card, etc.
- `tracking`: Facebook Pixel, conversion pixels, event tracking
- `verification`: Site verification codes (Google, Bing, etc.)
- `custom`: Custom HTML, scripts, or other code snippets

### CodePosition
```typescript
type CodePosition = 'head' | 'body_start' | 'body_end'
```

**Valid Values:**
- `head`: Injected in the `<head>` section
- `body_start`: Injected at the start of the `<body>` section
- `body_end`: Injected at the end of the `<body>` section

---

## Best Practices

1. **Test Before Going Live**: Always test code snippets in a staging environment first
2. **Use Meaningful Names**: Make code names descriptive for easy identification
3. **Document Source**: Use the `author_name` field consistently to track who added codes
4. **Deactivate Before Delete**: Use the toggle status feature to test before permanent deletion
5. **Minimize Code Size**: Keep code snippets as minimal as possible to avoid performance impact
6. **Version Control**: Consider keeping backups of important codes externally
7. **Monitor Performance**: Monitor website performance after adding new codes
8. **Use Verification Codes**: Verify your website with major search engines
9. **Keep Meta Tags Updated**: Regularly review and update meta tags for SEO

---

## Troubleshooting

### Codes Not Appearing on Frontend

1. Verify codes are activated: `status: true`
2. Check the code position matches where you're injecting
3. Ensure frontend is calling `/api/custom-codes/active` endpoint
4. Check browser console for JavaScript errors
5. Verify the custom code HTML/JavaScript syntax is valid

### Performance Issues After Adding Codes

1. Disable recently added codes
2. Check code for infinite loops or blocking operations
3. Consider moving code to `body_end` instead of `head`
4. Minimize code size where possible
5. Defer script loading with `async` or `defer` attributes

### Authentication Issues

1. Verify Bearer token is valid and not expired
2. Check token is included in Authorization header: `Authorization: Bearer YOUR_TOKEN`
3. Ensure endpoint is configured to require authentication (POST, PUT, DELETE, PATCH)

