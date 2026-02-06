import app from './app.js'
import { checkAllConnections } from './db/index.js'
import { config, logConfigSummary, isDevelopment } from './config/index.js'
import { logger } from './utils/index.js'
import { networkInterfaces } from 'os'

const PORT = config.PORT

// Get local network IP address
function getLocalIP(): string | null {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    const netInterface = nets[name]
    if (!netInterface) continue

    for (const net of netInterface) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return null
}

async function start() {
  try {
    // Log configuration summary
    logConfigSummary()

    logger.info(`🚀 Server starting on port ${PORT}...`)
    logger.info('━'.repeat(50))

    // Check database and service connections
    const status = await checkAllConnections()

    if (status.healthy) {
      logger.info('✓ All services are healthy!')
    } else {
      logger.warn('⚠ Some services are not responding')
    }

    // Log connection status in development
    if (isDevelopment) {
      logger.debug('📊 Connection Status:')
      logger.debug(JSON.stringify(status, null, 2))
    }

    logger.info('━'.repeat(50))

    // Handle graceful shutdown
    if (typeof process.send === 'function') {
      process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server')
        process.exit(0)
      })
    }

    // Start the server
    // Bind to 0.0.0.0 to make it accessible from network (like Next.js)
    app.listen(PORT, '0.0.0.0', () => {
      const localIP = getLocalIP()

      logger.info(`✓ Server is running on http://localhost:${PORT}`)
      if (localIP) {
        logger.info(`✓ Network access: http://${localIP}:${PORT}`)
      }
      logger.info(`✓ Health check available at http://localhost:${PORT}/api/health`)
      logger.info(`✓ Environment: ${config.NODE_ENV}`)
      logger.info('')
    })
  } catch (err: any) {
    logger.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
