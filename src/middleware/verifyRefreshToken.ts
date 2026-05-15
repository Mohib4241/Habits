import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { verifyRefreshTokenUtil } from '../utility/jwt';
import { sendErrorResponse } from '../helper/responseHandler';

/**
 * Middleware to validate incoming JWT Refresh Tokens.
 */
export const verifyRefreshToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const { token } = req.body;

    if (!token) {
        sendErrorResponse(res, 400, 'Bad Request: Refresh token is required in the request body');
        return;
    }

    try {
        const decoded = verifyRefreshTokenUtil(token);
        req.user = decoded;
        next();
    } catch (err: any) {
        sendErrorResponse(res, 403, 'Forbidden access: Invalid or expired Refresh Token');
        return;
    }
};
