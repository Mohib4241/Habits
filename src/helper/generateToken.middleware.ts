import { IJwtPayload } from '../types/auth.types';
import { signAccessToken, signRefreshToken } from '../utility/jwt';

/**
 * Reusable helper implementation to generate complete token pairs.
 */
export const generateTokenPair = (userPayload: IJwtPayload): { accessToken: string; refreshToken: string } => {
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);
    return { accessToken, refreshToken };
};
