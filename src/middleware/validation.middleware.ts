import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { sendErrorResponse } from '../helper/responseHandler';

/**
 * Enterprise middleware to execute Joi schema validation against incoming Request payload.
 */
export const validateRequest = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const formattedErrors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            sendErrorResponse(res, 422, 'Validation Error: Unprocessable Entity', 'VALIDATION_ERROR', formattedErrors);
            return;
        }

        // Reassign validated/stripped values back to request object
        req[property] = value;
        next();
    };
};
