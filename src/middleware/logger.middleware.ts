import morgan from 'morgan';
import config from '../config';

/**
 * Enterprise HTTP request logger middleware mapping environments to formatted morgan profiles.
 */
export const requestLogger = morgan(
    config.env === 'development' ? 'dev' : 'combined'
);
