import { Request } from 'express';

export interface IUser {
    id: number;
    email: string;
    name: string;
    password_hash?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface IJwtPayload {
    id: number;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: IJwtPayload;
}

export interface IAuthResponse {
    user: {
        id: number;
        email: string;
        name: string;
    };
    accessToken: string;
    refreshToken: string;
}
