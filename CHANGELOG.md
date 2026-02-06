# Changelog

## 2025-12-11 - Development Environment & Email Validation Improvements

### Fixed
- **Duplicate Email Detection** - Fixed issue where API returned 201 success even when email already exists
  - Added detection for Supabase's null session response on duplicate emails
  - Now correctly returns 409 Conflict status when email already registered
  - Enhanced logging to track duplicate registration attempts

### Changed
- **Development Server** - Switched from `tsx watch` to `nodemon + tsx`
  - **Problem**: tsx watch wasn't reliably picking up file changes, especially with barrel exports
  - **Solution**: Implemented nodemon with custom configuration for better file watching
  - **Benefits**:
    - Automatic restarts on file changes (guaranteed)
    - Manual restart capability (type `rs`)
    - Verbose output for debugging
    - 500ms delay to prevent rapid restarts
    - Better control and reliability

### Added
- **nodemon.json** - Development server configuration
  - Watches all `.ts`, `.js`, `.json` files in `src/`
  - Ignores test files and node_modules
  - Configurable restart delay
  - Verbose mode for debugging

- **DEVELOPMENT.md** - Comprehensive development guide
  - How to start the dev server
  - Manual restart instructions
  - Common issues and solutions
  - Comparison of tsx watch vs nodemon

- **test-duplicate-email.sh** - Shell script for testing duplicate email validation
  - Tests registration with new email
  - Tests registration with duplicate email
  - Verifies 409 Conflict response

### Technical Details

#### Supabase Duplicate Email Behavior
When `signUp()` is called with an existing email, Supabase:
1. Returns `data.user` with existing user info
2. Returns `data.session = null` (no session created)
3. Does NOT throw an error (to prevent email enumeration attacks)

Our fix checks for the null session to detect duplicates:
```typescript
if (!data.session || !data.user.identities || data.user.identities.length === 0) {
  return res.status(409).json({ error: 'Email already registered. Please login instead.' })
}
```

#### Nodemon Configuration
```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "exec": "tsx --env-file=.env src/server.ts",
  "delay": 500,
  "verbose": true
}
```

### Package Updates
- Added `nodemon@3.1.11` as dev dependency

### Scripts Updated
- `pnpm dev` - Now uses nodemon (recommended)
- `pnpm dev:tsx` - Falls back to tsx watch if needed

### Files Modified
- [src/controllers/auth.controller.ts](src/controllers/auth.controller.ts#L68) - Added null session check
- [package.json](package.json#L6) - Updated dev script to use nodemon
- [README.md](README.md#L69) - Added nodemon information

### Files Created
- `nodemon.json` - Nodemon configuration
- `DEVELOPMENT.md` - Development guide
- `test-duplicate-email.sh` - Email validation test script
- `CHANGELOG.md` - This file

### Testing
All changes have been tested:
- ✅ Duplicate email correctly returns 409 Conflict
- ✅ Nodemon detects file changes and restarts automatically
- ✅ Manual restart (`rs`) works correctly
- ✅ Server starts successfully on http://localhost:3000
- ✅ All existing endpoints continue to work

### Migration Notes
If you're currently running `pnpm dev`:
1. Stop the current server (Ctrl+C)
2. Run `pnpm install` to get nodemon
3. Run `pnpm dev` again
4. Changes will now be picked up automatically
5. Type `rs` + Enter to manually restart if needed

### Known Issues
- Supabase has rate limiting on signup attempts (~60 seconds between attempts from same IP)
- Supabase rejects some email domains (example.com, test.com) - use realistic domains like gmail.com for testing
