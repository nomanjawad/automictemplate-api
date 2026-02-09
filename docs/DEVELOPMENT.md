# Development Guide

## Development Server

The project uses **nodemon** for automatic server restarts during development.

### Starting the Server

```bash
pnpm dev
```

This will:
- Start the server on http://localhost:3000
- Watch all files in the `src/` directory
- Automatically restart when `.ts`, `.js`, or `.json` files change
- Show verbose output for debugging

### Manual Restart

While the server is running, you can manually restart it by typing:
```
rs
```

### Alternative Dev Modes

If you need the old tsx watch mode:
```bash
pnpm dev:tsx
```

## Nodemon Configuration

The development server is configured via `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts", "node_modules"],
  "exec": "tsx --env-file=.env src/server.ts",
  "restartable": "rs",
  "env": {
    "NODE_ENV": "development"
  },
  "legacyWatch": false,
  "delay": 500,
  "verbose": true
}
```

### What Gets Watched

- ✅ All `.ts` files in `src/`
- ✅ All `.js` files in `src/`
- ✅ All `.json` files in `src/`
- ❌ Test files (`*.spec.ts`, `*.test.ts`)
- ❌ `node_modules/`

### Restart Delay

There's a **500ms delay** before restart to avoid multiple rapid restarts when saving multiple files.

## Common Issues

### Changes Not Picked Up

If nodemon isn't detecting changes:

1. **Check the file is being watched**: Nodemon shows which files trigger changes in verbose mode
2. **Manual restart**: Type `rs` and press Enter
3. **Restart nodemon**: Stop (Ctrl+C) and run `pnpm dev` again

### Port Already in Use

If you get "port 3000 already in use":

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Environment Variables Not Loading

Make sure your `.env` file exists and contains:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Development Workflow

1. **Start the server**: `pnpm dev`
2. **Make changes**: Edit files in `src/`
3. **Auto-reload**: Nodemon detects changes and restarts
4. **Test endpoints**: Use Postman or curl
5. **Check logs**: Watch the terminal for errors

### Quick Test Cycle

```bash
# Terminal 1: Run server
pnpm dev

# Terminal 2: Test endpoints
curl http://localhost:3000/api/health
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration
```

## Building for Production

```bash
# Build TypeScript to JavaScript
pnpm build

# Run production build
pnpm start
```

## Tips

1. **Use verbose mode**: Nodemon is configured to show detailed output
2. **Check health endpoint**: `http://localhost:3000/api/health` to verify server is running
3. **Manual restart**: Type `rs` if automatic reload fails
4. **Watch the logs**: Winston logger shows all requests and errors
5. **Test immediately**: Changes take effect within ~1 second after saving

## Comparison: tsx watch vs nodemon

| Feature | tsx watch | nodemon + tsx |
|---------|-----------|---------------|
| File detection | Sometimes misses changes | Always detects |
| Manual restart | ❌ No | ✅ Type `rs` |
| Verbose output | Limited | Detailed |
| Stability | Can miss barrel exports | Fully reliable |
| Configuration | Command line | Config file |

**Recommendation**: Use `pnpm dev` (nodemon) for development. It's more reliable and easier to control.
