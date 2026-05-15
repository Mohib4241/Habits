/**
 * Application Bootstrap Utility
 *
 * Encapsulates all infrastructure connection logic (Redis, PostgreSQL).
 * Called once from bin/index.ts — keeping the entry point clean.
 */

import { connectRedis } from './Redis';
import { getDbPool } from './postgreConnection';
import { Pool } from 'pg';

/**
 * Establishes all required service connections at startup.
 * Returns the active DB pool so the entry point can manage graceful shutdown.
 */
export const initConnections = async (): Promise<Pool> => {
    // 1. Redis cache layer
    await connectRedis();
    console.log('[boot] Redis connected');

    // 2. PostgreSQL — verify pool is healthy before accepting traffic
    const pool = getDbPool();
    const client = await pool.connect();
    console.log('[boot] PostgreSQL pool ready');
    client.release();

    return pool;
};

/**
 * Drains all infrastructure connections cleanly.
 * Called inside the graceful shutdown handler.
 */
export const closeConnections = async (pool: Pool): Promise<void> => {
    try {
        await pool.end();
        console.log('[shutdown] PostgreSQL pool drained and terminated');
    } catch (err) {
        console.error('[shutdown] Pool termination error:', err);
    }
};
