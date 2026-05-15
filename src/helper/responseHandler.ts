import { Response } from 'express';

export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    status_code?: number;
    error_type?: string;
    data?: T;
    error?: any;
}

/**
 * Send standardized JSON success response.
 */
export const sendSuccessResponse = <T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
): Response => {
    const payload: IApiResponse<T> = {
        success: true,
        message,
        data: data !== undefined ? data : ({} as unknown as T),
    };
    return res.status(statusCode).json(payload);
};

/**
 * Send standardized JSON error response with specific keys requested by the user.
 */
export const sendErrorResponse = (
    res: Response,
    statusCode: number,
    message: string,
    errorType: string = 'API_ERROR',
    errorDetails?: any
): Response => {
    const payload: IApiResponse = {
        success: false,
        status_code: statusCode,
        error_type: errorType,
        message,
    };
    if (errorDetails) {
        payload.error = errorDetails;
    }
    return res.status(statusCode).json(payload);
};
