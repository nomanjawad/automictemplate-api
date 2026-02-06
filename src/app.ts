import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import apiRouter from './routes/index.js'
import { checkAllConnections } from './db/index.js'
import { errorHandler } from './middleware/index.js'
import { logger, stream } from './utils/index.js'
import { config, isDevelopment } from './config/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// HTTP request logging with Morgan
// Use different formats for dev vs production
const morganFormat = isDevelopment ? 'dev' : 'combined'
app.use(morgan(morganFormat, { stream }))

// Configure helmet to allow inline scripts for Tailwind CDN
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      },
    },
    // Disable HSTS in development to prevent HTTPS redirect issues
    hsts: isDevelopment ? false : {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
)

// CORS configuration from config
app.use(cors({
  origin: config.CORS_ALLOWED_ORIGIN === '*' ? '*' : config.CORS_ALLOWED_ORIGIN,
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')))

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
  })
)

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const status = await checkAllConnections()
    res.json({ ok: true, status })
  } catch (err: any) {
    logger.error('Health check failed', { error: err?.message })
    res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
})

// API routes
app.use('/api', apiRouter)

// Error handling middleware (must be last)
app.use(errorHandler)

export default app
