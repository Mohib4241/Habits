import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { verifyAccessToken } from '../utility/jwt';
import { sendErrorResponse } from '../helper/responseHandler';

/**
 * Middleware to protect routes by validating incoming JWT Bearer Access Tokens.
 */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendErrorResponse(res, 401, 'Unauthorized access: Missing or malformed Bearer token');
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err: any) {
        const message = err.name === 'TokenExpiredError' 
            ? 'Unauthorized access: Token has expired' 
            : 'Unauthorized access: Invalid token signature';
        sendErrorResponse(res, 403, message);
        return;
    }
};
