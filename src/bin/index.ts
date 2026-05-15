import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from '../config';
import { initConnections, closeConnections } from '../utility/bootstrap';
import { apiRateLimiter } from '../middleware/ratelimiter';
import { requestLogger } from '../middleware/logger.middleware';
import { globalErrorHandler } from '../middleware/error.middleware';
import routes from '../routes';
import { Pool } from 'pg';

// ---------------------------------------------------------------------------
//  Express Application — Middleware & Routing Configuration
// ---------------------------------------------------------------------------

export const app = express();

// 1. Harden response headers
app.use(helmet());

// 2. Enable CORS
app.use(cors());

// 3. Parse JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Logger
app.use(requestLogger);

// 5. Global rate limiter
app.use('/api', apiRateLimiter);

// 6. Routes
app.use('/api/v1', routes);

// 8. 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `The requested resource '${req.originalUrl}' was not found on this server.`,
    });
});

// 9. Error handler
app.use(globalErrorHandler);

// ---------------------------------------------------------------------------
//  Server Bootstrap — Connects services and binds HTTP listener
// ---------------------------------------------------------------------------

const startServer = async (): Promise<void> => {
    let pool: Pool | undefined;

    try {
        console.log(`[boot] Initializing server — env: ${config.env}`);

        // i. Connect to Redis and PostgreSQL
        pool = await initConnections();

        // ii. Bind HTTP server
        const server = app.listen(config.PORT, () => {
            console.log(`[boot] Server running  → http://localhost:${config.PORT}  (${config.env})`);
        });

        // iii. Graceful shutdown
        const gracefulShutdown = (signal: string) => async () => {
            console.log(`\n[shutdown] ${signal} received — initiating graceful shutdown...`);

            server.close(async () => {
                console.log('[shutdown] HTTP server closed');
                if (pool) {
                    await closeConnections(pool);
                }
                console.log('[shutdown] Shutdown complete. Goodbye.');
                process.exit(0);
            });
        };

        process.on('SIGINT',  gracefulShutdown('SIGINT'));
        process.on('SIGTERM', gracefulShutdown('SIGTERM'));

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[boot] Fatal startup error:', message);
        process.exit(1);
    }
};

// Process-level safety net
process.on('uncaughtException', (err: Error) => {
    console.error('[process] uncaughtException:', err.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    console.error('[process] unhandledRejection:', reason);
    process.exit(1);
});

// Start the server if this file is executed directly
if (require.main === module) {
    startServer();
}
