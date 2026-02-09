# Postman Testing Guide

## Import the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `postman-collection.json` from this directory
5. Click **Import**

## Quick Start Testing

### Step 1: Register a User (or Login)

If you don't have an account:
```
POST {{baseUrl}}/auth/register

Body (JSON):
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "full_name": "Test User"
}
```

**The token is automatically saved!** ✅

Or login if you already have an account:
```
POST {{baseUrl}}/auth/login

Body (JSON):
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

### Step 2: Verify Your Token

```
GET {{baseUrl}}/auth/verify
Authorization: Bearer {{token}}
```

Response:
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User",
    "created_at": "2025-12-11T..."
  }
}
```

### Step 3: Create Home Page Content

```
PUT {{baseUrl}}/content/pages/home
Authorization: Bearer {{token}}

Body (JSON):
{
  "title": "Home Page",
  "data": {
    "banner": {
      "title": "Welcome to SkyTech",
      "description": "We build amazing things",
      "backgroundImageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920",
      "heroImageUrl": "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800",
      "button": {
        "text": "Get Started",
        "url": "/contact"
      }
    }
  },
  "meta_data": {
    "metaTitle": "Home - SkyTech",
    "metaDescription": "We build amazing things"
  },
  "published": true
}
```

### Step 4: Get the Home Page

```
GET {{baseUrl}}/content/pages/home
```

No authentication needed for published pages!

## Collection Organization

### 📁 Authentication
- **Register User** - Create new account (auto-saves token)
- **Login** - Login existing user (auto-saves token)
- **Verify Token** - Verify JWT with Supabase
- **Get Profile** - Get current user info
- **Logout** - End session

### 📁 Content Pages
- **Get All Pages** - List all pages
- **Get Page by Slug** - Get specific page
- **Create/Update Home Page** - Upsert home page
- **Delete Page** - Remove a page

### 📁 Common Content
- **Get All Common Content** - List all common content
- **Get Common Content by Key** - Get specific item
- **Create/Update Common Content** - Upsert content

### 📁 Blog
- **Get All Blog Posts** - List with pagination
- **Get Blog Post by Slug** - Get specific post
- **Create Blog Post** - Add new post
- **Update Blog Post** - Edit existing post
- **Delete Blog Post** - Remove post

### 📁 Health & Status
- **Health Check** - Check API and database status

## Variables

The collection uses two variables:

1. **{{baseUrl}}** - API base URL (default: `http://localhost:3000/api`)
2. **{{token}}** - JWT access token (auto-saved after login/register)

### To Change Base URL:

1. Click on the collection name
2. Go to **Variables** tab
3. Change `baseUrl` value
4. Click **Save**

## Auto-Save Token Feature

The Login and Register requests include a **Test Script** that automatically:
1. Extracts the token from response
2. Saves it to collection variable
3. Makes it available for all protected endpoints

You can see the script in the **Tests** tab of Login/Register requests:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('token', response.session.access_token);
    console.log('Token saved:', response.session.access_token);
}
```

## Testing Protected Endpoints

All protected endpoints automatically use `{{token}}` variable in the Authorization header:

```
Authorization: Bearer {{token}}
```

You don't need to manually copy/paste tokens!

## Common Test Scenarios

### 1. Test Authentication Flow
1. Register User → saves token
2. Verify Token → confirms token works
3. Get Profile → gets user data
4. Logout → ends session

### 2. Test Content Management
1. Login → get token
2. Create/Update Home Page → saves content
3. Get Page by Slug → verify data
4. Get All Pages → see all pages

### 3. Test Blog Workflow
1. Login → get token
2. Create Blog Post → add post
3. Get Blog Post by Slug → verify post
4. Update Blog Post → edit post
5. Get All Blog Posts → list all

### 4. Test Public vs Protected
1. Get Page (no auth) → works ✅
2. Update Page (no auth) → fails 401 ❌
3. Login → get token
4. Update Page (with auth) → works ✅

## Response Examples

### Successful Login (200)
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "...",
    "expires_at": "2025-12-11T..."
  }
}
```

### Token Verification (200)
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User",
    "created_at": "2025-12-11T..."
  }
}
```

### Invalid Token (401)
```json
{
  "error": "Invalid or expired token"
}
```

### Page Created (201)
```json
{
  "message": "Page created successfully",
  "data": {
    "id": "uuid",
    "slug": "home",
    "title": "Home Page",
    "data": { ... },
    "published": true
  }
}
```

## Tips

1. **Run Login First** - Most endpoints need authentication
2. **Check Console** - Token save confirmations appear in Postman console
3. **Use Environments** - Create environments for dev/staging/prod
4. **Test Scripts** - Customize test scripts for your needs
5. **Save Responses** - Use "Save Response" to document expected outputs

## Troubleshooting

### "Authorization token required"
- Run Login or Register first
- Check token is saved: View → Show Postman Console
- Verify {{token}} variable is set in collection variables

### "Invalid or expired token"
- Token expires after some time
- Run Login again to get fresh token
- Check Supabase dashboard for user status

### Connection refused
- Ensure server is running: `pnpm dev`
- Check baseUrl variable points to correct host
- Verify port 3000 is not blocked

### 404 Not Found
- Check endpoint path is correct
- Ensure server has latest code
- Restart server if needed

## Environment Setup (Optional)

Create environments for different stages:

**Development:**
- baseUrl: `http://localhost:3000/api`

**Staging:**
- baseUrl: `https://staging.yourapp.com/api`

**Production:**
- baseUrl: `https://api.yourapp.com/api`

Switch between environments using the dropdown in top-right corner.
