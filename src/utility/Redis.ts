import { createClient } from 'redis';
import config from '../config';

const redisClient = createClient({
    socket: {
        host: config.redis.host,
        port: config.redis.port,
    },
});

redisClient.on('error', (err) => {
    console.warn('Redis connection client warning/error:', err.message);
});

export const connectRedis = async (): Promise<void> => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('Successfully connected to Redis instance');
        }
    } catch (err) {
        console.warn('Could not establish initial connection to Redis caching utility. Continuing without active cache.');
    }
};

export const getCache = async (key: string): Promise<string | null> => {
    try {
        if (redisClient.isOpen) {
            return await redisClient.get(key);
        }
    } catch (err) {
        // silent fallback
    }
    return null;
};

export const setCache = async (key: string, value: string, ttlSeconds: number = 3600): Promise<void> => {
    try {
        if (redisClient.isOpen) {
            await redisClient.setEx(key, ttlSeconds, value);
        }
    } catch (err) {
        // silent fallback
    }
};

export const deleteCache = async (key: string): Promise<void> => {
    try {
        if (redisClient.isOpen) {
            await redisClient.del(key);
        }
    } catch (err) {
        // silent fallback
    }
};

/**
 * Safely delete keys matching a specific pattern using the SCAN command.
 * Useful for clearing all cached pages/filters for a specific user.
 */
export const deleteByPattern = async (pattern: string): Promise<void> => {
    try {
        if (redisClient.isOpen) {
            const keys = [];
            for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
                keys.push(key);
            }
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    } catch (err) {
        // silent fallback
    }
};

export { redisClient };
