/**
 * Test Environment Configuration
 * Injected before every test suite via Jest globalSetup / setupFiles.
 */

process.env.NODE_ENV        = 'test';
process.env.PORT            = '5001';
process.env.JWT_SECRET      = 'test_jwt_secret_enterprise_2024';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_enterprise_2024';
process.env.DB_HOST         = 'localhost';
process.env.DB_PORT         = '5432';
process.env.DB_USER         = 'postgres';
process.env.DB_PASSWORD     = 'postgres';
process.env.DB_NAME         = 'habit_tracker_test';
process.env.REDIS_HOST      = '127.0.0.1';
process.env.REDIS_PORT      = '6379';
