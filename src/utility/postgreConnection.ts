import { Pool } from 'pg';
import config from '../config';

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    max: 20, // max number of connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

export const getDbPool = (): Pool => {
    return pool;
};
