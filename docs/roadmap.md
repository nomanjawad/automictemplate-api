# Roadmap

## Completed ✅

- [x] Express server with TypeScript
- [x] Supabase Auth integration
- [x] JWT-based authentication
- [x] Session management
- [x] Health check system
- [x] Path aliases for clean imports
- [x] Repository pattern for data access
- [x] Winston logging
- [x] Zod validation with @atomictemplate/validations
- [x] **Blog Posts** - Full CRUD with publish/unpublish
- [x] **Content Management** - Common + Page content (JSONB)
- [x] **File Upload** - Single/multiple images to Supabase Storage
- [x] Database migrations (users, content_common, content_pages, blog_posts)

---

## Planned Features

### Phase 1: Content Enhancements

- [ ] **Gallery System**
  - Create `gallery` table
  - Gallery management endpoints
  - Categories and tags

- [ ] **Success Stories**
  - Create `success_stories` table
  - Media attachments
  - Featured stories

### Phase 2: Training & Programs

- [ ] **Training Programs**
  - Create `training_programs` table
  - Program categories
  - Scheduling

- [ ] **Enrollment System**
  - User enrollment
  - Progress tracking
  - Completion certificates

### Phase 3: Communication

- [ ] **Contact Form**
  - Create `contact_submissions` table
  - Email notifications
  - Spam protection (reCAPTCHA)

- [ ] **Notifications**
  - Email templates
  - In-app notifications

### Phase 4: Quality & Deployment

- [ ] **Testing** (in progress)
  - Unit tests with Jest
  - Integration tests
  - E2E API tests

- [ ] **Documentation**
  - OpenAPI/Swagger spec
  - Deployment guide

- [ ] **DevOps**
  - CI/CD pipeline
  - Docker containerization
  - Production deployment

---

## Database Migrations

```bash
# Create migration
supabase migration new create_gallery

# Apply migrations
supabase db push
```
