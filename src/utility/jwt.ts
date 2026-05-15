import jwt from 'jsonwebtoken';
import config from '../config';
import { IJwtPayload } from '../types/auth.types';

/**
 * Generate Access Token using JWT secret.
 */
export const signAccessToken = (payload: IJwtPayload): string => {
    return jwt.sign({ ...payload }, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiration as any,
    });
};

/**
 * Generate Refresh Token using JWT refresh secret.
 */
export const signRefreshToken = (payload: IJwtPayload): string => {
    return jwt.sign({ ...payload }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiration as any,
    });
};

/**
 * Verify Access Token.
 */
export const verifyAccessToken = (token: string): IJwtPayload => {
    return jwt.verify(token, config.jwt.secret) as IJwtPayload;
};

/**
 * Verify Refresh Token.
 */
export const verifyRefreshTokenUtil = (token: string): IJwtPayload => {
    return jwt.verify(token, config.jwt.refreshSecret) as IJwtPayload;
};
