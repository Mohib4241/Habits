import { getDbPool } from './postgreConnection';
import { QueryResult } from 'pg';

/**
 * Reusable helper abstraction for executing raw PostgreSQL queries.
 */
export const executeQuery = async <T>(queryText: string, params?: any[]): Promise<T[]> => {
    const pool = getDbPool();
    const result = await pool.query(queryText, params);
    return result.rows as T[];
};

/**
 * Reusable helper for executing single row result queries.
 */
export const executeSingleQuery = async <T>(queryText: string, params?: any[]): Promise<T | null> => {
    const rows = await executeQuery<T>(queryText, params);
    return rows.length > 0 ? rows[0] : null;
};
