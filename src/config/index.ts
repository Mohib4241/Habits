import 'dotenv/config';

export default {
    env:  process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 5000,

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        name:     process.env.DB_NAME     || 'habit_tracker',
    },

    jwt: {
        secret:           process.env.JWT_SECRET         || 'your_jwt_secret',
        refreshSecret:    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
        accessExpiration: '15m',
        refreshExpiration: '7d',
    },

    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
};
